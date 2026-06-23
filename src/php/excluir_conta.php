<?php
session_start();
header('Content-Type: text/plain; charset=utf-8');

// Verifica se o usuário está logado
if (!isset($_SESSION['usuario_cpf'])) {
    http_response_code(401);
    echo "Acesso negado";
    exit;
}

include 'conexao.php';

if (!$conn instanceof mysqli) {
    http_response_code(500);
    echo "Erro de conexao com o banco de dados.";
    exit;
}

$cpf_sessao = $_SESSION['usuario_cpf'];

// Deleta o registro do banco
$sql = "DELETE FROM participantes WHERE cpf = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo "Erro ao preparar exclusao.";
    $conn->close();
    exit;
}
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
