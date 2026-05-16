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

$cpf = $_SESSION['usuario_cpf'];
$conn->set_charset('utf8mb4');

$stmt_participante = $conn->prepare(
    "SELECT id_participante
     FROM participantes
     WHERE cpf = ?
     LIMIT 1"
);

if (!$stmt_participante) {
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar consulta de participante.']);
}

$stmt_participante->bind_param('s', $cpf);
if (!$stmt_participante->execute()) {
    $stmt_participante->close();
    $conn->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao buscar participante autenticado.']);
}

$res_participante = $stmt_participante->get_result();
$participante = $res_participante->fetch_assoc();
$stmt_participante->close();

if (!$participante) {
    $conn->close();
    responder_json(404, ['success' => false, 'error' => 'Participante nao encontrado.']);
}

$id_participante = (int) $participante['id_participante'];

$stmt = $conn->prepare(
    // Agrupa por evento/tipo/status para exibir quantidade por card.
    "SELECT
        i.id_evento,
        i.id_tipo_ingresso,
        i.status,
        COUNT(*) AS quantidade,
        MIN(i.data_compra) AS primeira_compra,
        MAX(i.data_compra) AS ultima_compra,
        e.nome AS evento_nome,
        e.data AS evento_data,
        e.cidade,
        e.estado,
        ti.nome_tipo,
        ti.valor
     FROM ingressos i
     INNER JOIN eventos e ON e.id_evento = i.id_evento
     INNER JOIN tipos_ingressos ti ON ti.id_tipos_ingressos = i.id_tipo_ingresso
     WHERE i.id_participante = ?
     GROUP BY
        i.id_evento,
        i.id_tipo_ingresso,
        i.status,
        e.nome,
        e.data,
        e.cidade,
        e.estado,
        ti.nome_tipo,
        ti.valor
     ORDER BY e.data DESC, ultima_compra DESC"
);

if (!$stmt) {
    $conn->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao preparar consulta de ingressos.']);
}

$stmt->bind_param('i', $id_participante);
if (!$stmt->execute()) {
    $stmt->close();
    $conn->close();
    responder_json(500, ['success' => false, 'error' => 'Falha ao executar consulta de ingressos.']);
}

$result = $stmt->get_result();
$ingressos = [];
$agora = time();

while ($row = $result->fetch_assoc()) {
    $evento_ts = strtotime($row['evento_data']);
    $passado = $evento_ts !== false && $evento_ts < $agora;
    $status = strtolower((string) ($row['status'] ?? ''));

    // Status pronto para exibição no frontend.
    $status_label = 'Ativo';
    $status_class = 'ticket__status--active';

    if ($status === 'cancelado') {
        $status_label = 'Cancelado';
        $status_class = 'ticket__status--past';
    } elseif ($status === 'utilizado' || $passado) {
        $status_label = 'Encerrado';
        $status_class = 'ticket__status--past';
    }

    $valor = (float) $row['valor'];

    $ingressos[] = [
        'id_evento' => (int) $row['id_evento'],
        'id_tipo_ingresso' => (int) $row['id_tipo_ingresso'],
        'status' => $status,
        'quantidade' => (int) $row['quantidade'],
        'evento_nome' => $row['evento_nome'],
        'evento_data' => $row['evento_data'],
        'evento_data_formatada' => $evento_ts !== false ? date('d/m/Y H:i', $evento_ts) : '',
        'cidade' => $row['cidade'],
        'estado' => $row['estado'],
        'nome_tipo' => $row['nome_tipo'],
        'valor' => $valor,
        'valor_formatado' => 'R$ ' . number_format($valor, 2, ',', '.'),
        'passado' => $passado,
        'status_label' => $status_label,
        'status_class' => $status_class
    ];
}

$stmt->close();
$conn->close();

responder_json(200, ['success' => true, 'data' => $ingressos]);
?>
