<?php
$host = "localhost";
$usuario = "root";
$senha_db = "";
$nome_banco = "joinup";

$conn = @new mysqli($host, $usuario, $senha_db, $nome_banco);

if ($conn instanceof mysqli && $conn->connect_error) {
    $conn = null;
}
?>