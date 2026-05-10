<?php
session_start();
header('Content-Type: application/json');
include 'conexao.php';

if (!isset($_SESSION['usuario_cpf'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$cpf = $_SESSION['usuario_cpf'];

try {
    // Primeiro, pegamos o ID do participante
    $stmt_p = $conn->prepare("SELECT id_participante FROM participantes WHERE cpf = ?");
    $stmt_p->bind_param("s", $cpf);
    $stmt_p->execute();
    $id_p = $stmt_p->get_result()->fetch_assoc()['id_participante'];

    if (!$id_p) {
        echo json_encode(['success' => false, 'error' => 'Participante não encontrado']);
        exit;
    }

    // Agora buscamos as postagens dele
    $sql = "SELECT id_postagem, descricao, imagem, curtidas FROM postagens WHERE id_participante = ? ORDER BY id_postagem DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id_p);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $postagens = [];
    while ($row = $result->fetch_assoc()) {
        $postagens[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $postagens]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>
