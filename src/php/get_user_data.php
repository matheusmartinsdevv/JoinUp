<?php
session_start();
header('Content-Type: application/json');

include 'conexao.php';

if (!isset($_SESSION['usuario_cpf'])) {
    echo json_encode(['error' => 'Sessão não encontrada. Faça login novamente.']);
    exit;
}

$cpf = $_SESSION['usuario_cpf'];

try {
    $sql = "SELECT id_participante, nome, email, cpf FROM participantes WHERE cpf = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $cpf);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode(['error' => 'Dados do usuário não encontrados no banco.']);
    } else {
        echo json_encode($user);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}

$conn->close();
?>