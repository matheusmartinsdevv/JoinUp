<?php
// 1. Inicia a sessão para manter o usuário logado
session_start();

// 2. Configurações de conexão
include 'conexao.php';

// 3. Recebe os dados do formulário (via Fetch JS)
$email = $_POST['email'] ?? '';
$senha_digitada = $_POST['senha'] ?? '';

if (!empty($email) && !empty($senha_digitada)) {
    
    // 4. Busca o usuário suporte pelo e-mail
    // Usamos Prepared Statements para evitar SQL Injection
    $sql = "SELECT id_usuario_suporte, nome, email, senha FROM usuarios_suporte WHERE email = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        error_log("Erro no prepare de loginSuporte.php: " . $conn->error);
        echo "Erro de configuracao no login de suporte. Verifique a tabela usuarios_suporte no banco joinup.";
        $conn->close();
        exit;
    }
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $usuario_dados = $result->fetch_assoc();

        // 5. Verifica se a senha coincide com o hash do banco
        if (password_verify($senha_digitada, $usuario_dados['senha'])) {
            
            // Login com sucesso: Guarda dados na sessão
            $_SESSION['suporte_id'] = $usuario_dados['id_usuario_suporte'];
            $_SESSION['suporte_nome'] = $usuario_dados['nome'];
            $_SESSION['suporte_email'] = $usuario_dados['email'];
            
            echo "sucesso";
        } else {
            echo "Senha incorreta.";
        }
    } else {
        echo "E-mail de suporte não encontrado.";
    }
    
    $stmt->close();
} else {
    echo "Preencha todos os campos.";
}

$conn->close();
?>
