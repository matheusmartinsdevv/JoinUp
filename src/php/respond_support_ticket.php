<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';
include_once 'ticket_messages_helpers.php';

if (!isset($_SESSION['suporte_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Suporte nao autenticado.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$idTicket = (int) ($input['id_ticket'] ?? 0);
$resposta = trim($input['resposta'] ?? '');

if ($idTicket <= 0 || $resposta === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Ticket e resposta sao obrigatorios.']);
    exit;
}

$tamanhoResposta = function_exists('mb_strlen') ? mb_strlen($resposta, 'UTF-8') : strlen($resposta);
if ($tamanhoResposta > 500) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'A resposta deve ter no maximo 500 caracteres.']);
    exit;
}

$transactionStarted = false;

try {
    ensure_ticket_messages_table($conn);
    $statusFechado = 'fechado';
    $sql = "SELECT status_ticket FROM ticket WHERE id_ticket = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    $stmt->bind_param('i', $idTicket);
    $stmt->execute();
    $ticket = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$ticket) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Ticket nao encontrado.']);
        exit;
    }

    if ($ticket['status_ticket'] === $statusFechado) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Este ticket ja esta fechado.']);
        exit;
    }

    $idSuporte = (int) $_SESSION['suporte_id'];
    $status = 'aguardando_usuario';
    $conn->begin_transaction();
    $transactionStarted = true;

    $sql = "
        UPDATE ticket
        SET resposta = ?,
            id_usuario_suporte = ?,
            status_ticket = ?,
            atendido = 0,
            data_fechamento = NULL
        WHERE id_ticket = ?
    ";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    $stmt->bind_param('sisi', $resposta, $idSuporte, $status, $idTicket);
    $stmt->execute();
    $stmt->close();

    insert_ticket_message($conn, $idTicket, 'suporte', $resposta, null, null, $idSuporte);
    $conn->commit();
    $transactionStarted = false;

    echo json_encode(['success' => true, 'message' => 'Resposta enviada. O ticket agora aguarda retorno do usuario.']);
} catch (Exception $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro no servidor: ' . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
