<?php

header('Content-Type: application/json; charset=utf-8');
include 'conexao.php';

function responder_cadastro($payload, $status_code = 200)
{
    http_response_code($status_code);
    echo json_encode($payload);
    exit;
}

if (!$conn || $conn->connect_error) {
    responder_cadastro(['success' => false, 'message' => 'Erro de conexão com o banco de dados.'], 500);
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $cpf = preg_replace('/\D/', '', trim($_POST['cpf'] ?? ''));
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $data_nasc = trim($_POST['data_nascimento'] ?? '');
    $senha = $_POST['senha'] ?? '';

    if ($cpf === '' || $nome === '' || $email === '' || $data_nasc === '' || $senha === '') {
        responder_cadastro(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
    }

    if (strlen($cpf) !== 11) {
        responder_cadastro(['success' => false, 'field' => 'cpf', 'message' => 'Informe um CPF válido com 11 dígitos.']);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        responder_cadastro(['success' => false, 'field' => 'email', 'message' => 'Informe um e-mail válido.']);
    }

    $check = $conn->prepare("SELECT cpf, email FROM participantes WHERE cpf = ? OR email = ?");
    if (!$check) {
        responder_cadastro(['success' => false, 'message' => 'Erro ao preparar validação do cadastro.'], 500);
    }

    $check->bind_param('ss', $cpf, $email);
    $check->execute();
    $result = $check->get_result();

    while ($row = $result->fetch_assoc()) {
        if ($row['cpf'] === $cpf) {
            $check->close();
            $conn->close();
            responder_cadastro(['success' => false, 'field' => 'cpf', 'message' => 'Este CPF já está cadastrado.']);
        }
        if ($row['email'] === $email) {
            $check->close();
            $conn->close();
            responder_cadastro(['success' => false, 'field' => 'email', 'message' => 'Este e-mail já está cadastrado.']);
        }
    }
    $check->close();

    $hashSenha = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO participantes (cpf, nome, email, data_nascimento, senha) VALUES (?, ?, ?, ?, ?)");
    if (!$stmt) {
        responder_cadastro(['success' => false, 'message' => 'Erro ao preparar cadastro.'], 500);
    }

    $stmt->bind_param("sssss", $cpf, $nome, $email, $data_nasc, $hashSenha);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        if ($stmt->errno === 1062 || $conn->errno === 1062) {
            $duplicateField = 'email';
            if (strpos($stmt->error . $conn->error, 'cpf') !== false) {
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
