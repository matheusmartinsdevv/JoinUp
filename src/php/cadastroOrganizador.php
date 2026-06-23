<?php

header('Content-Type: application/json; charset=utf-8');
include 'conexao.php';

function responder_cadastro_organizador(array $payload): void
{
    global $conn;
    echo json_encode($payload);
    if ($conn instanceof mysqli) {
        $conn->close();
    }
    exit;
}

if (!$conn instanceof mysqli) {
    responder_cadastro_organizador(['success' => false, 'message' => 'Erro de conexao com o banco de dados.']);
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $cnpj = trim($_POST['cnpj'] ?? '');
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';

    if ($cnpj === '' || $nome === '' || $email === '' || $senha === '') {
        responder_cadastro_organizador(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        responder_cadastro_organizador(['success' => false, 'field' => 'email', 'message' => 'Informe um e-mail válido.']);
    }

    // Verifica se CNPJ ou e-mail já existem antes de inserir
    $check = $conn->prepare("SELECT cnpj, email FROM organizadores WHERE cnpj = ? OR email = ?");
    if (!$check) {
        responder_cadastro_organizador(['success' => false, 'message' => 'Erro ao preparar validação de cadastro.']);
    }
    $check->bind_param('ss', $cnpj, $email);
    $check->execute();
    $result = $check->get_result();

    while ($row = $result->fetch_assoc()) {
        if ($row['cnpj'] === $cnpj) {
            $check->close();
            responder_cadastro_organizador(['success' => false, 'field' => 'cnpj', 'message' => 'Este CNPJ já está cadastrado.']);
        }
        if ($row['email'] === $email) {
            $check->close();
            responder_cadastro_organizador(['success' => false, 'field' => 'email', 'message' => 'Este e-mail já está cadastrado.']);
        }
    }
    $check->close();

    $hashSenha = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO organizadores (cnpj, nome, email, senha) VALUES (?, ?, ?, ?)");
    if (!$stmt) {
        responder_cadastro_organizador(['success' => false, 'message' => 'Erro ao preparar cadastro.']);
    }
    $stmt->bind_param("ssss", $cnpj, $nome, $email, $hashSenha);

    if ($stmt->execute()) {
        $stmt->close();
        responder_cadastro_organizador(['success' => true]);
    } else {
        if ($conn->errno === 1062) {
            $duplicateField = 'email';
            if (strpos($conn->error, 'cnpj') !== false) {
                $duplicateField = 'cnpj';
            }
            $message = $duplicateField === 'cnpj'
                ? 'Este CNPJ já está cadastrado.'
                : 'Este e-mail já está cadastrado.';
            $stmt->close();
            responder_cadastro_organizador(['success' => false, 'field' => $duplicateField, 'message' => $message]);
        } else {
            $stmt->close();
            responder_cadastro_organizador(['success' => false, 'message' => 'Erro no cadastro. Tente novamente mais tarde.']);
        }
    }
}

responder_cadastro_organizador(['success' => false, 'message' => 'Método não permitido.']);
?>
