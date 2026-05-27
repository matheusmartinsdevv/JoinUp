<?php

header('Content-Type: application/json; charset=utf-8');
include 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $cpf = trim($_POST['cpf'] ?? '');
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $data_nasc = trim($_POST['data_nascimento'] ?? '');
    $senha = $_POST['senha'] ?? '';

    if ($cpf === '' || $nome === '' || $email === '' || $data_nasc === '' || $senha === '') {
        echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
        exit;
    }

    $check = $conn->prepare("SELECT cpf, email FROM participantes WHERE cpf = ? OR email = ?");
    $check->bind_param('ss', $cpf, $email);
    $check->execute();
    $result = $check->get_result();

    while ($row = $result->fetch_assoc()) {
        if ($row['cpf'] === $cpf) {
            echo json_encode(['success' => false, 'field' => 'cpf', 'message' => 'Este CPF já está cadastrado.']);
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
    $stmt = $conn->prepare("INSERT INTO participantes (cpf, nome, email, data_nascimento, senha) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $cpf, $nome, $email, $data_nasc, $hashSenha);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        if ($conn->errno === 1062) {
            $duplicateField = 'email';
            if (strpos($conn->error, 'cpf') !== false) {
                $duplicateField = 'cpf';
            }
            $message = $duplicateField === 'cpf'
                ? 'Este CPF já está cadastrado.'
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