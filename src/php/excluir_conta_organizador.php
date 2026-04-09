<?php
session_start();

if (!isset($_SESSION['usuario_cnpj'])) {
    echo "Não autenticado";
    exit;
}

include 'conexao.php';

$cnpj = $_SESSION['usuario_cnpj'];

// Deleta o organizador do banco
$sql = "DELETE FROM organizadores WHERE cnpj = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $cnpj);

if ($stmt->execute()) {
    session_destroy();
    echo "sucesso";
} else {
    echo "Erro ao excluir conta.";
}

$stmt->close();
$conn->close();
?>
