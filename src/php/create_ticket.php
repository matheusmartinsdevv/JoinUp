<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

if (!isset($_SESSION['usuario_cpf'])) {
    echo json_encode(['success' => false, 'error' => 'Usuário não autenticado.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Dados inválidos.']);
    exit;
}

$titulo = trim($input['titulo'] ?? '');
$descricao = trim($input['descricao'] ?? '');
$cpf = $_SESSION['usuario_cpf'];

if (empty($titulo) || empty($descricao)) {
    echo json_encode(['success' => false, 'error' => 'Título e descrição são obrigatórios.']);
    exit;
}

try {
    $sql = "SELECT id_participante FROM participantes WHERE cpf = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Falha na preparação da consulta: ' . $conn->error);
    }
    $stmt->bind_param('s', $cpf);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'Participante não encontrado.']);
        exit;
    }

    $id_participante = (int) $user['id_participante'];

    $sql = "INSERT INTO ticket (titulo, descricao, id_participante, id_usuario_suporte, id_organizador) VALUES (?, ?, ?, NULL, NULL)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Falha na preparação da consulta: ' . $conn->error);
    }
    $stmt->bind_param('ssi', $titulo, $descricao, $id_participante);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Ticket enviado com sucesso.']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Não foi possível salvar o ticket.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro no servidor: ' . $e->getMessage()]);
}

$conn->close();
?>