<?php
include __DIR__ . '/conexao.php';

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$cidade = isset($_GET['cidade']) ? trim($_GET['cidade']) : '';
$eventos = [];
$erro_busca = '';

if ($conn->connect_error) {
    $erro_busca = 'Nao foi possivel conectar ao banco de dados.';
} else {
    $conn->set_charset('utf8mb4');

    $sql = "
        SELECT
            e.id_evento,
            e.nome,
            e.data,
            e.descricao,
            e.localizacao,
            gm.nome AS genero,
            o.nome AS organizador
        FROM eventos e
        LEFT JOIN generos_musicais gm ON gm.id_genero_musical = e.id_genero_musical
        LEFT JOIN organizadores o ON o.id_organizador = e.id_organizador
        WHERE 1 = 1
    ";

    $types = '';
    $params = [];

    if ($q !== '') {
        $like_q = '%' . $q . '%';
        $sql .= " AND (e.nome LIKE ? OR e.descricao LIKE ? OR e.localizacao LIKE ? OR gm.nome LIKE ? OR o.nome LIKE ?)";
        $types .= 'sssss';
        $params[] = $like_q;
        $params[] = $like_q;
        $params[] = $like_q;
        $params[] = $like_q;
        $params[] = $like_q;
    }

    if ($cidade !== '') {
        $like_cidade = '%' . $cidade . '%';
        $sql .= " AND e.localizacao LIKE ?";
        $types .= 's';
        $params[] = $like_cidade;
    }

    $sql .= " ORDER BY e.data ASC LIMIT 50";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        $erro_busca = 'Nao foi possivel preparar a busca de eventos.';
    } else {
        if ($types !== '') {
            $stmt->bind_param($types, ...$params);
        }

        if ($stmt->execute()) {
            $resultado = $stmt->get_result();
            while ($row = $resultado->fetch_assoc()) {
                $eventos[] = $row;
            }
        } else {
            $erro_busca = 'Erro ao executar a busca de eventos.';
        }

        $stmt->close();
    }

    $conn->close();
}

function e($texto)
{
    return htmlspecialchars((string) $texto, ENT_QUOTES, 'UTF-8');
}

function formatar_data($data)
{
    if (empty($data)) {
        return 'Data nao informada';
    }

    $timestamp = strtotime($data);
    if ($timestamp === false) {
        return 'Data invalida';
    }

    return date('d/m/Y H:i', $timestamp);
}

function resumo($texto, $limite = 180)
{
    $texto = trim((string) $texto);

    if ($texto === '') {
        return 'Sem descricao.';
    }

    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        if (mb_strlen($texto, 'UTF-8') <= $limite) {
            return $texto;
        }

        return mb_substr($texto, 0, $limite, 'UTF-8') . '...';
    }

    if (strlen($texto) <= $limite) {
        return $texto;
    }

    return substr($texto, 0, $limite) . '...';
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Busca de Eventos | JoinUp</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../Css/styles.css?v=20260412">
</head>
<body class="results-page">
    <main class="container results-layout">
        <section class="results-top glass">
            <span class="results-badge">Busca de eventos</span>
            <h1 class="results-title">Resultados da busca</h1>
            <p class="results-subtitle">Encontre eventos por nome, descricao, local, genero ou organizador.</p>

            <form class="results-search-form" action="eventos.php" method="get">
                <label class="results-field-wrap">
                    <span class="results-field-label">Termo</span>
                    <input class="results-field" type="search" name="q" placeholder="Ex.: Rock in Rio" value="<?= e($q) ?>">
                </label>
                <label class="results-field-wrap">
                    <span class="results-field-label">Cidade</span>
                    <input class="results-field" type="search" name="cidade" placeholder="Cidade ou local" value="<?= e($cidade) ?>">
                </label>
                <button class="btn btn--primary btn--glow results-btn" type="submit">Buscar</button>
            </form>

            <p class="results-meta">
                <span class="results-count"><?= count($eventos) ?></span> evento(s) encontrado(s)
                <?php if ($q !== '' || $cidade !== ''): ?>
                    para
                    <?php if ($q !== ''): ?>
                        "<strong><?= e($q) ?></strong>"
                    <?php endif; ?>
                    <?php if ($cidade !== ''): ?>
                        em "<strong><?= e($cidade) ?></strong>"
                    <?php endif; ?>
                <?php endif; ?>
            </p>
        </section>

        <?php if ($erro_busca !== ''): ?>
            <div class="results-error"><?= e($erro_busca) ?></div>
        <?php endif; ?>

        <?php if (!empty($eventos)): ?>
            <section class="results-list">
                <?php foreach ($eventos as $evento): ?>
                    <article class="results-card glass">
                        <div class="results-card__head">
                            <h2 class="results-card__name"><?= e($evento['nome']) ?></h2>
                            <span class="results-chip results-chip--date"><?= e(formatar_data($evento['data'])) ?></span>
                        </div>

                        <div class="results-card__chips">
                            <span class="results-chip">Local: <strong><?= e($evento['localizacao']) ?></strong></span>
                            <span class="results-chip">Genero: <strong><?= e($evento['genero'] ?: 'Nao informado') ?></strong></span>
                            <span class="results-chip">Organizador: <strong><?= e($evento['organizador'] ?: 'Nao informado') ?></strong></span>
                        </div>

                        <p class="results-card__desc"><?= e(resumo($evento['descricao'])) ?></p>
                    </article>
                <?php endforeach; ?>
            </section>
        <?php else: ?>
            <div class="results-empty glass">
                <h2 class="results-empty__title">Nenhum evento encontrado</h2>
                <p class="results-empty__text">Tente outro termo, cidade ou uma combinacao mais ampla.</p>
            </div>
        <?php endif; ?>

        <div class="results-actions">
            <a class="results-back-link" href="../html/index.html">Voltar para a pagina inicial</a>
        </div>
    </main>
</body>
</html>
