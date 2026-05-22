<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include __DIR__ . '/conexao.php';

// ─── Autenticação Dual (participante ou organizador) ───────────────────────
$is_participante = isset($_SESSION['usuario_cpf']) && !empty($_SESSION['usuario_cpf']);
$is_organizador  = isset($_SESSION['usuario_cnpj']) && !empty($_SESSION['usuario_cnpj']);

// Em caso de sessão compartilhada antiga, prioriza o organizador para evitar enviar mensagens como participante.
if ($is_participante && $is_organizador) {
    $is_participante = false;
}

if (!$is_participante && !$is_organizador) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado.']);
    exit;
}

$autor_tipo = $is_participante ? 'participante' : 'organizador';
$id_autor   = null;
$autor_nome = '';

if ($is_participante) {
    $stmt = $conn->prepare("SELECT id_participante, nome FROM participantes WHERE cpf = ?");
    $stmt->bind_param('s', $_SESSION['usuario_cpf']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'Participante não encontrado.']);
        exit;
    }
    $id_autor   = (int)$row['id_participante'];
    $autor_nome = $row['nome'];
} else {
    $stmt = $conn->prepare("SELECT id_organizador, nome FROM organizadores WHERE cnpj = ?");
    $stmt->bind_param('s', $_SESSION['usuario_cnpj']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'Organizador não encontrado.']);
        exit;
    }
    $id_autor   = (int)$row['id_organizador'];
    $autor_nome = $row['nome'];
}

$action = $_GET['action'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw    = json_decode(file_get_contents('php://input'), true);
    $action = $raw['action'] ?? $action;
}

// ─── Função reutilizável: verificar acesso à comunidade ────────────────────
function verificarAcesso($conn, $is_participante, $id_autor, $id_evento) {
    if ($is_participante) {
        $chk = $conn->prepare(
            "SELECT 1 FROM ingressos
             WHERE id_participante = ? AND id_evento = ?
               AND status IN ('ativo','utilizado')
             LIMIT 1"
        );
        $chk->bind_param('ii', $id_autor, $id_evento);
    } else {
        $chk = $conn->prepare(
            "SELECT 1 FROM eventos
             WHERE id_evento = ? AND id_organizador = ?
             LIMIT 1"
        );
        $chk->bind_param('ii', $id_evento, $id_autor);
    }
    $chk->execute();
    $chk->store_result();
    $ok = $chk->num_rows > 0;
    $chk->close();
    return $ok;
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION: fetch — GET /comunidade_feed.php?action=fetch&id_comunidade=X&id_evento=Y
// ═══════════════════════════════════════════════════════════════════════════
if ($action === 'fetch' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $id_comunidade = isset($_GET['id_comunidade']) ? (int)$_GET['id_comunidade'] : 0;
    $id_evento     = isset($_GET['id_evento'])     ? (int)$_GET['id_evento']     : 0;

    if (!$id_comunidade || !$id_evento) {
        echo json_encode(['success' => false, 'error' => 'Parâmetros inválidos.']);
        exit;
    }

    if (!verificarAcesso($conn, $is_participante, $id_autor, $id_evento)) {
        echo json_encode(['success' => false, 'error' => 'Acesso negado a esta comunidade.']);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT
            m.id_mensagem,
            m.autor_tipo,
            m.id_participante,
            m.id_organizador,
            m.mensagem,
            m.id_resposta_a,
            DATE_FORMAT(m.data_envio, '%d/%m %H:%i') AS data_envio,
            CASE
                WHEN m.autor_tipo = 'participante'
                     THEN (SELECT nome FROM participantes WHERE id_participante = m.id_participante)
                WHEN m.autor_tipo = 'organizador'
                     THEN (SELECT nome FROM organizadores WHERE id_organizador = m.id_organizador)
            END AS autor_nome,
            r.mensagem        AS resposta_texto,
            r.autor_tipo      AS resposta_autor_tipo,
            CASE
                WHEN r.autor_tipo = 'participante'
                     THEN (SELECT nome FROM participantes WHERE id_participante = r.id_participante)
                WHEN r.autor_tipo = 'organizador'
                     THEN (SELECT nome FROM organizadores WHERE id_organizador = r.id_organizador)
                ELSE NULL
            END AS resposta_autor_nome
        FROM comunidade_mensagens m
        LEFT JOIN comunidade_mensagens r ON r.id_mensagem = m.id_resposta_a
        WHERE m.id_comunidade = ?
        ORDER BY m.data_envio ASC
        LIMIT 200
    ");
    $stmt->bind_param('i', $id_comunidade);
    $stmt->execute();
    $mensagens = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(['success' => true, 'mensagens' => $mensagens]);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION: send — POST /comunidade_feed.php  body: {action,id_comunidade,id_evento,mensagem,id_resposta_a?}
// ═══════════════════════════════════════════════════════════════════════════
if ($action === 'send' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_comunidade = isset($raw['id_comunidade']) ? (int)$raw['id_comunidade'] : 0;
    $id_evento     = isset($raw['id_evento'])     ? (int)$raw['id_evento']     : 0;
    $mensagem      = isset($raw['mensagem'])      ? trim(strip_tags($raw['mensagem'])) : '';
    $id_resposta_a = isset($raw['id_resposta_a']) && $raw['id_resposta_a'] ? (int)$raw['id_resposta_a'] : null;

    if (!$id_comunidade || !$id_evento || $mensagem === '') {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos.']);
        exit;
    }
    if (mb_strlen($mensagem) > 1000) {
        echo json_encode(['success' => false, 'error' => 'Mensagem muito longa (máx. 1000 caracteres).']);
        exit;
    }

    if (!verificarAcesso($conn, $is_participante, $id_autor, $id_evento)) {
        echo json_encode(['success' => false, 'error' => 'Acesso negado a esta comunidade.']);
        exit;
    }

    // Valida se a mensagem que está sendo respondida pertence à mesma comunidade
    if ($id_resposta_a) {
        $chk = $conn->prepare(
            "SELECT 1 FROM comunidade_mensagens
             WHERE id_mensagem = ? AND id_comunidade = ? LIMIT 1"
        );
        $chk->bind_param('ii', $id_resposta_a, $id_comunidade);
        $chk->execute();
        $chk->store_result();
        if ($chk->num_rows === 0) $id_resposta_a = null;
        $chk->close();
    }

    $id_p = $is_participante ? $id_autor : null;
    $id_o = $is_organizador  ? $id_autor : null;

    // Garante que o autor_tipo reflita o campo de autor que será salvo.
    if ($id_o !== null && $id_p === null) {
        $autor_tipo = 'organizador';
    } elseif ($id_p !== null && $id_o === null) {
        $autor_tipo = 'participante';
    } elseif ($id_o !== null && $id_p !== null) {
        // Situação inconsistente: prioriza organizador para evitar envio como participante.
        $autor_tipo = 'organizador';
    } else {
        echo json_encode(['success' => false, 'error' => 'Não foi possível identificar o autor da mensagem.']);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO comunidade_mensagens
            (id_comunidade, autor_tipo, id_participante, id_organizador, mensagem, id_resposta_a)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('isiisi', $id_comunidade, $autor_tipo, $id_p, $id_o, $mensagem, $id_resposta_a);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Mensagem enviada.']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erro ao salvar mensagem.']);
    }
    $stmt->close();
    exit;
}

echo json_encode(['success' => false, 'error' => 'Ação inválida.']);
$conn->close();
?>
