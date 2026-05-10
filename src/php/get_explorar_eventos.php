<?php
error_reporting(0);
session_start();
include 'conexao.php';

header('Content-Type: application/json');

// Consulta principal de eventos
$sql_eventos = "SELECT 
    e.id_evento, 
    e.nome AS evento_nome, 
    e.data, 
    e.localizacao, 
    e.cidade, 
    e.estado, 
    e.descricao,
    e.imagem,
    g.nome AS genero_nome,
    (SELECT MIN(valor) FROM tipos_ingressos WHERE id_evento = e.id_evento) AS menor_preco,
    (SELECT COUNT(*) FROM ingressos WHERE id_evento = e.id_evento) AS total_participantes
FROM eventos e
JOIN generos_musicais g ON e.id_genero_musical = g.id_genero_musical
ORDER BY e.data ASC";

$res_eventos = $conn->query($sql_eventos);
$eventos = [];

if ($res_eventos && $res_eventos->num_rows > 0) {
    while($evento = $res_eventos->fetch_assoc()) {
        $id_ev = $evento['id_evento'];
        
        // Busca artistas do evento
        $sql_artistas = "SELECT a.nome FROM artistas a 
                         JOIN line_up l ON a.id_artista = l.id_artista 
                         WHERE l.id_evento = $id_ev";
        $res_artistas = $conn->query($sql_artistas);
        $artistas = [];
        while($art = $res_artistas->fetch_assoc()) {
            $artistas[] = $art['nome'];
        }
        
        $evento['artistas'] = $artistas;
        $evento['data_formatada'] = date('d/m/Y H:i', strtotime($evento['data']));
        $evento['preco_formatado'] = $evento['menor_preco'] ? 'R$ ' . number_format($evento['menor_preco'], 2, ',', '.') : 'Grátis';
        
        $eventos[] = $evento;
    }
}

echo json_encode($eventos);
$conn->close();
?>
