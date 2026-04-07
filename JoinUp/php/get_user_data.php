<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['usuario_cpf'])) {
    echo json_encode(['error' => 'Não logado']);
    exit;
}

$host = "localhost";
$usuario = "root";
$senha_db = "";
$nome_banco = "joinup";
$port = "3307";

$conn = new mysqli($host, $usuario, $senha_db, $nome_banco, $port);

$cpf = $_SESSION['usuario_cpf'];
$sql = "SELECT nome, email, cpf FROM participantes WHERE cpf = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $cpf);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

echo json_encode($user);
?>