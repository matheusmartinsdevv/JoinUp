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

try {
    ensure_ticket_messages_table($conn);
    $ownerField = '';
    $ownerId = 0;
    $requestedType = trim($_GET['tipo'] ?? '');

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
    }

    $sql = "
        SELECT
            t.id_ticket,
            t.titulo,
            t.descricao,
            t.resposta,
            t.retorno_usuario,
            t.status_ticket,
            t.atendido,
            t.data_criacao,
            t.data_atualizacao,
            t.data_fechamento,
            us.nome AS suporte_nome
        FROM ticket t
        LEFT JOIN usuarios_suporte us ON us.id_usuario_suporte = t.id_usuario_suporte
        WHERE t.$ownerField = ?
        ORDER BY t.data_atualizacao DESC, t.id_ticket DESC
    ";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    $stmt->bind_param('i', $ownerId);
    $stmt->execute();
    $result = $stmt->get_result();

    $tickets = [];
    $ticketIds = [];
    while ($row = $result->fetch_assoc()) {
        $ticketId = (int) $row['id_ticket'];
        $ticketIds[] = $ticketId;
        $tickets[] = [
            'id_ticket' => (int) $row['id_ticket'],
            'titulo' => $row['titulo'] ?: 'Sem titulo',
            'descricao' => $row['descricao'] ?: '',
            'resposta' => $row['resposta'] ?: '',
            'retorno_usuario' => $row['retorno_usuario'] ?: '',
            'status_ticket' => $row['status_ticket'] ?: ($row['atendido'] ? 'fechado' : 'aberto'),
            'atendido' => (int) $row['atendido'],
            'suporte_nome' => $row['suporte_nome'] ?: '',
            'data_criacao' => $row['data_criacao'],
            'data_atualizacao' => $row['data_atualizacao'],
            'data_fechamento' => $row['data_fechamento']
        ];
    }
    $stmt->close();

    $messagesByTicket = get_ticket_messages($conn, $ticketIds);
    foreach ($tickets as &$ticket) {
        $ticket['mensagens'] = $messagesByTicket[$ticket['id_ticket']] ?? [];
        if (!$ticket['mensagens']) {
            $ticket['mensagens'][] = [
                'id_ticket_mensagem' => 0,
                'autor_tipo' => $isOrganizador ? 'organizador' : 'participante',
                'autor_nome' => 'Usuario',
                'mensagem' => $ticket['descricao'],
                'data_mensagem' => $ticket['data_criacao']
            ];
            if ($ticket['resposta'] !== '') {
                $ticket['mensagens'][] = [
                    'id_ticket_mensagem' => 0,
                    'autor_tipo' => 'suporte',
                    'autor_nome' => $ticket['suporte_nome'] ?: 'Suporte',
                    'mensagem' => $ticket['resposta'],
                    'data_mensagem' => $ticket['data_atualizacao']
                ];
            }
            if ($ticket['retorno_usuario'] !== '') {
                $ticket['mensagens'][] = [
                    'id_ticket_mensagem' => 0,
                    'autor_tipo' => $isOrganizador ? 'organizador' : 'participante',
                    'autor_nome' => 'Usuario',
                    'mensagem' => $ticket['retorno_usuario'],
                    'data_mensagem' => $ticket['data_atualizacao']
                ];
            }
        }
    }
    unset($ticket);

    echo json_encode(['success' => true, 'tickets' => $tickets]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro no servidor: ' . $e->getMessage()]);
} finally {
    $conn->close();
}
?>
