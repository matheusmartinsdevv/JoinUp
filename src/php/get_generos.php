<?php
header('Content-Type: application/json; charset=utf-8');
include 'conexao.php';

if (!$conn || $conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Erro de conexão']);
    exit;
}

$query = "SELECT id_genero_musical, nome FROM generos_musicais ORDER BY nome ASC";
$resultado = $conn->query($query);

if (!$resultado) {
    echo json_encode(['success' => false, 'message' => 'Erro na query: ' . $conn->error]);
    exit;
}

$generos = [];
while ($row = $resultado->fetch_assoc()) {
    $generos[] = ['id' => $row['id_genero_musical'], 'nome' => $row['nome']];
}

echo json_encode(['success' => true, 'data' => $generos]);
$conn->close();
?>
