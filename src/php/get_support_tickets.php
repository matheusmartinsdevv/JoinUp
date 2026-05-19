<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';
include_once 'ticket_messages_helpers.php';

if (!isset($_SESSION['suporte_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Suporte nao autenticado.']);
    exit;
}

function fail($message, $status = 500) {
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

try {
    ensure_ticket_messages_table($conn);
    $sql = "
        SELECT
            t.id_ticket,
            t.titulo,
            t.descricao,
            t.resposta,
            t.retorno_usuario,
            t.atendido,
            t.status_ticket,
            t.id_usuario_suporte,
            t.data_criacao,
            t.data_atualizacao,
            t.data_fechamento,
            p.nome AS participante_nome,
            p.email AS participante_email,
            o.nome AS organizador_nome,
            o.email AS organizador_email,
            us.nome AS suporte_nome
        FROM ticket t
        LEFT JOIN participantes p ON p.id_participante = t.id_participante
        LEFT JOIN organizadores o ON o.id_organizador = t.id_organizador
        LEFT JOIN usuarios_suporte us ON us.id_usuario_suporte = t.id_usuario_suporte
        ORDER BY
            CASE t.status_ticket
                WHEN 'aberto' THEN 1
                WHEN 'em_atendimento' THEN 2
                WHEN 'aguardando_usuario' THEN 3
                WHEN 'fechado' THEN 4
                ELSE 5
            END,
            t.data_atualizacao DESC,
            t.id_ticket DESC
    ";

    $result = $conn->query($sql);
    if (!$result) {
        fail('Erro ao consultar tickets: ' . $conn->error);
    }

    $tickets = [];
    $ticketIds = [];
    $stats = [
        'abertos' => 0,
        'em_atendimento' => 0,
        'aguardando_usuario' => 0,
        'fechados' => 0,
        'total' => 0
    ];

    while ($row = $result->fetch_assoc()) {
        $status = $row['status_ticket'] ?: ($row['atendido'] ? 'fechado' : 'aberto');
        $tipoUsuario = $row['participante_nome'] ? 'Participante' : ($row['organizador_nome'] ? 'Organizador' : 'Usuario');
        $nomeUsuario = $row['participante_nome'] ?: ($row['organizador_nome'] ?: 'Usuario nao identificado');
        $emailUsuario = $row['participante_email'] ?: ($row['organizador_email'] ?: '');

        if (isset($stats[$status])) {
            $stats[$status]++;
        }
        $stats['total']++;

        $ticketId = (int) $row['id_ticket'];
        $ticketIds[] = $ticketId;
        $tickets[] = [
            'id_ticket' => $ticketId,
            'titulo' => $row['titulo'] ?: 'Sem titulo',
            'descricao' => $row['descricao'] ?: '',
            'resposta' => $row['resposta'] ?: '',
            'retorno_usuario' => $row['retorno_usuario'] ?: '',
            'status_ticket' => $status,
            'atendido' => (int) $row['atendido'],
            'id_usuario_suporte' => $row['id_usuario_suporte'] ? (int) $row['id_usuario_suporte'] : null,
            'usuario_nome' => $nomeUsuario,
            'usuario_email' => $emailUsuario,
            'usuario_tipo' => $tipoUsuario,
            'suporte_nome' => $row['suporte_nome'] ?: '',
            'data_criacao' => $row['data_criacao'],
            'data_atualizacao' => $row['data_atualizacao'],
            'data_fechamento' => $row['data_fechamento']
        ];
    }

    $messagesByTicket = get_ticket_messages($conn, $ticketIds);
    foreach ($tickets as &$ticket) {
        $ticket['mensagens'] = $messagesByTicket[$ticket['id_ticket']] ?? [];
        if (!$ticket['mensagens']) {
            $autorTipo = $ticket['usuario_tipo'] === 'Organizador' ? 'organizador' : 'participante';
            $ticket['mensagens'][] = [
                'id_ticket_mensagem' => 0,
                'autor_tipo' => $autorTipo,
                'autor_nome' => $ticket['usuario_nome'],
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
                    'autor_tipo' => $autorTipo,
                    'autor_nome' => $ticket['usuario_nome'],
                    'mensagem' => $ticket['retorno_usuario'],
                    'data_mensagem' => $ticket['data_atualizacao']
                ];
            }
        }
    }
    unset($ticket);

    echo json_encode([
        'success' => true,
        'tickets' => $tickets,
        'stats' => $stats,
        'suporte' => [
            'id' => (int) $_SESSION['suporte_id'],
            'nome' => $_SESSION['suporte_nome'] ?? 'Suporte',
            'email' => $_SESSION['suporte_email'] ?? ''
        ]
    ]);
} catch (Exception $e) {
    fail('Erro no servidor: ' . $e->getMessage());
} finally {
    $conn->close();
}
?>
