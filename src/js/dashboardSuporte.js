document.addEventListener('DOMContentLoaded', () => {
    // Valida a sessão e carrega os dados automaticamente ao abrir o dashboard
    carregarDadosSessao();
});

 
 //Carrega e exibe os dados da sessão do usuário suporte
 
function carregarDadosSessao() {
    // Busca os dados salvos na sessão
    fetch('../php/get_suporte_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                // Preenche os dados na página
                document.getElementById('suporte-nome').textContent = data.nome || 'Não informado';
                document.getElementById('suporte-email').textContent = data.email || 'Não informado';
                
                console.log('Dados da sessão carregados:', data);
            } else {
                // Se não tem sessão ativa, redireciona para login
                console.log('Sem sessão ativa - redirecionando');
                window.location.href = 'loginSuporte.html';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar informações da sessão');
        });
}


