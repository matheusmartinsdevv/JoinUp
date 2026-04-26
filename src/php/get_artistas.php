<?php
// get_artistas.php - Carrega lista de artistas para seleção múltipla no formulário de criação de evento
header('Content-Type: application/json; charset=utf-8');
include 'conexao.php';

if (!$conn || $conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Erro de conexão com o banco de dados']);
    exit;
}

// Consulta para buscar artistas
$query = "SELECT id_artista, nome FROM artistas ORDER BY nome ASC";
$resultado = $conn->query($query);

if (!$resultado) {
    echo json_encode(['success' => false, 'message' => 'Erro na consulta: ' . $conn->error]);
    exit;
}

$artistas = [];
while ($row = $resultado->fetch_assoc()) {
    $artistas[] = ['id' => $row['id_artista'], 'nome' => $row['nome']];
}

echo json_encode(['success' => true, 'data' => $artistas]);
$conn->close();
?>