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
$id_revenda = isset($dados['id_revenda_anuncios']) ? (int) $dados['id_revenda_anuncios'] : 0;

if ($id_revenda <= 0) {
    responder_json(400, ['success' => false, 'error' => 'Dados invalidos. Informe o anuncio de revenda.']);
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

$id_comprador = (int) $participante['id_participante'];

$stmt = $conn->prepare(
    "SELECT
        ra.id_revenda_anuncios,
        ra.id_participante AS id_vendedor,
        ra.id_ingresso,
        e.data AS evento_data,
        i.id_participante AS id_proprietario
     FROM revenda_anuncios ra
     INNER JOIN ingressos i ON i.id_ingresso = ra.id_ingresso
     INNER JOIN eventos e ON e.id_evento = i.id_evento
     WHERE ra.id_revenda_anuncios = ?
       AND ra.status = 'disponivel'
     LIMIT 1"
);
if (!$stmt) {
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar consulta do anuncio.']);
}
$stmt->bind_param('i', $id_revenda);
if (!$stmt->execute()) {
    $stmt->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao buscar anuncio de revenda.']);
}

$res = $stmt->get_result();
$revenda = $res->fetch_assoc();
$stmt->close();

if (!$revenda) {
    responder_json(404, ['success' => false, 'error' => 'Anuncio de revenda nao encontrado ou indisponivel.']);
}

if ((int) $revenda['id_vendedor'] === $id_comprador) {
    responder_json(403, ['success' => false, 'error' => 'Voce nao pode comprar seu proprio anuncio de revenda.']);
}

$evento_ts = strtotime($revenda['evento_data']);
if ($evento_ts !== false && $evento_ts < time()) {
    responder_json(409, ['success' => false, 'error' => 'O evento ja passou e o ingresso nao pode ser comprado.']);
}

$conn->begin_transaction();

$stmt = $conn->prepare("UPDATE ingressos SET id_participante = ? WHERE id_ingresso = ?");
if (!$stmt) {
    $conn->rollback();
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar transferencia do ingresso.']);
}
$stmt->bind_param('ii', $id_comprador, $revenda['id_ingresso']);
if (!$stmt->execute()) {
    $stmt->close();
    $conn->rollback();
    responder_json(500, ['success' => false, 'error' => 'Falha ao transferir ingresso.']);
}
$stmt->close();

$stmt = $conn->prepare("UPDATE revenda_anuncios SET status = 'vendido' WHERE id_revenda_anuncios = ?");
if (!$stmt) {
    $conn->rollback();
    responder_json(500, ['success' => false, 'error' => 'Falha ao atualizar status do anuncio.']);
}
$stmt->bind_param('i', $id_revenda);
if (!$stmt->execute()) {
    $stmt->close();
    $conn->rollback();
    responder_json(500, ['success' => false, 'error' => 'Falha ao marcar anuncio como vendido.']);
}
$stmt->close();

$conn->commit();
$conn->close();
responder_json(200, ['success' => true, 'message' => 'Ingresso de revenda comprado com sucesso.']);
