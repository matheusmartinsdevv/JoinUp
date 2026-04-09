<?php
session_start();
if (!isset($_SESSION['usuario_cnpj'])) { die("Acesso negado"); }

include 'conexao.php';

$novo_nome = $_POST['nome'] ?? '';
$novo_email = $_POST['email'] ?? '';
$nova_senha = $_POST['nova_senha'] ?? ''; // Recebe a nova senha
$cnpj_sessao = $_SESSION['usuario_cnpj'];

if (!empty($novo_nome) && !empty($novo_email)) {
    
    // Se o usuário digitou uma nova senha, incluímos ela no UPDATE
    if (!empty($nova_senha)) {
        $senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
        $sql = "UPDATE organizadores SET nome = ?, email = ?, senha = ? WHERE cnpj = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $novo_nome, $novo_email, $senha_hash, $cnpj_sessao);
    } else {
        // Se não digitou senha, atualizamos apenas nome e email
        $sql = "UPDATE organizadores SET nome = ?, email = ? WHERE cnpj = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $novo_nome, $novo_email, $cnpj_sessao);
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
