<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include __DIR__ . '/conexao.php';

if (!isset($_SESSION['usuario_cpf'])) {
    echo json_encode(['success' => false, 'error' => 'Usuário não autenticado.']);
    exit;
}

$cpf = $_SESSION['usuario_cpf'];

$stmt_user = $conn->prepare("SELECT id_participante FROM participantes WHERE cpf = ?");
$stmt_user->bind_param('s', $cpf);
$stmt_user->execute();
$result_user = $stmt_user->get_result();
$user = $result_user->fetch_assoc();
$stmt_user->close();

if (!$user) {
    echo json_encode(['success' => false, 'error' => 'Participante não encontrado.']);
    exit;
}

$id_participante = (int) $user['id_participante'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['action'], $input['id_comunidade'])) {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos.']);
        exit;
    }

    $action       = $input['action'];
    $id_comunidade = (int) $input['id_comunidade'];

    if ($action === 'entrar') {
        $check = $conn->prepare(
            "SELECT 1 FROM participante_comunidades 
             WHERE id_participante = ? AND id_comunidade = ?"
        );
        $check->bind_param('ii', $id_participante, $id_comunidade);
        $check->execute();
        $check->store_result();

        if ($check->num_rows > 0) {
            echo json_encode(['success' => false, 'error' => 'Você já faz parte desta comunidade.']);
            exit;
        }
        $check->close();

        $stmt = $conn->prepare(
            "INSERT INTO participante_comunidades (id_participante, id_comunidade) VALUES (?, ?)"
        );
        $stmt->bind_param('ii', $id_participante, $id_comunidade);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Entrou na comunidade com sucesso!']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Erro ao entrar na comunidade.']);
        }
        exit;
    }

    if ($action === 'sair') {
        $stmt = $conn->prepare(
            "DELETE FROM participante_comunidades 
             WHERE id_participante = ? AND id_comunidade = ?"
        );
        $stmt->bind_param('ii', $id_participante, $id_comunidade);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Você saiu da comunidade.']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Erro ao sair da comunidade.']);
        }
        exit;
    }

    echo json_encode(['success' => false, 'error' => 'Ação inválida.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['fetch'])) {

    $minhas = $conn->prepare(
        "SELECT c.id_comunidade, c.nome, c.descricao, c.imagem,
                e.nome AS nome_evento, e.cidade, e.estado, e.data AS data_evento,
                (SELECT COUNT(*) FROM participante_comunidades pc2 
                 WHERE pc2.id_comunidade = c.id_comunidade) AS total_membros
         FROM comunidades c
         INNER JOIN participante_comunidades pc ON pc.id_comunidade = c.id_comunidade
         INNER JOIN eventos e ON e.id_evento = c.id_evento
         WHERE pc.id_participante = ?
         ORDER BY c.nome ASC"
    );
    $minhas->bind_param('i', $id_participante);
    $minhas->execute();
    $minhas_comunidades = $minhas->get_result()->fetch_all(MYSQLI_ASSOC);

    $explorar = $conn->prepare(
        "SELECT c.id_comunidade, c.nome, c.descricao, c.imagem,
                e.nome AS nome_evento, e.cidade, e.estado, e.data AS data_evento,
                (SELECT COUNT(*) FROM participante_comunidades pc2 
                 WHERE pc2.id_comunidade = c.id_comunidade) AS total_membros
         FROM comunidades c
         INNER JOIN eventos e ON e.id_evento = c.id_evento
         WHERE c.id_comunidade NOT IN (
             SELECT id_comunidade FROM participante_comunidades
             WHERE id_participante = ?
         )
         ORDER BY total_membros DESC, c.nome ASC"
    );
    $explorar->bind_param('i', $id_participante);
    $explorar->execute();
    $explorar_comunidades = $explorar->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'success'  => true,
        'minhas'   => $minhas_comunidades,
        'explorar' => $explorar_comunidades
    ]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Requisição inválida.']);
$conn->close();
?>