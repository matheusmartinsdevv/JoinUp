document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../php/get_user_data.php');
        const data = await response.json();

        if (data.error) {
            window.location.href = 'login.html'; // Se não estiver logado, volta pro login
            return;
        }

        // Preenche o HTML com os dados do banco
        document.getElementById('user-name').textContent = data.nome.split(' ')[0]; // Pega só o primeiro nome
        document.getElementById('info-nome').textContent = data.nome;
        document.getElementById('info-email').textContent = data.email;
        document.getElementById('info-cpf').textContent = data.cpf;

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }

    // Lógica rápida para o botão excluir (O "D" do CRUD)
    document.getElementById('btnExcluir').addEventListener('click', async () => {
        if (confirm("Tem certeza que deseja excluir sua conta? Esta ação é permanente.")) {
            const res = await fetch('../php/excluir_conta.php');
            const result = await res.text();
            if (result.trim() === "sucesso") {
                alert("Conta excluída com sucesso.");
                window.location.href = 'cadastro.html';
            }
        }
    });
});