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
            } else {
                // Se não tem sessão ativa, redireciona para login
                window.location.href = 'loginSuporte.html';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados:', error);
            showLegacyToast('Erro ao carregar informações da sessão', 'error');
        });
}

function showLegacyToast(message, type = 'success') {
    let toast = document.getElementById('legacyToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'legacyToast';
        toast.style.position = 'fixed';
        toast.style.right = '24px';
        toast.style.bottom = '24px';
        toast.style.zIndex = '9999';
        toast.style.padding = '14px 18px';
        toast.style.borderRadius = '14px';
        toast.style.fontFamily = 'Poppins, sans-serif';
        toast.style.fontWeight = '700';
        toast.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = type === 'error' ? 'rgba(127,29,29,0.94)' : 'rgba(26,14,46,0.96)';
    toast.style.border = type === 'error' ? '1px solid rgba(248,113,113,0.45)' : '1px solid rgba(157,78,221,0.45)';
    toast.style.color = '#fff';
    toast.style.display = 'block';
    window.setTimeout(() => {
        toast.style.display = 'none';
    }, 2200);
}

