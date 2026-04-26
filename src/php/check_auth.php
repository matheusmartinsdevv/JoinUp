<?php
// check_auth.php - Verifica se o usuário está autenticado
header('Content-Type: application/json; charset=utf-8');
session_start();

$authenticated = isset($_SESSION['usuario_cnpj']) && !empty($_SESSION['usuario_cnpj']);

echo json_encode(['authenticated' => $authenticated]);
?>