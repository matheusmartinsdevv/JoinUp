<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

if (!isset($_SESSION['suporte_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Suporte nao autenticado.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$idTicket = (int) ($input['id_ticket'] ?? 0);

if ($idTicket <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Ticket invalido.']);
    exit;
}

try {
    $sql = "
        UPDATE ticket
        SET status_ticket = 'fechado',
            atendido = 1,
            data_fechamento = NOW()
        WHERE id_ticket = ?
          AND status_ticket <> 'aguardando_usuario'
    ";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    $stmt->bind_param('i', $idTicket);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Ticket nao encontrado ou esta aguardando retorno do usuario.']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'Ticket fechado com sucesso.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro no servidor: ' . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
