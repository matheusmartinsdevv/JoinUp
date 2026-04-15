<?php 
    include 'conexao.php';
    session_start();

    if (!isset($_SESSION['usuario_cnpj'])) {
        die("Erro: Usuário não autenticado.");
    }
    
    $nome = $_POST['nome'];
    $descricao = $_POST['descricao'];
    $data_raw = $_POST['data'];
    $local = $_POST['local'];
    $id_genero_musical = $_POST['genero'];
    $cnpj_organizador = $_SESSION['usuario_cnpj'];
    
    if (empty($nome) || empty($data_raw) || empty($id_genero_musical) || !is_numeric($id_genero_musical)) {
        die("Erro: Campos obrigatórios não preenchidos ou inválidos.");
    }

    // Buscar id_organizador
    $stmt_organizador = $conn->prepare("SELECT id_organizador FROM organizadores WHERE cnpj = ?");
    $stmt_organizador->bind_param("s", $cnpj_organizador);
    $stmt_organizador->execute();
    $result_organizador = $stmt_organizador->get_result();
    
    if ($result_organizador->num_rows === 0) {
        die("Erro: Organizador não encontrado.");
    }
    
    $organizador = $result_organizador->fetch_assoc();
    $id_organizador = $organizador['id_organizador'];
    $stmt_organizador->close();
    
    $data_formatada = date('Y-m-d H:i:s', strtotime($data_raw));
    
    if (!$data_formatada || $data_formatada === '1970-01-01 00:00:00' || strtotime($data_raw) === false) {
        die("Erro: Data inválida ou não preenchida. Recebido: " . $data_raw);
    }
    

    $stmt = $conn->prepare("INSERT INTO eventos (nome, data, descricao, localizacao, id_genero_musical, id_organizador) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssii", $nome, $data_formatada, $descricao, $local, $id_genero_musical, $id_organizador);

    if ($stmt->execute()) {
        ?>
        <!DOCTYPE html>
        <html>
        <head><title>Sucesso</title></head>
        <body style="background:#090714;color:#fff;text-align:center;padding:50px;font-family:Arial;">
            <h1>✅ Evento criado!</h1>
            <p>Redirecionando...</p>
            <script>setTimeout(()=>{window.location.href='../html/dashboardOrganizador.html?success=1';},1500);</script>
        </body>
        </html>
        <?php
        exit();
    } else {
        echo "Erro: " . $stmt->error;
    }
    $stmt->close();
    $conn->close();

?>