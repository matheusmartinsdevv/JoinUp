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
$raw = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($_POST) || !empty($_FILES)) {
        $raw = $_POST;
    } else {
        $raw = json_decode(file_get_contents('php://input'), true) ?: [];
    }
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
            m.imagem,
            m.id_resposta_a,
            DATE_FORMAT(m.data_envio, '%d/%m %H:%i') AS data_envio,
            CASE
                WHEN m.autor_tipo = 'participante'
                     THEN (SELECT nome FROM participantes WHERE id_participante = m.id_participante)
                WHEN m.autor_tipo = 'organizador'
                     THEN (SELECT nome FROM organizadores WHERE id_organizador = m.id_organizador)
            END AS autor_nome,
            r.mensagem        AS resposta_texto,
            r.imagem          AS resposta_imagem,
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
    $imagem        = null;

    if (isset($_FILES['imagem'])) {
        if ($_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['imagem']['tmp_name'];
            $fileName = $_FILES['imagem']['name'];
            $fileSize = $_FILES['imagem']['size'];
            $fileNameCmps = explode('.', $fileName);
            $fileExtension = strtolower(end($fileNameCmps));
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

            if (!in_array($fileExtension, $allowedExtensions, true)) {
                echo json_encode(['success' => false, 'error' => 'Extensão de arquivo não permitida.']);
                exit;
            }

            if ($fileSize > 5 * 1024 * 1024) {
                echo json_encode(['success' => false, 'error' => 'O arquivo é muito grande (Máx 5MB).']);
                exit;
            }

            $newFileName = sha1(uniqid((string)mt_rand(), true)) . '.' . $fileExtension;
            $uploadFileDir = '../uploads/';
            if (!is_dir($uploadFileDir)) {
                mkdir($uploadFileDir, 0755, true);
            }
            $dest_path = $uploadFileDir . $newFileName;

            if (!move_uploaded_file($fileTmpPath, $dest_path)) {
                echo json_encode(['success' => false, 'error' => 'Erro ao mover o arquivo para o diretório de uploads.']);
                exit;
            }

            $imagem = $newFileName;
        } elseif ($_FILES['imagem']['error'] !== UPLOAD_ERR_NO_FILE) {
            $uploadErrors = [
                UPLOAD_ERR_INI_SIZE   => 'O arquivo excede upload_max_filesize do servidor.',
                UPLOAD_ERR_FORM_SIZE  => 'O arquivo excede o limite definido no formulário.',
                UPLOAD_ERR_PARTIAL    => 'O arquivo foi parcialmente enviado.',
                UPLOAD_ERR_NO_TMP_DIR => 'Pasta temporária ausente.',
                UPLOAD_ERR_CANT_WRITE => 'Falha ao gravar o arquivo no disco.',
                UPLOAD_ERR_EXTENSION  => 'Upload interrompido por extensão PHP.'
            ];
            $errorMessage = $uploadErrors[$_FILES['imagem']['error']] ?? 'Erro desconhecido no upload.';
            echo json_encode(['success' => false, 'error' => $errorMessage]);
            exit;
        }
    }

    if (!$id_comunidade || !$id_evento || ($mensagem === '' && $imagem === null)) {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos.']);
        exit;
    }
    if ($mensagem !== '' && mb_strlen($mensagem) > 1000) {
        echo json_encode(['success' => false, 'error' => 'Mensagem muito longa (máx. 1000 caracteres).']);
        exit;
    }

    if (!verificarAcesso($conn, $is_participante, $id_autor, $id_evento)) {
        echo json_encode(['success' => false, 'error' => 'Acesso negado a esta comunidade.']);
        exit;
    }

    if ($id_resposta_a) {
        $chk = $conn->prepare(
            "SELECT 1 FROM comunidade_mensagens
             WHERE id_mensagem = ? AND id_comunidade = ? LIMIT 1"
        );
        $chk->bind_param('ii', $id_resposta_a, $id_comunidade);
        $chk->execute();
        $chk->store_result();
        if ($chk->num_rows === 0) {
            $id_resposta_a = null;
        }
        $chk->close();
    }

    $id_p = $is_participante ? $id_autor : null;
    $id_o = $is_organizador  ? $id_autor : null;

    if ($id_o !== null && $id_p === null) {
        $autor_tipo = 'organizador';
    } elseif ($id_p !== null && $id_o === null) {
        $autor_tipo = 'participante';
    } elseif ($id_o !== null && $id_p !== null) {
        $autor_tipo = 'organizador';
    } else {
        echo json_encode(['success' => false, 'error' => 'Não foi possível identificar o autor da mensagem.']);
        exit;
    }

    if ($mensagem === '') {
        $mensagem = null;
    }

    $stmt = $conn->prepare(
        "INSERT INTO comunidade_mensagens
            (id_comunidade, autor_tipo, id_participante, id_organizador, mensagem, imagem, id_resposta_a)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('isiissi', $id_comunidade, $autor_tipo, $id_p, $id_o, $mensagem, $imagem, $id_resposta_a);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Mensagem enviada.']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erro ao salvar mensagem.', 'debug' => $stmt->error]);
    }
    $stmt->close();
    exit;
}

echo json_encode(['success' => false, 'error' => 'Ação inválida.']);
$conn->close();
?>
