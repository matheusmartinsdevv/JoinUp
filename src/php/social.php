<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include __DIR__ . '/conexao.php';

function social_json($status_code, $payload)
{
    http_response_code($status_code);
    echo json_encode($payload);
    exit;
}

function social_int($value)
{
    return isset($value) ? (int) $value : 0;
}

function social_text($value, $limit)
{
    $text = trim(strip_tags((string) ($value ?? '')));
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $limit, 'UTF-8');
    }
    return substr($text, 0, $limit);
}

function social_upload_image($field = 'imagem')
{
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        social_json(422, ['success' => false, 'error' => 'Nao foi possivel enviar a imagem.']);
    }

    $file_size = (int) $_FILES[$field]['size'];
    if ($file_size > 5 * 1024 * 1024) {
        social_json(422, ['success' => false, 'error' => 'Imagem muito grande. Limite de 5MB.']);
    }

    $original_name = (string) $_FILES[$field]['name'];
    $extension = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($extension, $allowed, true)) {
        social_json(422, ['success' => false, 'error' => 'Formato de imagem nao permitido.']);
    }

    $upload_dir = __DIR__ . '/../uploads/';
    if (!is_dir($upload_dir) && !mkdir($upload_dir, 0755, true)) {
        social_json(500, ['success' => false, 'error' => 'Nao foi possivel preparar a pasta de uploads.']);
    }

    $new_name = sha1(uniqid((string) mt_rand(), true)) . '.' . $extension;
    $dest = $upload_dir . $new_name;

    if (!move_uploaded_file($_FILES[$field]['tmp_name'], $dest)) {
        social_json(500, ['success' => false, 'error' => 'Nao foi possivel salvar a imagem.']);
    }

    return $new_name;
}

function social_ensure_schema($conn)
{
    if (!$conn->query(
        "CREATE TABLE IF NOT EXISTS postagem_curtidas (
            id_participante INT NOT NULL,
            id_postagem INT NOT NULL,
            data_curtida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id_participante, id_postagem),
            INDEX idx_postagem_curtidas_postagem (id_postagem),
            CONSTRAINT fk_postagem_curtidas_participantes
                FOREIGN KEY (id_participante)
                REFERENCES participantes (id_participante)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            CONSTRAINT fk_postagem_curtidas_postagens
                FOREIGN KEY (id_postagem)
                REFERENCES postagens (id_postagem)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        ) ENGINE = InnoDB"
    )) {
        social_json(500, ['success' => false, 'error' => 'Nao foi possivel preparar os recursos sociais.']);
    }
}

function social_current_participante($conn)
{
    if (!isset($_SESSION['usuario_cpf']) || empty($_SESSION['usuario_cpf'])) {
        social_json(401, ['success' => false, 'error' => 'Participante nao autenticado.']);
    }

    $cpf = $_SESSION['usuario_cpf'];
    $stmt = $conn->prepare(
        "SELECT id_participante, nome, email, cpf
         FROM participantes
         WHERE cpf = ?
         LIMIT 1"
    );
    if (!$stmt) {
        social_json(500, ['success' => false, 'error' => 'Falha ao preparar consulta do participante.']);
    }

    $stmt->bind_param('s', $cpf);
    $stmt->execute();
    $participante = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$participante) {
        social_json(404, ['success' => false, 'error' => 'Participante nao encontrado.']);
    }

    $participante['id_participante'] = (int) $participante['id_participante'];
    return $participante;
}

function social_has_community_access($conn, $id_participante, $id_comunidade)
{
    $stmt = $conn->prepare(
        "SELECT c.id_comunidade, c.nome, c.id_evento
         FROM comunidades c
         WHERE c.id_comunidade = ?
           AND (
             EXISTS (
               SELECT 1
               FROM ingressos i
               WHERE i.id_participante = ?
                 AND i.id_evento = c.id_evento
                 AND i.status IN ('ativo', 'utilizado')
             )
             OR EXISTS (
               SELECT 1
               FROM participante_comunidades pc
               WHERE pc.id_participante = ?
                 AND pc.id_comunidade = c.id_comunidade
             )
           )
         LIMIT 1"
    );
    if (!$stmt) {
        social_json(500, ['success' => false, 'error' => 'Falha ao validar comunidade.']);
    }

    $stmt->bind_param('iii', $id_comunidade, $id_participante, $id_participante);
    $stmt->execute();
    $comunidade = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $comunidade ?: null;
}

if (!$conn || $conn->connect_error) {
    social_json(500, ['success' => false, 'error' => 'Erro de conexao com o banco de dados.']);
}

$conn->set_charset('utf8mb4');
$participante = social_current_participante($conn);
social_ensure_schema($conn);
$id_participante = (int) $participante['id_participante'];
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($_POST) || !empty($_FILES)) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
    }
    $action = $input['action'] ?? $action;
}

if ($action === 'feed' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare(
        "SELECT
            p.id_postagem,
            p.descricao,
            p.imagem,
            p.curtidas,
            p.data_postagem,
            DATE_FORMAT(p.data_postagem, '%d/%m %H:%i') AS data_formatada,
            pa.id_participante,
            pa.nome AS autor_nome,
            c.id_comunidade,
            c.nome AS comunidade_nome,
            c.id_evento,
            e.nome AS evento_nome,
            e.cidade,
            e.estado,
            COUNT(DISTINCT cm.id_comentario) AS total_comentarios,
            COUNT(DISTINCT pc.id_participante) AS total_curtidas,
            MAX(CASE WHEN pcl.id_participante IS NULL THEN 0 ELSE 1 END) AS curtido_por_mim
         FROM postagens p
         INNER JOIN participantes pa ON pa.id_participante = p.id_participante
         INNER JOIN comunidades c ON c.id_comunidade = p.id_comunidade
         INNER JOIN eventos e ON e.id_evento = c.id_evento
         LEFT JOIN comentarios cm ON cm.id_postagem = p.id_postagem
         LEFT JOIN postagem_curtidas pc ON pc.id_postagem = p.id_postagem
         LEFT JOIN postagem_curtidas pcl
            ON pcl.id_postagem = p.id_postagem
           AND pcl.id_participante = ?
         WHERE p.id_participante = ?
            OR EXISTS (
                SELECT 1
                FROM ingressos i
                WHERE i.id_participante = ?
                  AND i.id_evento = c.id_evento
                  AND i.status IN ('ativo', 'utilizado')
            )
            OR EXISTS (
                SELECT 1
                FROM participante_comunidades pm
                WHERE pm.id_participante = ?
                  AND pm.id_comunidade = c.id_comunidade
            )
         GROUP BY
            p.id_postagem,
            p.descricao,
            p.imagem,
            p.curtidas,
            p.data_postagem,
            pa.id_participante,
            pa.nome,
            c.id_comunidade,
            c.nome,
            c.id_evento,
            e.nome,
            e.cidade,
            e.estado
         ORDER BY p.data_postagem DESC
         LIMIT 80"
    );
    if (!$stmt) {
        social_json(500, ['success' => false, 'error' => 'Falha ao preparar feed social.']);
    }

    $stmt->bind_param('iiii', $id_participante, $id_participante, $id_participante, $id_participante);
    $stmt->execute();
    $result = $stmt->get_result();

    $posts = [];
    while ($row = $result->fetch_assoc()) {
        $row['id_postagem'] = (int) $row['id_postagem'];
        $row['id_participante'] = (int) $row['id_participante'];
        $row['id_comunidade'] = (int) $row['id_comunidade'];
        $row['id_evento'] = (int) $row['id_evento'];
        $row['total_comentarios'] = (int) $row['total_comentarios'];
        $row['total_curtidas'] = (int) $row['total_curtidas'];
        $row['curtidas'] = (int) max((int) $row['curtidas'], (int) $row['total_curtidas']);
        $row['curtido_por_mim'] = (int) $row['curtido_por_mim'] === 1;
        $row['is_mine'] = (int) $row['id_participante'] === $id_participante;
        $posts[] = $row;
    }
    $stmt->close();

    social_json(200, ['success' => true, 'user' => $participante, 'posts' => $posts]);
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_comunidade = social_int($input['id_comunidade'] ?? 0);
    $descricao = social_text($input['descricao'] ?? '', 500);
    $imagem = social_upload_image('imagem');

    if ($id_comunidade <= 0 || ($descricao === '' && $imagem === null)) {
        social_json(422, ['success' => false, 'error' => 'Escolha uma comunidade e escreva uma postagem.']);
    }

    $comunidade = social_has_community_access($conn, $id_participante, $id_comunidade);
    if (!$comunidade) {
        social_json(403, ['success' => false, 'error' => 'Voce nao tem acesso a esta comunidade.']);
    }

    $stmt = $conn->prepare(
        "INSERT INTO postagens (descricao, imagem, curtidas, id_participante, id_comunidade, data_postagem)
         VALUES (?, ?, 0, ?, ?, NOW())"
    );
    if (!$stmt) {
        social_json(500, ['success' => false, 'error' => 'Falha ao preparar postagem.']);
    }

    $stmt->bind_param('ssii', $descricao, $imagem, $id_participante, $id_comunidade);
    if (!$stmt->execute()) {
        $stmt->close();
        social_json(500, ['success' => false, 'error' => 'Nao foi possivel publicar a postagem.']);
    }

    $id_postagem = (int) $conn->insert_id;
    $stmt->close();

    social_json(201, ['success' => true, 'message' => 'Postagem publicada.', 'id_postagem' => $id_postagem]);
}

if ($action === 'like' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_postagem = social_int($input['id_postagem'] ?? 0);
    if ($id_postagem <= 0) {
        social_json(422, ['success' => false, 'error' => 'Postagem invalida.']);
    }

    $stmt_access = $conn->prepare(
        "SELECT p.id_comunidade
         FROM postagens p
         INNER JOIN comunidades c ON c.id_comunidade = p.id_comunidade
         WHERE p.id_postagem = ?
           AND (
             p.id_participante = ?
             OR EXISTS (
                SELECT 1
                FROM ingressos i
                WHERE i.id_participante = ?
                  AND i.id_evento = c.id_evento
                  AND i.status IN ('ativo', 'utilizado')
             )
             OR EXISTS (
                SELECT 1
                FROM participante_comunidades pc
                WHERE pc.id_participante = ?
                  AND pc.id_comunidade = c.id_comunidade
             )
           )
         LIMIT 1"
    );
    if (!$stmt_access) {
        social_json(500, ['success' => false, 'error' => 'Falha ao validar postagem.']);
    }
    $stmt_access->bind_param('iiii', $id_postagem, $id_participante, $id_participante, $id_participante);
    $stmt_access->execute();
    $post = $stmt_access->get_result()->fetch_assoc();
    $stmt_access->close();

    if (!$post) {
        social_json(404, ['success' => false, 'error' => 'Postagem nao encontrada.']);
    }

    $check = $conn->prepare(
        "SELECT 1
         FROM postagem_curtidas
         WHERE id_participante = ? AND id_postagem = ?
         LIMIT 1"
    );
    $check->bind_param('ii', $id_participante, $id_postagem);
    $check->execute();
    $check->store_result();
    $liked = $check->num_rows > 0;
    $check->close();

    if ($liked) {
        $stmt = $conn->prepare(
            "DELETE FROM postagem_curtidas
             WHERE id_participante = ? AND id_postagem = ?"
        );
        $stmt->bind_param('ii', $id_participante, $id_postagem);
        $stmt->execute();
        $stmt->close();
        $liked = false;
    } else {
        $stmt = $conn->prepare(
            "INSERT IGNORE INTO postagem_curtidas (id_participante, id_postagem)
             VALUES (?, ?)"
        );
        $stmt->bind_param('ii', $id_participante, $id_postagem);
        $stmt->execute();
        $stmt->close();
        $liked = true;
    }

    $count = 0;
    $stmt_count = $conn->prepare("SELECT COUNT(*) AS total FROM postagem_curtidas WHERE id_postagem = ?");
    $stmt_count->bind_param('i', $id_postagem);
    $stmt_count->execute();
    $count_row = $stmt_count->get_result()->fetch_assoc();
    $stmt_count->close();
    $count = (int) ($count_row['total'] ?? 0);

    $stmt_update = $conn->prepare("UPDATE postagens SET curtidas = ? WHERE id_postagem = ?");
    $stmt_update->bind_param('ii', $count, $id_postagem);
    $stmt_update->execute();
    $stmt_update->close();

    social_json(200, ['success' => true, 'liked' => $liked, 'total_curtidas' => $count]);
}

if ($action === 'comments' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $id_postagem = social_int($_GET['id_postagem'] ?? 0);
    if ($id_postagem <= 0) {
        social_json(422, ['success' => false, 'error' => 'Postagem invalida.']);
    }

    $stmt = $conn->prepare(
        "SELECT
            cm.id_comentario,
            cm.texto,
            cm.data_comentario,
            DATE_FORMAT(cm.data_comentario, '%d/%m %H:%i') AS data_formatada,
            p.id_postagem,
            pa.id_participante,
            pa.nome AS autor_nome
         FROM comentarios cm
         INNER JOIN postagens p ON p.id_postagem = cm.id_postagem
         INNER JOIN participantes pa ON pa.id_participante = cm.id_participante
         WHERE cm.id_postagem = ?
         ORDER BY cm.data_comentario ASC
         LIMIT 120"
    );
    if (!$stmt) {
        social_json(500, ['success' => false, 'error' => 'Falha ao preparar comentarios.']);
    }

    $stmt->bind_param('i', $id_postagem);
    $stmt->execute();
    $result = $stmt->get_result();
    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $row['id_comentario'] = (int) $row['id_comentario'];
        $row['id_postagem'] = (int) $row['id_postagem'];
        $row['id_participante'] = (int) $row['id_participante'];
        $comments[] = $row;
    }
    $stmt->close();

    social_json(200, ['success' => true, 'comments' => $comments]);
}

if ($action === 'comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_postagem = social_int($input['id_postagem'] ?? 0);
    $texto = social_text($input['texto'] ?? '', 500);

    if ($id_postagem <= 0 || $texto === '') {
        social_json(422, ['success' => false, 'error' => 'Escreva um comentario antes de enviar.']);
    }

    $stmt_access = $conn->prepare(
        "SELECT p.id_postagem
         FROM postagens p
         INNER JOIN comunidades c ON c.id_comunidade = p.id_comunidade
         WHERE p.id_postagem = ?
           AND (
             p.id_participante = ?
             OR EXISTS (
                SELECT 1
                FROM ingressos i
                WHERE i.id_participante = ?
                  AND i.id_evento = c.id_evento
                  AND i.status IN ('ativo', 'utilizado')
             )
             OR EXISTS (
                SELECT 1
                FROM participante_comunidades pc
                WHERE pc.id_participante = ?
                  AND pc.id_comunidade = c.id_comunidade
             )
           )
         LIMIT 1"
    );
    if (!$stmt_access) {
        social_json(500, ['success' => false, 'error' => 'Falha ao validar comentario.']);
    }
    $stmt_access->bind_param('iiii', $id_postagem, $id_participante, $id_participante, $id_participante);
    $stmt_access->execute();
    $exists = $stmt_access->get_result()->fetch_assoc();
    $stmt_access->close();

    if (!$exists) {
        social_json(404, ['success' => false, 'error' => 'Postagem nao encontrada.']);
    }

    $stmt = $conn->prepare(
        "INSERT INTO comentarios (texto, id_postagem, id_participante, data_comentario)
         VALUES (?, ?, ?, NOW())"
    );
    if (!$stmt) {
        social_json(500, ['success' => false, 'error' => 'Falha ao preparar comentario.']);
    }
    $stmt->bind_param('sii', $texto, $id_postagem, $id_participante);
    if (!$stmt->execute()) {
        $stmt->close();
        social_json(500, ['success' => false, 'error' => 'Nao foi possivel enviar o comentario.']);
    }
    $stmt->close();

    social_json(201, ['success' => true, 'message' => 'Comentario enviado.']);
}

social_json(400, ['success' => false, 'error' => 'Acao invalida.']);
?>
