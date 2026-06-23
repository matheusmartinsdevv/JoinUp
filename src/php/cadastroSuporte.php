<?php
header('Content-Type: application/json; charset=utf-8');

include 'conexao.php';

if (!$conn instanceof mysqli) {
    echo json_encode(['success' => false, 'message' => 'Erro de conexao com o banco de dados.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    $conn->close();
    exit;
}

$nome = trim($_POST['nome'] ?? '');
$email = trim($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';

if ($nome === '' || $email === '' || $senha === '') {
    echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios.']);
    $conn->close();
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'field' => 'email', 'message' => 'Informe um e-mail válido.']);
    $conn->close();
    exit;
}

$check = $conn->prepare('SELECT id_usuario_suporte FROM usuarios_suporte WHERE email = ?');
if (!$check) {
    echo json_encode(['success' => false, 'message' => 'Erro ao preparar validação de e-mail.']);
    $conn->close();
    exit;
}

$check->bind_param('s', $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'field' => 'email', 'message' => 'Este e-mail já está cadastrado.']);
    $check->close();
    $conn->close();
    exit;
}

$check->close();

$hashSenha = password_hash($senha, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO usuarios_suporte (nome, email, senha) VALUES (?, ?, ?)');

if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Erro ao preparar cadastro.']);
    $conn->close();
    exit;
}

$stmt->bind_param('sss', $nome, $email, $hashSenha);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro no cadastro. Tente novamente mais tarde.']);
}

$stmt->close();
$conn->close();
?>
