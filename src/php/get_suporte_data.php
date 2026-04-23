<?php
// Inicia a sessão para acessar os dados salvos
session_start();

// Define o header como JSON
header('Content-Type: application/json');

// Verifica se o usuário de suporte está logado
if (isset($_SESSION['suporte_id'])) {
    // Retorna os dados da sessão em JSON
    echo json_encode([
        'sucesso' => true,
        'id' => $_SESSION['suporte_id'],
        'nome' => $_SESSION['suporte_nome'] ?? 'Suporte',
        'email' => $_SESSION['suporte_email'] ?? '',
        'mensagem' => 'Dados carregados com sucesso'
    ]);
} else {
    // Se não tem sessão, retorna erro
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Nenhuma sessão de suporte ativa'
    ]);
}
?>
