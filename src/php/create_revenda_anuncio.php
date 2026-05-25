<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

function responder_json($status_code, $payload)
{
    http_response_code($status_code);
    echo json_encode($payload);
    exit;
}

function publicar_anuncio_ingresso($conn, $id_ingresso, $valor_revenda, $id_participante)
{
    $existingStmt = $conn->prepare(
        "SELECT id_revenda_anuncios
         FROM revenda_anuncios
         WHERE id_ingresso = ?
           AND status IN ('vendido', 'cancelado')
         ORDER BY id_revenda_anuncios DESC
         LIMIT 1"
    );
    if (!$existingStmt) {
        return ['ok' => false, 'error' => 'Falha ao preparar consulta de anuncios antigos.'];
    }
    $existingStmt->bind_param('i', $id_ingresso);
    if (!$existingStmt->execute()) {
        $existingStmt->close();
        return ['ok' => false, 'error' => 'Falha ao buscar anuncios antigos.'];
    }
    $existingResult = $existingStmt->get_result();
    $oldListing = $existingResult->fetch_assoc();
    $existingStmt->close();

    if ($oldListing) {
        $stmt = $conn->prepare(
            "UPDATE revenda_anuncios
             SET valor_revenda = ?, status = 'disponivel', id_participante = ?
             WHERE id_revenda_anuncios = ?"
        );
        if (!$stmt) {
            return ['ok' => false, 'error' => 'Falha ao preparar atualizacao de anuncio existente.'];
        }
        $stmt->bind_param('dii', $valor_revenda, $id_participante, $oldListing['id_revenda_anuncios']);
        if (!$stmt->execute()) {
            $stmt->close();
            return ['ok' => false, 'error' => 'Falha ao atualizar anuncio de revenda existente.'];
        }
        $stmt->close();
        return ['ok' => true];
    }

    $stmt = $conn->prepare(
        "INSERT INTO revenda_anuncios (valor_revenda, status, id_ingresso, id_participante)
         VALUES (?, 'disponivel', ?, ?)"
    );
    if (!$stmt) {
        return ['ok' => false, 'error' => 'Falha ao preparar insercao de anuncio.'];
    }
    $stmt->bind_param('dii', $valor_revenda, $id_ingresso, $id_participante);
    if (!$stmt->execute()) {
        $stmt->close();
        return ['ok' => false, 'error' => 'Falha ao criar anuncio de revenda.'];
    }
    $stmt->close();
    return ['ok' => true];
}

if (!$conn || $conn->connect_error) {
    responder_json(500, ['success' => false, 'error' => 'Erro de conexao com o banco de dados.']);
}

if (!isset($_SESSION['usuario_cpf']) || empty($_SESSION['usuario_cpf'])) {
    responder_json(401, ['success' => false, 'error' => 'Participante nao autenticado.']);
}

$dados = json_decode(file_get_contents('php://input'), true);
$id_evento = isset($dados['id_evento']) ? (int) $dados['id_evento'] : 0;
$id_tipo_ingresso = isset($dados['id_tipo_ingresso']) ? (int) $dados['id_tipo_ingresso'] : 0;
$quantidade = isset($dados['quantidade']) ? (int) $dados['quantidade'] : 1;
$valor_revenda_total = isset($dados['valor_revenda_total']) ? (float) $dados['valor_revenda_total'] : 0.0;

if ($quantidade < 1) {
    $quantidade = 1;
}

if ($valor_revenda_total <= 0 && isset($dados['valor_revenda'])) {
    $valor_revenda_total = (float) $dados['valor_revenda'] * $quantidade;
}

$valor_revenda = round($valor_revenda_total / $quantidade, 2);

if ($id_evento <= 0 || $id_tipo_ingresso <= 0 || $valor_revenda_total <= 0 || $valor_revenda <= 0) {
    responder_json(400, ['success' => false, 'error' => 'Dados invalidos. Informe evento, tipo de ingresso e valor total de revenda.']);
}

$cpf = $_SESSION['usuario_cpf'];
$conn->set_charset('utf8mb4');

$stmt = $conn->prepare("SELECT id_participante FROM participantes WHERE cpf = ? LIMIT 1");
if (!$stmt) {
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar consulta do participante.']);
}
$stmt->bind_param('s', $cpf);
if (!$stmt->execute()) {
    $stmt->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao buscar participante autenticado.']);
}

$res = $stmt->get_result();
$participante = $res->fetch_assoc();
$stmt->close();

if (!$participante) {
    responder_json(404, ['success' => false, 'error' => 'Participante nao encontrado.']);
}
$id_participante = (int) $participante['id_participante'];

$stmt = $conn->prepare(
    "SELECT i.id_ingresso
     FROM ingressos i
     LEFT JOIN revenda_anuncios ra ON ra.id_ingresso = i.id_ingresso AND ra.status = 'disponivel'
     WHERE i.id_participante = ?
       AND i.id_evento = ?
       AND i.id_tipo_ingresso = ?
       AND i.status = 'ativo'
       AND ra.id_revenda_anuncios IS NULL
     ORDER BY i.id_ingresso ASC
     LIMIT ?"
);

if (!$stmt) {
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar consulta de ingressos.']);
}
$stmt->bind_param('iiii', $id_participante, $id_evento, $id_tipo_ingresso, $quantidade);
if (!$stmt->execute()) {
    $stmt->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao buscar ingressos para revenda.']);
}

$res = $stmt->get_result();
$ingressos = [];
while ($row = $res->fetch_assoc()) {
    $ingressos[] = (int) $row['id_ingresso'];
}
$stmt->close();

if (count($ingressos) < $quantidade) {
    responder_json(
        409,
        [
            'success' => false,
            'error' => 'Quantidade indisponivel para revenda. Voce possui apenas ' . count($ingressos) . ' ingresso(s) livre(s).'
        ]
    );
}

$conn->begin_transaction();
$publicados = 0;

foreach ($ingressos as $id_ingresso) {
    $resultado = publicar_anuncio_ingresso($conn, $id_ingresso, $valor_revenda, $id_participante);
    if (!$resultado['ok']) {
        $conn->rollback();
        responder_json(500, ['success' => false, 'error' => $resultado['error']]);
    }
    $publicados++;
}

$conn->commit();
$conn->close();

$mensagem = $publicados === 1
    ? 'Anuncio de revenda publicado com sucesso.'
    : $publicados . ' anuncios de revenda publicados com sucesso.';

responder_json(200, ['success' => true, 'message' => $mensagem, 'quantidade_publicada' => $publicados]);
