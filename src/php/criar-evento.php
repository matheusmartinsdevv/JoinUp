<?php 
    include 'conexao.php';
    session_start();

    if (!isset($_SESSION['usuario_cpf'])) {
        die("Erro: Usuário não autenticado.");
    }
    
    $nome = $_POST['nome'];
    $descricao = $_POST['descricao'];
    $data = $_POST['data'];
    $local = $_POST['local'];
    $id_organizador =$_SESSION['usuario_cpf'];
    

    $stmt = $conn->prepare("INSERT INTO eventos (nome, data, descricao, localizacao, id_organizador) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $nome, $data, $descricao, $local, $id_organizador);

    if ($stmt->execute()) {
        echo "Evento criado com sucesso!";
    } else {
        echo "Erro ao criar evento: " . $stmt->error;
    }
    $stmt->close();
    $conn->close();

?>