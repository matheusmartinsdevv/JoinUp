<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Sessão CPF: " . ($_SESSION['usuario_cpf'] ?? 'NÃO DEFINIDA') . "<br>";

include 'conexao.php';
if (isset($_SESSION['usuario_cpf'])) {
    $cpf = $_SESSION['usuario_cpf'];
    $sql = "SELECT id_participante, nome, email, cpf FROM participantes WHERE cpf = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $cpf);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    echo "Usuário encontrado: " . ($user ? 'SIM' : 'NÃO') . "<br>";
    if ($user) print_r($user);
}
?>
