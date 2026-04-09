<?php
// 1. Inicia a sessão para manter o usuário logado
session_start();

// 2. Configurações de conexão (iguais ao seu cadastro.php)
include 'conexao.php';

// 3. Recebe os dados do formulário (via Fetch JS)
$email = $_POST['email'] ?? '';
$senha_digitada = $_POST['senha'] ?? '';

if (!empty($email) && !empty($senha_digitada)) {
    
    // 4. Busca o usuário pelo e-mail
    // Usamos Prepared Statements para evitar SQL Injection
    $sql = "SELECT cnpj, nome, senha FROM organizadores WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $usuario_dados = $result->fetch_assoc();

        // 5. Verifica se a senha coincide com o hash do banco
        if (password_verify($senha_digitada, $usuario_dados['senha'])) {
            
            // Login com sucesso: Guarda dados na sessão
            $_SESSION['usuario_cnpj'] = $usuario_dados['cnpj'];
            $_SESSION['usuario_nome'] = $usuario_dados['nome'];
            
            echo "sucesso";
        } else {
            echo "Senha incorreta.";
        }
    } else {
        echo "E-mail não encontrado.";
    }
    
    $stmt->close();
} else {
    echo "Preencha todos os campos.";
}

$conn->close();
?>