<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

if (!isset($_SESSION['usuario_cnpj'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado.']);
    exit;
}

include 'conexao.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Dados inválidos.']);
    exit;
}

$novo_nome  = trim($input['nome']       ?? '');
$novo_email = trim($input['email']      ?? '');
// Uses the provided CNPJ, or falls back to session if not provided
$novo_cnpj  = isset($input['cnpj']) ? trim($input['cnpj']) : $_SESSION['usuario_cnpj'];
$nova_senha = trim($input['nova_senha'] ?? '');
$cnpj_sessao = $_SESSION['usuario_cnpj'];

if (empty($novo_nome) || empty($novo_email) || empty($novo_cnpj)) {
    echo json_encode(['success' => false, 'error' => 'Nome, e-mail e CNPJ são obrigatórios.']);
    exit;
}

if (!filter_var($novo_email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'E-mail inválido.']);
    exit;
}

if (!empty($nova_senha)) {
    // Removed password length restriction
    $senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
    $sql  = "UPDATE organizadores SET nome = ?, email = ?, cnpj = ?, senha = ? WHERE cnpj = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssss", $novo_nome, $novo_email, $novo_cnpj, $senha_hash, $cnpj_sessao);
} else {
    $sql  = "UPDATE organizadores SET nome = ?, email = ?, cnpj = ? WHERE cnpj = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $novo_nome, $novo_email, $novo_cnpj, $cnpj_sessao);
}

if ($stmt->execute()) {
    $_SESSION['usuario_nome'] = $novo_nome;
    $_SESSION['usuario_cnpj'] = $novo_cnpj; // Update session CNPJ
    echo json_encode(['success' => true, 'message' => 'Perfil atualizado com sucesso!']);
} else {
    // Handle uniqueness constraint issues nicely
    if ($conn->errno === 1062) {
        $error = 'E-mail ou CNPJ já está em uso por outra conta.';
    } else {
        $error = 'Erro ao atualizar: ' . $conn->error;
    }
    echo json_encode(['success' => false, 'error' => $error]);
}

$stmt->close();
$conn->close();
?>
