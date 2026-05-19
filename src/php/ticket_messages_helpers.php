<?php
function ensure_ticket_messages_table(mysqli $conn): void {
    $sql = "
        CREATE TABLE IF NOT EXISTS ticket_mensagens (
            id_ticket_mensagem INT NOT NULL AUTO_INCREMENT,
            id_ticket INT NOT NULL,
            autor_tipo ENUM('participante','organizador','suporte') NOT NULL,
            id_participante INT NULL,
            id_organizador INT NULL,
            id_usuario_suporte INT NULL,
            mensagem VARCHAR(500) NOT NULL,
            data_mensagem DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id_ticket_mensagem),
            INDEX idx_ticket_mensagens_ticket (id_ticket),
            INDEX idx_ticket_mensagens_data (data_mensagem),
            CONSTRAINT fk_ticket_mensagens_ticket
                FOREIGN KEY (id_ticket)
                REFERENCES ticket (id_ticket)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            CONSTRAINT fk_ticket_mensagens_participantes
                FOREIGN KEY (id_participante)
                REFERENCES participantes (id_participante)
                ON DELETE SET NULL
                ON UPDATE CASCADE,
            CONSTRAINT fk_ticket_mensagens_organizadores
                FOREIGN KEY (id_organizador)
                REFERENCES organizadores (id_organizador)
                ON DELETE SET NULL
                ON UPDATE CASCADE,
            CONSTRAINT fk_ticket_mensagens_suporte
                FOREIGN KEY (id_usuario_suporte)
                REFERENCES usuarios_suporte (id_usuario_suporte)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        ) ENGINE = InnoDB DEFAULT CHARSET=utf8
    ";

    if (!$conn->query($sql)) {
        throw new Exception('Erro ao preparar historico de mensagens: ' . $conn->error);
    }
}

function insert_ticket_message(
    mysqli $conn,
    int $idTicket,
    string $autorTipo,
    string $mensagem,
    ?int $idParticipante = null,
    ?int $idOrganizador = null,
    ?int $idSuporte = null
): void {
    ensure_ticket_messages_table($conn);

    $sql = "
        INSERT INTO ticket_mensagens
            (id_ticket, autor_tipo, id_participante, id_organizador, id_usuario_suporte, mensagem)
        VALUES (?, ?, ?, ?, ?, ?)
    ";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    $stmt->bind_param('isiiis', $idTicket, $autorTipo, $idParticipante, $idOrganizador, $idSuporte, $mensagem);
    $stmt->execute();
    $stmt->close();
}

function get_ticket_messages(mysqli $conn, array $ticketIds): array {
    ensure_ticket_messages_table($conn);

    $ids = array_values(array_unique(array_filter(array_map('intval', $ticketIds), function ($id) {
        return $id > 0;
    })));
    if (!$ids) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $types = str_repeat('i', count($ids));
    $sql = "
        SELECT
            tm.id_ticket,
            tm.id_ticket_mensagem,
            tm.autor_tipo,
            tm.mensagem,
            tm.data_mensagem,
            p.nome AS participante_nome,
            o.nome AS organizador_nome,
            us.nome AS suporte_nome
        FROM ticket_mensagens tm
        LEFT JOIN participantes p ON p.id_participante = tm.id_participante
        LEFT JOIN organizadores o ON o.id_organizador = tm.id_organizador
        LEFT JOIN usuarios_suporte us ON us.id_usuario_suporte = tm.id_usuario_suporte
        WHERE tm.id_ticket IN ($placeholders)
        ORDER BY tm.data_mensagem ASC, tm.id_ticket_mensagem ASC
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    $stmt->bind_param($types, ...$ids);
    $stmt->execute();
    $result = $stmt->get_result();

    $messagesByTicket = [];
    while ($row = $result->fetch_assoc()) {
        $ticketId = (int) $row['id_ticket'];
        if (!isset($messagesByTicket[$ticketId])) {
            $messagesByTicket[$ticketId] = [];
        }

        $autorNome = $row['suporte_nome'] ?: ($row['participante_nome'] ?: ($row['organizador_nome'] ?: 'Usuario'));
        $messagesByTicket[$ticketId][] = [
            'id_ticket_mensagem' => (int) $row['id_ticket_mensagem'],
            'autor_tipo' => $row['autor_tipo'],
            'autor_nome' => $autorNome,
            'mensagem' => $row['mensagem'] ?: '',
            'data_mensagem' => $row['data_mensagem']
        ];
    }
    $stmt->close();

    return $messagesByTicket;
}
?>
