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

    // Agora buscamos as postagens dele, incluindo o nome da comunidade.
    $sql = "SELECT p.id_postagem AS id, p.descricao, p.imagem, p.curtidas, c.nome AS comunidade_nome, p.data_postagem AS data
            FROM postagens p
            INNER JOIN comunidades c ON c.id_comunidade = p.id_comunidade
            WHERE p.id_participante = ?
            UNION ALL
            SELECT m.id_mensagem AS id, m.mensagem AS descricao, NULL AS imagem, 0 AS curtidas, c.nome AS comunidade_nome, m.data_envio AS data
            FROM comunidade_mensagens m
            INNER JOIN comunidades c ON c.id_comunidade = m.id_comunidade
            WHERE m.id_participante = ?
            ORDER BY data DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $id_p, $id_p);
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
