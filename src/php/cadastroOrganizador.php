<?php

header('Content-Type: application/json; charset=utf-8');
include 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $cnpj = trim($_POST['cnpj'] ?? '');
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';

    if ($cnpj === '' || $nome === '' || $email === '' || $senha === '') {
        echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
        exit;
    }

    // Verifica se CNPJ ou e-mail já existem antes de inserir
    $check = $conn->prepare("SELECT cnpj, email FROM organizadores WHERE cnpj = ? OR email = ?");
    $check->bind_param('ss', $cnpj, $email);
    $check->execute();
    $result = $check->get_result();

    while ($row = $result->fetch_assoc()) {
        if ($row['cnpj'] === $cnpj) {
            echo json_encode(['success' => false, 'field' => 'cnpj', 'message' => 'Este CNPJ já está cadastrado.']);
            $check->close();
            $conn->close();
            exit;
        }
        if ($row['email'] === $email) {
            echo json_encode(['success' => false, 'field' => 'email', 'message' => 'Este e-mail já está cadastrado.']);
            $check->close();
            $conn->close();
            exit;
        }
    }
    $check->close();

    $hashSenha = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO organizadores (cnpj, nome, email, senha) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $cnpj, $nome, $email, $hashSenha);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        if ($conn->errno === 1062) {
            $duplicateField = 'email';
            if (strpos($conn->error, 'cnpj') !== false) {
                $duplicateField = 'cnpj';
            }
            $message = $duplicateField === 'cnpj'
                ? 'Este CNPJ já está cadastrado.'
                : 'Este e-mail já está cadastrado.';
            echo json_encode(['success' => false, 'field' => $duplicateField, 'message' => $message]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro no cadastro. Tente novamente mais tarde.']);
        }
    }

    $stmt->close();
}

$conn->close();
?>