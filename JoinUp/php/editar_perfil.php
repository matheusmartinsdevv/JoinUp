<?php
session_start();
if (!isset($_SESSION['usuario_cpf'])) { die("Acesso negado"); }

$host = "localhost";
$usuario = "root";
$senha_db = "";
$nome_banco = "joinup";
$port = "3307";

$conn = new mysqli($host, $usuario, $senha_db, $nome_banco, $port);

$novo_nome = $_POST['nome'] ?? '';
$novo_email = $_POST['email'] ?? '';
$nova_senha = $_POST['nova_senha'] ?? ''; // Recebe a nova senha
$cpf_sessao = $_SESSION['usuario_cpf'];

if (!empty($novo_nome) && !empty($novo_email)) {
    
    // Se o usuário digitou uma nova senha, incluímos ela no UPDATE
    if (!empty($nova_senha)) {
        $senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
        $sql = "UPDATE participantes SET nome = ?, email = ?, senha = ? WHERE cpf = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $novo_nome, $novo_email, $senha_hash, $cpf_sessao);
    } else {
        // Se não digitou senha, atualizamos apenas nome e email
        $sql = "UPDATE participantes SET nome = ?, email = ? WHERE cpf = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $novo_nome, $novo_email, $cpf_sessao);
    }

    if ($stmt->execute()) {
        $_SESSION['usuario_nome'] = $novo_nome;
        echo "sucesso";
    } else {
        echo "Erro ao atualizar.";
    }
    $stmt->close();
}
$conn->close();
?>