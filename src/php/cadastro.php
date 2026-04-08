<?php

include 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Pegando os dados do formulário
    $cpf = $_POST['cpf'];
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $data_nasc = $_POST['data_nascimento'];
    // Gerando o hash seguro
    $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);
    
    // 1. Tabela alterada para 'participantes'
    // 2. Usando Prepared Statements por segurança
    $stmt = $conn->prepare("INSERT INTO participantes (cpf, nome, email, data_nascimento, senha) VALUES (?, ?, ?, ?, ?)");
    
    // "sssss" significa que estamos enviando 5 strings
    $stmt->bind_param("sssss", $cpf, $nome, $email, $data_nasc, $senha);

    if ($stmt->execute()) {
        echo "sucesso"; 
    } else {
        echo "erro: " . $stmt->error;
    }

    $stmt->close();
}

$conn->close();
?>