<?php
$host = "localhost";
$usuario = "root";
$senha_db = "";
$nome_banco = "joinup";
$port = "3306";

$conn = new mysqli($host, $usuario, $senha_db, $nome_banco, $port);

if ($conn->connect_error) {
    die("Falha na conexão: " . $conn->connect_error);
}
?>