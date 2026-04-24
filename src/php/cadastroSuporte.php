<?php

include 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Pegando os dados do formulário
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    // Gerando o hash seguro
    $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);
    
    // 1. Tabela alterada para 'participantes'
    // 2. Usando Prepared Statements por segurança
    $stmt = $conn->prepare("INSERT INTO usuarios_suporte (nome, email, senha) VALUES (?, ?, ?)");
    
    // "sssss" significa que estamos enviando 5 strings
    $stmt->bind_param("sss", $nome, $email, $senha);

    if ($stmt->execute()) {
        echo "sucesso"; 
    } else {
        echo "erro: " . $stmt->error;
    }

    $stmt->close();
}

$conn->close();
?>