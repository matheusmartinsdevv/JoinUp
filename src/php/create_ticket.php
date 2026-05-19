<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';
include_once 'ticket_messages_helpers.php';

if (!isset($_SESSION['usuario_cpf']) && !isset($_SESSION['usuario_cnpj'])) {
    echo json_encode(['success' => false, 'error' => 'Usuario nao autenticado.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Dados invalidos.']);
    exit;
}

$titulo = trim($input['titulo'] ?? '');
$descricao = trim($input['descricao'] ?? '');
$tipo = trim($input['tipo'] ?? '');
$status = 'aberto';

if (empty($titulo) || empty($descricao)) {
    echo json_encode(['success' => false, 'error' => 'Titulo e descricao sao obrigatorios.']);
    exit;
}

$isOrganizador = false;
if ($tipo === 'organizador') {
    $isOrganizador = true;
} elseif ($tipo === 'participante') {
    $isOrganizador = false;
} elseif (isset($_SESSION['usuario_cnpj']) && !isset($_SESSION['usuario_cpf'])) {
    $isOrganizador = true;
}

try {
    if ($isOrganizador) {
        if (!isset($_SESSION['usuario_cnpj'])) {
            echo json_encode(['success' => false, 'error' => 'Sessao de organizador nao ativa.']);
            exit;
        }

        $cnpj = $_SESSION['usuario_cnpj'];
        $sql = "SELECT id_organizador FROM organizadores WHERE cnpj = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Falha na preparacao da consulta: ' . $conn->error);
        }
        $stmt->bind_param('s', $cnpj);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if (!$user) {
            echo json_encode(['success' => false, 'error' => 'Organizador nao encontrado no banco de dados.']);
            exit;
        }

        $id_organizador = (int) $user['id_organizador'];

        $sql = "INSERT INTO ticket (titulo, descricao, id_participante, id_usuario_suporte, id_organizador, status_ticket) VALUES (?, ?, NULL, NULL, ?, ?)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Falha na preparacao da consulta: ' . $conn->error);
        }
        $stmt->bind_param('ssis', $titulo, $descricao, $id_organizador, $status);
        $stmt->execute();
        $idTicket = (int) $conn->insert_id;
        insert_ticket_message($conn, $idTicket, 'organizador', $descricao, null, $id_organizador, null);
    } else {
        if (!isset($_SESSION['usuario_cpf'])) {
            echo json_encode(['success' => false, 'error' => 'Sessao de participante nao ativa.']);
            exit;
        }

        $cpf = $_SESSION['usuario_cpf'];
        $sql = "SELECT id_participante FROM participantes WHERE cpf = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Falha na preparacao da consulta: ' . $conn->error);
        }
        $stmt->bind_param('s', $cpf);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if (!$user) {
            echo json_encode(['success' => false, 'error' => 'Participante nao encontrado no banco de dados.']);
            exit;
        }

        $id_participante = (int) $user['id_participante'];

        $sql = "INSERT INTO ticket (titulo, descricao, id_participante, id_usuario_suporte, id_organizador, status_ticket) VALUES (?, ?, ?, NULL, NULL, ?)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Falha na preparacao da consulta: ' . $conn->error);
        }
        $stmt->bind_param('ssis', $titulo, $descricao, $id_participante, $status);
        $stmt->execute();
        $idTicket = (int) $conn->insert_id;
        insert_ticket_message($conn, $idTicket, 'participante', $descricao, $id_participante, null, null);
    }

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Ticket enviado com sucesso.']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Nao foi possivel salvar o ticket no banco de dados.']);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Erro no servidor: ' . $e->getMessage()]);
}

$conn->close();
?>
