<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['usuario_cpf'])) {
    echo json_encode(['error' => 'Não logado']);
    exit;
}

include 'conexao.php';

$cpf = $_SESSION['usuario_cpf'];
$sql = "SELECT nome, email, cpf FROM participantes WHERE cpf = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $cpf);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

echo json_encode($user);
?>