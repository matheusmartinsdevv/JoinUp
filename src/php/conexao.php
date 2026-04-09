<?php
$host = "localhost";
$usuario = "root";
$senha_db = "";
$nome_banco = "joinup";

$conn = new mysqli($host, $usuario, $senha_db, $nome_banco);

if ($conn->connect_error) {
    die("Falha na conexão: " . $conn->connect_error);
}
?>