<?php
// criar-evento.php - Cria um novo evento com tipos de ingressos e line-up de artistas
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

// Verificar autenticação
if (!isset($_SESSION['usuario_cnpj'])) {
    echo json_encode(['success' => false, 'error' => 'Usuário não autenticado. Faça login novamente.']);
    exit;
}

// Receber dados JSON enviados pelo fetch do frontend
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !is_array($input)) {
    echo json_encode(['success' => false, 'error' => 'Dados inválidos recebidos pelo servidor.']);
    exit;
}

// Extrair e sanitizar campos
$nome              = trim($input['nome']      ?? '');
$descricao         = trim($input['descricao'] ?? '');
$data_raw          = trim($input['data']      ?? '');
$local             = trim($input['local']     ?? '');
$cidade            = trim($input['cidade']    ?? '');
$estado            = trim($input['estado']    ?? '');
$cep               = preg_replace('/\D/', '', $input['cep'] ?? ''); // só dígitos
$id_genero_musical = $input['genero']        ?? '';
$artistas          = $input['artistas']      ?? [];
$tiposIngressos    = $input['tiposIngressos'] ?? [];
$cnpj_organizador  = $_SESSION['usuario_cnpj'];

// ─── Validações ────────────────────────────────────────────────────────────

// Campos de texto obrigatórios
if (empty($nome) || empty($descricao) || empty($data_raw) || empty($local) || empty($cidade)) {
    echo json_encode(['success' => false, 'error' => 'Preencha todos os campos obrigatórios.']);
    exit;
}

// Validar estado (ENUM do banco)
$estados_validos = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
if (!in_array($estado, $estados_validos)) {
    echo json_encode(['success' => false, 'error' => 'Estado inválido.']);
    exit;
}

// Validar CEP: exatamente 8 dígitos (VARCHAR(8) no banco, sem hífen)
if (strlen($cep) !== 8) {
    echo json_encode(['success' => false, 'error' => 'CEP inválido. Use o formato 00000-000.']);
    exit;
}

// Validar gênero musical
if (!is_numeric($id_genero_musical) || (int)$id_genero_musical <= 0) {
    echo json_encode(['success' => false, 'error' => 'Selecione um gênero musical válido.']);
    exit;
}
$id_genero_musical = (int)$id_genero_musical;

// Validar artistas
if (empty($artistas) || !is_array($artistas)) {
    echo json_encode(['success' => false, 'error' => 'Selecione ao menos um artista para o line-up.']);
    exit;
}

// Validar tipos de ingressos
if (empty($tiposIngressos) || !is_array($tiposIngressos)) {
    echo json_encode(['success' => false, 'error' => 'Adicione ao menos um tipo de ingresso.']);
    exit;
}
foreach ($tiposIngressos as $tipo) {
    if (empty($tipo['nome']) || !isset($tipo['preco']) || !isset($tipo['quantidade'])) {
        echo json_encode(['success' => false, 'error' => 'Dados de ingresso incompletos.']);
        exit;
    }
    if (!is_numeric($tipo['preco']) || $tipo['preco'] < 0) {
        echo json_encode(['success' => false, 'error' => 'Preço de ingresso inválido.']);
        exit;
    }
    if (!is_numeric($tipo['quantidade']) || (int)$tipo['quantidade'] < 1) {
        echo json_encode(['success' => false, 'error' => 'Quantidade de ingresso inválida.']);
        exit;
    }
}

// Formatar data para MySQL DATETIME
$data_formatada = date('Y-m-d H:i:s', strtotime($data_raw));
if (!$data_formatada || $data_formatada === '1970-01-01 00:00:00') {
    echo json_encode(['success' => false, 'error' => 'Data do evento inválida.']);
    exit;
}

// ─── Buscar id_organizador pelo CNPJ da sessão ─────────────────────────────
$stmt_org = $conn->prepare("SELECT id_organizador FROM organizadores WHERE cnpj = ?");
$stmt_org->bind_param("s", $cnpj_organizador);
$stmt_org->execute();
$result_org = $stmt_org->get_result();

if ($result_org->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Organizador não encontrado. Faça login novamente.']);
    exit;
}

$org = $result_org->fetch_assoc();
$id_organizador = (int)$org['id_organizador'];
$stmt_org->close();

// ─── Transação ────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // 1. Inserir evento
    // Colunas: nome, data, descricao, localizacao, cidade, estado, cep, id_organizador, id_genero_musical
    $stmt_evento = $conn->prepare(
        "INSERT INTO eventos (nome, data, descricao, localizacao, cidade, estado, cep, id_organizador, id_genero_musical)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    // tipos: s=nome, s=data, s=descricao, s=localizacao, s=cidade, s=estado, s=cep, i=id_organizador, i=id_genero_musical
    $stmt_evento->bind_param(
        "sssssssii",
        $nome, $data_formatada, $descricao, $local, $cidade, $estado, $cep, $id_organizador, $id_genero_musical
    );
    $stmt_evento->execute();
    $id_evento = $conn->insert_id;
    $stmt_evento->close();

    // 2. Inserir tipos de ingressos
    // Colunas: nome_tipo, valor (DECIMAL(8,2)), quantidade_disponivel, id_evento
    $stmt_ingresso = $conn->prepare(
        "INSERT INTO tipos_ingressos (nome_tipo, valor, quantidade_disponivel, id_evento)
         VALUES (?, ?, ?, ?)"
    );
    foreach ($tiposIngressos as $tipo) {
        $nome_tipo  = trim($tipo['nome']);
        $valor      = (float)$tipo['preco'];
        $quantidade = (int)$tipo['quantidade'];
        // tipos: s=nome_tipo, d=valor, i=quantidade, i=id_evento
        $stmt_ingresso->bind_param("sdii", $nome_tipo, $valor, $quantidade, $id_evento);
        $stmt_ingresso->execute();
    }
    $stmt_ingresso->close();

    // 3. Inserir line-up de artistas
    $stmt_lineup = $conn->prepare("INSERT INTO line_up (id_evento, id_artista) VALUES (?, ?)");
    foreach ($artistas as $id_artista) {
        $id_artista = (int)$id_artista;
        if ($id_artista > 0) {
            $stmt_lineup->bind_param("ii", $id_evento, $id_artista);
            $stmt_lineup->execute();
        }
    }
    $stmt_lineup->close();

    // Confirmar transação
    $conn->commit();
    echo json_encode(['success' => true, 'id_evento' => $id_evento, 'message' => 'Evento criado com sucesso!']);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => 'Erro ao criar evento: ' . $e->getMessage()]);
}

$conn->close();
?>