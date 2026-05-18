<?php
// criar-evento.php - Cria um novo evento com tipos de ingressos, line-up de artistas e upload de imagem
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

// Verificar autenticação
if (!isset($_SESSION['usuario_cnpj'])) {
    echo json_encode(['success' => false, 'error' => 'Usuário não autenticado. Faça login novamente.']);
    exit;
}

// Tenta obter dados do $_POST (FormData)
$dados_post = $_POST;

// Se $_POST estiver vazio, tenta ler o corpo da requisição (JSON)
if (empty($dados_post)) {
    $json_input = json_decode(file_get_contents('php://input'), true);
    if ($json_input) {
        $dados_post = $json_input;
    }
}

if (empty($dados_post)) {
    echo json_encode([
        'success' => false, 
        'error' => 'Dados não recebidos pelo servidor.',
        'debug' => [
            'post' => $_POST,
            'files' => $_FILES,
            'method' => $_SERVER['REQUEST_METHOD'],
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'não definido'
        ]
    ]);
    exit;
}

// Extrair e sanitizar campos usando a variável unificada $dados_post
$nome              = trim($dados_post['nome']      ?? '');
$descricao         = trim($dados_post['descricao'] ?? '');
$data_raw          = trim($dados_post['data']      ?? '');
$local             = trim($dados_post['local']     ?? '');
$cidade            = trim($dados_post['cidade']    ?? '');
$estado            = trim($dados_post['estado']    ?? '');
$cep               = preg_replace('/\D/', '', $dados_post['cep'] ?? '');
$id_genero_musical = $dados_post['genero']        ?? '';

// Decodificar campos complexos apenas se vierem como string (FormData)
$artistas = is_string($dados_post['artistas'] ?? null) 
    ? json_decode($dados_post['artistas'], true) 
    : ($dados_post['artistas'] ?? []);

$tiposIngressos = is_string($dados_post['tiposIngressos'] ?? null) 
    ? json_decode($dados_post['tiposIngressos'], true) 
    : ($dados_post['tiposIngressos'] ?? []);

$cnpj_organizador  = $_SESSION['usuario_cnpj'];

// ─── Validações de campos obrigatórios ─────────────────────────────────────
if (empty($nome) || empty($descricao) || empty($data_raw) || empty($local) || empty($cidade)) {
    echo json_encode(['success' => false, 'error' => 'Preencha todos os campos obrigatórios.']);
    exit;
}

// ─── Lógica de Upload de Imagem ─────────────────────────────────────────────
$nome_imagem = null;
if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['imagem']['tmp_name'];
    $fileName = $_FILES['imagem']['name'];
    $fileSize = $_FILES['imagem']['size'];
    $fileType = $_FILES['imagem']['type'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));

    // Validar extensões
    $allowedfileExtensions = array('jpg', 'gif', 'png', 'jpeg', 'webp');
    if (in_array($fileExtension, $allowedfileExtensions)) {
        // Validar tamanho (5MB)
        if ($fileSize < 5 * 1024 * 1024) {
            // Gerar nome único para o arquivo
            $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
            
            // Diretório de upload
            $uploadFileDir = '../uploads/';
            if (!is_dir($uploadFileDir)) {
                mkdir($uploadFileDir, 0755, true);
            }
            $dest_path = $uploadFileDir . $newFileName;

            if (move_uploaded_file($fileTmpPath, $dest_path)) {
                $nome_imagem = $newFileName;
            } else {
                echo json_encode(['success' => false, 'error' => 'Erro ao mover o arquivo para o diretório de uploads.']);
                exit;
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'O arquivo é muito grande (Máx 5MB).']);
            exit;
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Extensão de arquivo não permitida.']);
        exit;
    }
}

// Formatar data para MySQL DATETIME
$data_formatada = date('Y-m-d H:i:s', strtotime($data_raw));

// Buscar id_organizador pelo CNPJ da sessão
$stmt_org = $conn->prepare("SELECT id_organizador FROM organizadores WHERE cnpj = ?");
$stmt_org->bind_param("s", $cnpj_organizador);
$stmt_org->execute();
$result_org = $stmt_org->get_result();

if ($result_org->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Organizador não encontrado.']);
    exit;
}

$org = $result_org->fetch_assoc();
$id_organizador = (int)$org['id_organizador'];
$stmt_org->close();

// ─── Transação ────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // 1. Inserir evento (agora incluindo a coluna imagem)
    $stmt_evento = $conn->prepare(
        "INSERT INTO eventos (nome, data, descricao, imagem, localizacao, cidade, estado, cep, id_organizador, id_genero_musical)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    // tipos: s=nome, s=data, s=descricao, s=imagem, s=localizacao, s=cidade, s=estado, s=cep, i=id_organizador, i=id_genero_musical
    $stmt_evento->bind_param(
        "ssssssssii",
        $nome, $data_formatada, $descricao, $nome_imagem, $local, $cidade, $estado, $cep, $id_organizador, $id_genero_musical
    );
    $stmt_evento->execute();
    $id_evento = $conn->insert_id;
    $stmt_evento->close();

    // Cria comunidade automaticamente para o evento
    $stmt_comunidade = $conn->prepare(
        "INSERT INTO comunidades (nome, descricao, id_evento) VALUES (?, ?, ?)"
    );
    $nome_comunidade = "Comunidade: " . $nome;
    $desc_comunidade = "Comunidade oficial do evento " . $nome . " em " . $cidade . "/" . $estado . ".";
    $stmt_comunidade->bind_param('ssi', $nome_comunidade, $desc_comunidade, $id_evento);
    $stmt_comunidade->execute();
    $stmt_comunidade->close();

    // 2. Inserir tipos de ingressos
    $stmt_ingresso = $conn->prepare(
        "INSERT INTO tipos_ingressos (nome_tipo, valor, quantidade_disponivel, id_evento)
         VALUES (?, ?, ?, ?)"
    );
    foreach ($tiposIngressos as $tipo) {
        $nome_tipo  = trim($tipo['nome']);
        $valor      = (float)$tipo['preco'];
        $quantidade = (int)$tipo['quantidade'];
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

    $conn->commit();
    echo json_encode(['success' => true, 'id_evento' => $id_evento, 'message' => 'Evento criado com sucesso!']);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => 'Erro ao criar evento: ' . $e->getMessage()]);
}

$conn->close();
?>