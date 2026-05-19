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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder_json(405, ['success' => false, 'error' => 'Metodo nao permitido. Use POST.']);
}

if (!$conn || $conn->connect_error) {
    responder_json(500, ['success' => false, 'error' => 'Erro de conexao com o banco de dados.']);
}

if (!isset($_SESSION['usuario_cpf']) || empty($_SESSION['usuario_cpf'])) {
    responder_json(401, ['success' => false, 'error' => 'Participante nao autenticado.']);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || empty($input)) {
    $input = $_POST;
}

$id_evento = isset($input['id_evento']) ? (int) $input['id_evento'] : 0;
$id_tipo_ingresso = isset($input['id_tipo_ingresso']) ? (int) $input['id_tipo_ingresso'] : 0;
$quantidade = isset($input['quantidade']) ? (int) $input['quantidade'] : 0;

if ($id_evento <= 0 || $id_tipo_ingresso <= 0 || $quantidade <= 0) {
    responder_json(422, [
        'success' => false,
        'error' => 'Dados invalidos. Informe id_evento, id_tipo_ingresso e quantidade maior que zero.'
    ]);
}

$conn->set_charset('utf8mb4');
$cpf = $_SESSION['usuario_cpf'];

// Busca participante autenticado.
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
    responder_json(500, ['success' => false, 'error' => 'Falha ao buscar participante autenticado.']);
}

$res_participante = $stmt_participante->get_result();
$participante = $res_participante->fetch_assoc();
$stmt_participante->close();

if (!$participante) {
    responder_json(404, ['success' => false, 'error' => 'Participante nao encontrado.']);
}

$id_participante = (int) $participante['id_participante'];

// Verifica se o banco ja possui o campo id_compra em ingressos.
$possui_coluna_id_compra = false;
$res_coluna = $conn->query(
    "SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ingressos'
       AND COLUMN_NAME = 'id_compra'"
);
if ($res_coluna) {
    $row_coluna = $res_coluna->fetch_assoc();
    $possui_coluna_id_compra = ((int) ($row_coluna['total'] ?? 0)) > 0;
}

$conn->begin_transaction();

try {
    // Trava o tipo de ingresso para evitar corrida de concorrencia.
    $stmt_tipo = $conn->prepare(
        "SELECT
            ti.id_tipos_ingressos AS id_tipo_ingresso,
            ti.id_evento,
            ti.nome_tipo,
            ti.valor,
            ti.quantidade_disponivel,
            e.nome AS nome_evento
         FROM tipos_ingressos ti
         INNER JOIN eventos e ON e.id_evento = ti.id_evento
         WHERE ti.id_tipos_ingressos = ?
           AND ti.id_evento = ?
         FOR UPDATE"
    );

    if (!$stmt_tipo) {
        throw new Exception('Falha ao preparar consulta do ingresso.');
    }

    $stmt_tipo->bind_param('ii', $id_tipo_ingresso, $id_evento);
    if (!$stmt_tipo->execute()) {
        $stmt_tipo->close();
        throw new Exception('Falha ao executar consulta do ingresso.');
    }

    $res_tipo = $stmt_tipo->get_result();
    $tipo = $res_tipo->fetch_assoc();
    $stmt_tipo->close();

    if (!$tipo) {
        $conn->rollback();
        responder_json(409, ['success' => false, 'message' => 'Ingresso indisponível para este evento']);
    }

    $disponivel = (int) $tipo['quantidade_disponivel'];
    if ($disponivel < $quantidade) {
        $conn->rollback();
        responder_json(409, ['success' => false, 'message' => 'Ingresso indisponível para este evento']);
    }

    $valor_unitario = (float) $tipo['valor'];
    $subtotal = round($valor_unitario * $quantidade, 2);

    // 1) Cria compra.
    $stmt_compra = $conn->prepare(
        "INSERT INTO compras (id_participante, id_evento, status, valor_total, data_compra)
         VALUES (?, ?, 'confirmada', ?, NOW())"
    );

    if (!$stmt_compra) {
        throw new Exception('Falha ao preparar insercao da compra.');
    }

    $stmt_compra->bind_param('iid', $id_participante, $id_evento, $subtotal);
    if (!$stmt_compra->execute()) {
        $stmt_compra->close();
        throw new Exception('Falha ao inserir compra.');
    }

    $id_compra = (int) $conn->insert_id;
    $stmt_compra->close();

    // 2) Cria item da compra.
    $stmt_item = $conn->prepare(
        "INSERT INTO compra_itens (id_compra, id_tipo_ingresso, quantidade, valor_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)"
    );

    if (!$stmt_item) {
        throw new Exception('Falha ao preparar insercao do item de compra.');
    }

    $stmt_item->bind_param('iiidd', $id_compra, $id_tipo_ingresso, $quantidade, $valor_unitario, $subtotal);
    if (!$stmt_item->execute()) {
        $stmt_item->close();
        throw new Exception('Falha ao inserir item da compra.');
    }
    $stmt_item->close();

    // 3) Baixa o estoque.
    $stmt_update = $conn->prepare(
        "UPDATE tipos_ingressos
         SET quantidade_disponivel = quantidade_disponivel - ?
         WHERE id_tipos_ingressos = ?
           AND id_evento = ?
           AND quantidade_disponivel >= ?"
    );

    if (!$stmt_update) {
        throw new Exception('Falha ao preparar baixa de estoque.');
    }

    $stmt_update->bind_param('iiii', $quantidade, $id_tipo_ingresso, $id_evento, $quantidade);
    if (!$stmt_update->execute()) {
        $stmt_update->close();
        throw new Exception('Falha ao executar baixa de estoque.');
    }

    if ($stmt_update->affected_rows !== 1) {
        $stmt_update->close();
        $conn->rollback();
        responder_json(409, ['success' => false, 'message' => 'Ingresso indisponível para este evento']);
    }
    $stmt_update->close();

    // 4) Emite os ingressos comprados (1 linha por ingresso).
    if ($possui_coluna_id_compra) {
        $stmt_ingresso = $conn->prepare(
            "INSERT INTO ingressos (data_compra, status, id_participante, id_evento, id_tipo_ingresso, id_compra)
             VALUES (CURDATE(), 'ativo', ?, ?, ?, ?)"
        );
    } else {
        $stmt_ingresso = $conn->prepare(
            "INSERT INTO ingressos (data_compra, status, id_participante, id_evento, id_tipo_ingresso)
             VALUES (CURDATE(), 'ativo', ?, ?, ?)"
        );
    }

    if (!$stmt_ingresso) {
        throw new Exception('Falha ao preparar emissao de ingressos.');
    }

    for ($i = 0; $i < $quantidade; $i++) {
        if ($possui_coluna_id_compra) {
            $stmt_ingresso->bind_param('iiii', $id_participante, $id_evento, $id_tipo_ingresso, $id_compra);
        } else {
            $stmt_ingresso->bind_param('iii', $id_participante, $id_evento, $id_tipo_ingresso);
        }

        if (!$stmt_ingresso->execute()) {
            $stmt_ingresso->close();
            throw new Exception('Falha ao emitir ingresso.');
        }
    }
    $stmt_ingresso->close();

    $conn->commit();
    $conn->close();

    responder_json(201, [
        'success' => true,
        'message' => 'Ingresso comprado com sucesso',
        'data' => [
            'id_compra' => $id_compra,
            'id_evento' => $id_evento,
            'id_tipo_ingresso' => $id_tipo_ingresso,
            'quantidade' => $quantidade,
            'valor_total' => $subtotal,
            'evento_nome' => $tipo['nome_evento'],
            'tipo_nome' => $tipo['nome_tipo']
        ]
    ]);
} catch (Throwable $e) {
    $conn->rollback();
    $conn->close();
    responder_json(500, ['success' => false, 'error' => 'Erro ao processar a compra do ingresso: ' . $e->getMessage()]);
}
?>
