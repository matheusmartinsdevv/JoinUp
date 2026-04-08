<?php
session_start();

// Verifica se o usuário está logado
if (!isset($_SESSION['usuario_cpf'])) {
    die("Acesso negado");
}

include 'conexao.php';

$cpf_sessao = $_SESSION['usuario_cpf'];

// Deleta o registro do banco
$sql = "DELETE FROM participantes WHERE cpf = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $cpf_sessao);

if ($stmt->execute()) {
    // Após deletar, destrói a sessão para deslogar o usuário
    session_destroy();
    echo "sucesso";
} else {
    echo "Erro ao excluir conta: " . $conn->error;
}

$stmt->close();
$conn->close();
?>