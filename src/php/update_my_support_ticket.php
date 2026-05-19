<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';
include_once 'ticket_messages_helpers.php';

if (!isset($_SESSION['usuario_cpf']) && !isset($_SESSION['usuario_cnpj'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Usuario nao autenticado.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$idTicket = (int) ($input['id_ticket'] ?? 0);
$action = trim($input['action'] ?? '');
$retorno = trim($input['retorno_usuario'] ?? '');
$requestedType = trim($input['tipo'] ?? '');

if ($idTicket <= 0 || !in_array($action, ['resolver', 'retornar'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Dados invalidos.']);
    exit;
}

if ($action === 'retornar' && $retorno === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Descreva o que ainda precisa ser resolvido.']);
    exit;
}

$tamanhoRetorno = function_exists('mb_strlen') ? mb_strlen($retorno, 'UTF-8') : strlen($retorno);
if ($tamanhoRetorno > 500) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'O retorno deve ter no maximo 500 caracteres.']);
    exit;
}

$transactionStarted = false;

try {
    ensure_ticket_messages_table($conn);
    $ownerField = '';
    $ownerId = 0;
    $autorTipo = 'participante';

    if ($requestedType === 'organizador' && !isset($_SESSION['usuario_cnpj'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Sessao de organizador nao ativa.']);
        exit;
    }

    if ($requestedType === 'participante' && !isset($_SESSION['usuario_cpf'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Sessao de participante nao ativa.']);
        exit;
    }

    $isOrganizador = $requestedType === 'organizador' || ($requestedType === '' && isset($_SESSION['usuario_cnpj']) && !isset($_SESSION['usuario_cpf']));

    if ($isOrganizador) {
        $sql = "SELECT id_organizador FROM organizadores WHERE cnpj = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param('s', $_SESSION['usuario_cnpj']);
        $stmt->execute();
        $organizador = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$organizador) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Organizador nao encontrado.']);
            exit;
        }

        $ownerField = 'id_organizador';
        $ownerId = (int) $organizador['id_organizador'];
        $autorTipo = 'organizador';
    } else {
        $sql = "SELECT id_participante FROM participantes WHERE cpf = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param('s', $_SESSION['usuario_cpf']);
        $stmt->execute();
        $participante = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$participante) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Participante nao encontrado.']);
            exit;
        }

        $ownerField = 'id_participante';
        $ownerId = (int) $participante['id_participante'];
        $autorTipo = 'participante';
    }

    $conn->begin_transaction();
    $transactionStarted = true;

    if ($action === 'resolver') {
        $sql = "
            UPDATE ticket
            SET status_ticket = 'fechado',
                atendido = 1,
                data_fechamento = NOW()
            WHERE id_ticket = ?
              AND $ownerField = ?
              AND status_ticket <> 'fechado'
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param('ii', $idTicket, $ownerId);
    } else {
        $status = 'em_atendimento';
        $sql = "
            UPDATE ticket
            SET retorno_usuario = ?,
                status_ticket = ?,
                atendido = 0,
                data_fechamento = NULL
            WHERE id_ticket = ?
              AND $ownerField = ?
              AND status_ticket <> 'fechado'
        ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param('ssii', $retorno, $status, $idTicket, $ownerId);
    }

    $stmt->execute();
    if ($stmt->affected_rows === 0) {
        $conn->rollback();
        $transactionStarted = false;
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Este ticket ja esta fechado ou nao pertence ao usuario.']);
        exit;
    }
    $stmt->close();

    if ($action === 'retornar') {
        $idParticipanteMensagem = $autorTipo === 'participante' ? $ownerId : null;
        $idOrganizadorMensagem = $autorTipo === 'organizador' ? $ownerId : null;
        insert_ticket_message($conn, $idTicket, $autorTipo, $retorno, $idParticipanteMensagem, $idOrganizadorMensagem, null);
    }

    $conn->commit();
    $transactionStarted = false;

    echo json_encode(['success' => true, 'message' => 'Ticket atualizado com sucesso.']);
} catch (Exception $e) {
    if ($transactionStarted) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro no servidor: ' . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
