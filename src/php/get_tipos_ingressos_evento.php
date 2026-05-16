<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

if (!$conn || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro de conexao com o banco de dados.']);
    exit;
}

if (!isset($_SESSION['usuario_cpf']) || empty($_SESSION['usuario_cpf'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Participante nao autenticado.']);
    exit;
}

$id_evento = isset($_GET['id_evento']) ? (int) $_GET['id_evento'] : 0;
if ($id_evento <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'id_evento invalido.']);
    exit;
}

$conn->set_charset('utf8mb4');

$stmt = $conn->prepare(
    "SELECT
        ti.id_tipos_ingressos AS id_tipo_ingresso,
        ti.nome_tipo,
        ti.valor,
        ti.quantidade_disponivel
     FROM tipos_ingressos ti
     WHERE ti.id_evento = ?
     ORDER BY ti.valor ASC, ti.id_tipos_ingressos ASC"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Falha ao preparar consulta dos ingressos.']);
    exit;
}

$stmt->bind_param('i', $id_evento);
if (!$stmt->execute()) {
    $stmt->close();
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Falha ao executar consulta dos ingressos.']);
    exit;
}

$result = $stmt->get_result();
$tipos = [];

while ($row = $result->fetch_assoc()) {
    $valor = (float) $row['valor'];
    $quantidade_disponivel = (int) $row['quantidade_disponivel'];

    $tipos[] = [
        'id_tipo_ingresso' => (int) $row['id_tipo_ingresso'],
        'nome_tipo' => $row['nome_tipo'],
        'valor' => $valor,
        'valor_formatado' => 'R$ ' . number_format($valor, 2, ',', '.'),
        'quantidade_disponivel' => $quantidade_disponivel,
        'disponivel' => $quantidade_disponivel > 0
    ];
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'data' => $tipos]);
?>
