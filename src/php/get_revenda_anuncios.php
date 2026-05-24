<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

function responder_json($status_code, $payload)
{
    http_response_code($status_code);
    echo json_encode($payload);
    exit;
}

if (!$conn || $conn->connect_error) {
    responder_json(500, ['success' => false, 'error' => 'Erro de conexao com o banco de dados.']);
}

if (!isset($_SESSION['usuario_cpf']) || empty($_SESSION['usuario_cpf'])) {
    responder_json(401, ['success' => false, 'error' => 'Participante nao autenticado.']);
}

$conn->set_charset('utf8mb4');

$stmt = $conn->prepare(
    "SELECT
        ra.id_revenda_anuncios,
        ra.valor_revenda,
        i.id_ingresso,
        e.id_evento,
        e.nome AS evento_nome,
        e.data AS evento_data,
        e.cidade,
        e.estado,
        ti.nome_tipo,
        ti.valor AS valor_original,
        p.nome AS vendedor_nome
     FROM revenda_anuncios ra
     INNER JOIN ingressos i ON i.id_ingresso = ra.id_ingresso
     INNER JOIN eventos e ON e.id_evento = i.id_evento
     INNER JOIN tipos_ingressos ti ON ti.id_tipos_ingressos = i.id_tipo_ingresso
     INNER JOIN participantes p ON p.id_participante = ra.id_participante
     WHERE ra.status = 'disponivel'
     ORDER BY ra.id_revenda_anuncios DESC"
);

if (!$stmt) {
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar consulta de anuncios de revenda.']);
}

if (!$stmt->execute()) {
    $stmt->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao carregar anuncios de revenda.']);
}

$result = $stmt->get_result();
$anuncios = [];
$agora = time();
while ($row = $result->fetch_assoc()) {
    $evento_ts = strtotime($row['evento_data']);
    $anuncios[] = [
        'id_revenda_anuncios' => (int) $row['id_revenda_anuncios'],
        'valor_revenda' => (float) $row['valor_revenda'],
        'valor_revenda_formatado' => 'R$ ' . number_format((float) $row['valor_revenda'], 2, ',', '.'),
        'id_ingresso' => (int) $row['id_ingresso'],
        'id_evento' => (int) $row['id_evento'],
        'evento_nome' => $row['evento_nome'],
        'evento_data' => $row['evento_data'],
        'evento_data_formatada' => $evento_ts !== false ? date('d/m/Y H:i', $evento_ts) : '',
        'cidade' => $row['cidade'],
        'estado' => $row['estado'],
        'nome_tipo' => $row['nome_tipo'],
        'valor_original' => (float) $row['valor_original'],
        'vendedor_nome' => $row['vendedor_nome']
    ];
}

$stmt->close();
$conn->close();
responder_json(200, ['success' => true, 'data' => $anuncios]);
