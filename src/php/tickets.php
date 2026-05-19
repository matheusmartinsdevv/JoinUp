<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include __DIR__ . '/conexao.php';

// Verifica se o usuário de suporte está logado
if (!isset($_SESSION['suporte_id'])) {
    echo json_encode(['success' => false, 'error' => 'Usuário de suporte não autenticado.']);
    exit;
}

$id_suporte = (int) $_SESSION['suporte_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sql = "SELECT t.id_ticket, t.titulo, t.descricao, t.id_participante, t.id_usuario_suporte, t.id_organizador,
                       p.nome AS participante_nome, p.email AS participante_email,
                       us.nome AS suporte_nome,
                       o.nome AS organizador_nome, o.email AS organizador_email
                FROM ticket t
                LEFT JOIN participantes p ON t.id_participante = p.id_participante
                LEFT JOIN usuarios_suporte us ON t.id_usuario_suporte = us.id_usuario_suporte
                LEFT JOIN organizadores o ON t.id_organizador = o.id_organizador
                ORDER BY t.id_ticket DESC";
        
        $result = $conn->query($sql);
        if (!$result) {
            throw new Exception($conn->error);
        }
        
        $tickets = [];
        while ($row = $result->fetch_assoc()) {
            $tickets[] = $row;
        }
        
        echo json_encode(['success' => true, 'tickets' => $tickets]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Erro ao buscar tickets: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['id_ticket'], $input['action'])) {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos.']);
        exit;
    }

    $id_ticket = (int) $input['id_ticket'];
    $action = $input['action'];

    if ($action === 'associate') {
        try {
            $stmt = $conn->prepare("UPDATE ticket SET id_usuario_suporte = ? WHERE id_ticket = ?");
            $stmt->bind_param('ii', $id_suporte, $id_ticket);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Você se associou ao ticket com sucesso!']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Erro ao associar ticket.']);
            }
            $stmt->close();
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Erro no servidor: ' . $e->getMessage()]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'error' => 'Ação inválida.']);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Requisição inválida.']);
$conn->close();
?>
