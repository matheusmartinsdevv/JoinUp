<?php
session_start();
header('Content-Type: text/plain; charset=utf-8');

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

$novo_nome = trim($_POST['nome'] ?? '');
$novo_email = trim($_POST['email'] ?? '');
$nova_senha = $_POST['nova_senha'] ?? ''; // Recebe a nova senha
$cpf_sessao = $_SESSION['usuario_cpf'];

if (!empty($novo_nome) && !empty($novo_email)) {
    
    // Se o usuário digitou uma nova senha, incluímos ela no UPDATE
    if (!empty($nova_senha)) {
        $senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
        $sql = "UPDATE participantes SET nome = ?, email = ?, senha = ? WHERE cpf = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo "Erro ao preparar atualizacao.";
            $conn->close();
            exit;
        }
        $stmt->bind_param("ssss", $novo_nome, $novo_email, $senha_hash, $cpf_sessao);
    } else {
        // Se não digitou senha, atualizamos apenas nome e email
        $sql = "UPDATE participantes SET nome = ?, email = ? WHERE cpf = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo "Erro ao preparar atualizacao.";
            $conn->close();
            exit;
        }
        $stmt->bind_param("sss", $novo_nome, $novo_email, $cpf_sessao);
    }

    if ($stmt->execute()) {
        $_SESSION['usuario_nome'] = $novo_nome;
        echo "sucesso";
    } else {
        echo "Erro ao atualizar.";
    }
    $stmt->close();
} else {
    echo "Preencha nome e email.";
}
$conn->close();
?>
