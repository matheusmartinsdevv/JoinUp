<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include __DIR__ . '/conexao.php';

// ─── Autenticação Dual ─────────────────────────────────────────────────────
$is_participante = isset($_SESSION['usuario_cpf'])  && !empty($_SESSION['usuario_cpf']);
$is_organizador  = isset($_SESSION['usuario_cnpj']) && !empty($_SESSION['usuario_cnpj']);

// Em caso de sessão compartilhada antiga, prioriza o organizador para evitar enviar mensagens como participante.
if ($is_participante && $is_organizador) {
    $is_participante = false;
}

if (!$is_participante && !$is_organizador) {
    echo json_encode(['success' => false, 'error' => 'Usuário não autenticado.']);
    exit;
}

// Resolver ID do usuário atual
if ($is_participante) {
    $stmt = $conn->prepare("SELECT id_participante FROM participantes WHERE cpf = ?");
    $stmt->bind_param('s', $_SESSION['usuario_cpf']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'Participante não encontrado.']);
        exit;
    }
    $id_participante = (int)$user['id_participante'];
} else {
    $stmt = $conn->prepare("SELECT id_organizador FROM organizadores WHERE cnpj = ?");
    $stmt->bind_param('s', $_SESSION['usuario_cnpj']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'Organizador não encontrado.']);
        exit;
    }
    $id_organizador = (int)$user['id_organizador'];
}

// ─── POST: Ações (entrar / sair) — apenas participante ────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$is_participante) {
        echo json_encode(['success' => false, 'error' => 'Ação não permitida para organizadores.']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['action'], $input['id_comunidade'])) {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos.']);
        exit;
    }

    $action        = $input['action'];
    $id_comunidade = (int)$input['id_comunidade'];

    if ($action === 'entrar') {
        $access = $conn->prepare(
            "SELECT 1
             FROM comunidades c
             INNER JOIN ingressos i ON i.id_evento = c.id_evento
             WHERE c.id_comunidade = ?
               AND i.id_participante = ?
               AND i.status IN ('ativo', 'utilizado')
             LIMIT 1"
        );
        if (!$access) {
            echo json_encode(['success' => false, 'error' => 'Não foi possível validar acesso à comunidade.']);
            exit;
        }
        $access->bind_param('ii', $id_comunidade, $id_participante);
        $access->execute();
        $access->store_result();
        if ($access->num_rows === 0) {
            $access->close();
            echo json_encode(['success' => false, 'error' => 'Compre um ingresso para entrar nesta comunidade.']);
            exit;
        }
        $access->close();

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

// ─── GET: Listar comunidades ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['fetch'])) {

    if ($is_participante) {
        $stmt = $conn->prepare("
            SELECT
                c.id_comunidade,
                c.nome,
                c.descricao,
                c.imagem,
                c.id_evento,
                e.nome      AS nome_evento,
                e.cidade,
                e.estado,
                e.data      AS data_evento,
                (SELECT COUNT(*)
                 FROM participante_comunidades pc2
                 WHERE pc2.id_comunidade = c.id_comunidade) AS total_membros,
                (SELECT COUNT(*)
                 FROM ingressos i
                 WHERE i.id_participante = ?
                   AND i.id_evento       = c.id_evento
                   AND i.status IN ('ativo','utilizado')
                ) AS has_ingresso,
                (SELECT COUNT(*)
                 FROM participante_comunidades pc3
                 WHERE pc3.id_participante = ?
                   AND pc3.id_comunidade = c.id_comunidade
                ) AS is_membro
            FROM comunidades c
            INNER JOIN eventos e ON e.id_evento = c.id_evento
            ORDER BY has_ingresso DESC, c.nome ASC
        ");
        $stmt->bind_param('ii', $id_participante, $id_participante);
        $stmt->execute();
        $todas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        foreach ($todas as &$c) {
            $c['has_ingresso']  = (int)$c['has_ingresso'] > 0 ? 1 : 0;
            $c['is_membro']      = (int)$c['is_membro'] > 0 ? 1 : 0;
            $c['total_membros'] = (int)$c['total_membros'];
        }
        unset($c);

        $minhas   = array_values(array_filter($todas, fn($c) => $c['has_ingresso'] === 1));
        $explorar = array_values(array_filter($todas, fn($c) => $c['has_ingresso'] === 0));

        echo json_encode([
            'success'  => true,
            'minhas'   => $minhas,
            'explorar' => $explorar,
        ]);

    } else {
        // Organizador: apenas as comunidades dos seus eventos (acesso total)
        $stmt = $conn->prepare("
            SELECT
                c.id_comunidade,
                c.nome,
                c.descricao,
                c.imagem,
                c.id_evento,
                e.nome      AS nome_evento,
                e.cidade,
                e.estado,
                e.data      AS data_evento,
                (SELECT COUNT(*)
                 FROM participante_comunidades pc2
                 WHERE pc2.id_comunidade = c.id_comunidade) AS total_membros,
                1 AS has_ingresso
            FROM comunidades c
            INNER JOIN eventos e ON e.id_evento = c.id_evento
            WHERE e.id_organizador = ?
            ORDER BY c.nome ASC
        ");
        $stmt->bind_param('i', $id_organizador);
        $stmt->execute();
        $minhas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        foreach ($minhas as &$c) {
            $c['has_ingresso']  = 1;
            $c['total_membros'] = (int)$c['total_membros'];
        }
        unset($c);

        echo json_encode([
            'success'  => true,
            'minhas'   => $minhas,
            'explorar' => [],
        ]);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Requisição inválida.']);
$conn->close();
?>
