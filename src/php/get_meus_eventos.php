<?php
// get_meus_eventos.php — Retorna os eventos do organizador autenticado
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'conexao.php';

if (!isset($_SESSION['usuario_cnpj']) || empty($_SESSION['usuario_cnpj'])) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$cnpj = $_SESSION['usuario_cnpj'];
$conn->set_charset('utf8mb4');

// Buscar id_organizador pelo CNPJ da sessão
$stmt_org = $conn->prepare("SELECT id_organizador FROM organizadores WHERE cnpj = ?");
$stmt_org->bind_param("s", $cnpj);
$stmt_org->execute();
$res_org = $stmt_org->get_result();

if ($res_org->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Organizador não encontrado']);
    exit;
}

$org = $res_org->fetch_assoc();
$id_organizador = (int) $org['id_organizador'];
$stmt_org->close();

// Buscar eventos com ingressos vendidos e receita total
$sql = "
    SELECT
        e.id_evento,
        e.nome,
        e.data,
        e.cidade,
        e.estado,
        e.localizacao,
        gm.nome AS genero,
        -- total de ingressos disponíveis (soma de todos os tipos)
        COALESCE(SUM(ti.quantidade_disponivel), 0) AS total_ingressos,
        -- ingressos vendidos (ativos ou utilizados)
        COALESCE(
            (SELECT COUNT(*) FROM ingressos i WHERE i.id_evento = e.id_evento AND i.status IN ('ativo','utilizado')),
            0
        ) AS vendidos,
        -- receita: vendidos × valor do tipo de ingresso
        COALESCE(
            (SELECT SUM(ti2.valor)
             FROM ingressos i2
             JOIN tipos_ingressos ti2 ON ti2.id_tipos_ingressos = i2.id_tipo_ingresso
             WHERE i2.id_evento = e.id_evento AND i2.status IN ('ativo','utilizado')),
            0
        ) AS receita
    FROM eventos e
    LEFT JOIN generos_musicais gm ON gm.id_genero_musical = e.id_genero_musical
    LEFT JOIN tipos_ingressos ti ON ti.id_evento = e.id_evento
    WHERE e.id_organizador = ?
    GROUP BY e.id_evento
    ORDER BY e.data DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_organizador);
$stmt->execute();
$result = $stmt->get_result();

$eventos = [];
$now = time();

while ($row = $result->fetch_assoc()) {
    $ts = strtotime($row['data']);
    $row['data_formatada'] = date('d/m/Y H:i', $ts);
    $row['passado']        = $ts < $now;

    // Calcular ocupação
    $total = (int) $row['total_ingressos'];
    $vendidos = (int) $row['vendidos'];
    $row['ocupacao'] = $total > 0 ? round(($vendidos / $total) * 100) : 0;

    // Formatar receita
    $row['receita_fmt'] = 'R$ ' . number_format((float)$row['receita'], 2, ',', '.');

    $eventos[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'data' => $eventos]);
?>
