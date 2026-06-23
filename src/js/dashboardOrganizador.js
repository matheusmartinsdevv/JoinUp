document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../php/get_user_data_organizador.php');
        const data = await response.json();

        if (data.error) {
            window.location.href = 'loginOrganizador.html'; // Se não estiver logado, volta pro login
            return;
        }

        // Preenche o HTML com os dados do banco
        document.getElementById('user-name').textContent = data.nome.split(' ')[0]; // Pega só o primeiro nome
        document.getElementById('info-nome').textContent = data.nome;
        document.getElementById('info-email').textContent = data.email;
        document.getElementById('info-cnpj').textContent = data.cnpj;

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }

    // Lógica para o botão excluir (O "D" do CRUD)
    document.getElementById('btnExcluir').addEventListener('click', async () => {
        if (confirm("Tem certeza que deseja excluir sua conta? Esta ação é permanente.")) {
            const res = await fetch('../php/excluir_conta_organizador.php');
            const result = await res.text();
            if (result.trim() === "sucesso") {
                showLegacyToast("Conta excluída com sucesso.");
                window.location.href = 'index.html';
            }
        }
    });
});

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
