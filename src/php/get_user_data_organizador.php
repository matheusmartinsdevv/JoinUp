<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['usuario_cnpj'])) {
    echo json_encode(['error' => 'Não logado']);
    exit;
}

include 'conexao.php';

$cnpj = $_SESSION['usuario_cnpj'];
$sql = "SELECT nome, email, cnpj FROM organizadores WHERE cnpj = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $cnpj);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

echo json_encode($user);
$conn->close();
?>
