<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

if (!isset($_SESSION['usuario_cpf'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Dados inválidos.']);
    exit;
}

$nome = trim($input['nome'] ?? '');
$email = trim($input['email'] ?? '');
$cpf = $_SESSION['usuario_cpf'];

if (empty($nome) || empty($email)) {
    echo json_encode(['success' => false, 'error' => 'Nome e E-mail são obrigatórios.']);
    exit;
}

try {
    // Atualizar dados básicos
    $sql = "UPDATE participantes SET nome = ?, email = ? WHERE cpf = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $nome, $email, $cpf);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Perfil atualizado com sucesso!']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro ao atualizar: ' . $e->getMessage()]);
}

$conn->close();
?>
