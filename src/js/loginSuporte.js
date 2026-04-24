document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede a página de recarregar

            const formData = new FormData(loginForm);

            try {
                // Envia os dados para o PHP de login
                const response = await fetch('../php/loginSuporte.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.text();

                // Verifica a resposta do servidor
                if (result.trim() === "sucesso") {
                    // Se deu certo, vai para o Dashboard de Suporte
                    window.location.href = 'suporte.html';
                } else {
                    // Se deu erro (senha errada, etc), mostra o motivo
                    alert(result);
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                alert("Erro ao conectar com o servidor.");
            }
        });
    }
});
