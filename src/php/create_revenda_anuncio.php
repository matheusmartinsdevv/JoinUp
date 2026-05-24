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

if (!$conn || $conn->connect_error) {
    responder_json(500, ['success' => false, 'error' => 'Erro de conexao com o banco de dados.']);
}

if (!isset($_SESSION['usuario_cpf']) || empty($_SESSION['usuario_cpf'])) {
    responder_json(401, ['success' => false, 'error' => 'Participante nao autenticado.']);
}

$dados = json_decode(file_get_contents('php://input'), true);
$id_ingresso = isset($dados['id_ingresso']) ? (int) $dados['id_ingresso'] : 0;
$valor_revenda = isset($dados['valor_revenda']) ? (float) $dados['valor_revenda'] : 0.0;

if ($id_ingresso <= 0 || $valor_revenda <= 0) {
    responder_json(400, ['success' => false, 'error' => 'Dados invalidos. Informe ingresso e valor de revenda.']);
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
     WHERE i.id_ingresso = ?
       AND i.id_participante = ?
       AND i.status = 'ativo'
       AND ra.id_revenda_anuncios IS NULL
     LIMIT 1"
);

if (!$stmt) {
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar consulta de ingresso.']);
}
$stmt->bind_param('ii', $id_ingresso, $id_participante);
if (!$stmt->execute()) {
    $stmt->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao verificar ingresso.']);
}

$res = $stmt->get_result();
$ticket = $res->fetch_assoc();
$stmt->close();

if (!$ticket) {
    responder_json(409, ['success' => false, 'error' => 'Ingresso nao disponivel para revenda.']);
}

$stmt = $conn->prepare(
    "INSERT INTO revenda_anuncios (valor_revenda, status, id_ingresso, id_participante)
     VALUES (?, 'disponivel', ?, ?)"
);
if (!$stmt) {
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar insercao de anuncio.']);
}
$stmt->bind_param('dii', $valor_revenda, $id_ingresso, $id_participante);
if (!$stmt->execute()) {
    $stmt->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao criar anuncio de revenda.']);
}
$stmt->close();
$conn->close();

responder_json(200, ['success' => true, 'message' => 'Anuncio de revenda publicado com sucesso.']);
