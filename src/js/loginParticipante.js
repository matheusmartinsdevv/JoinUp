document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm'); // Certifique-se que o ID no HTML é este

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede a página de recarregar

            const formData = new FormData(loginForm);

            try {
                // Envia os dados para o PHP de login
                const response = await fetch('../php/loginParticipante.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.text();

                // Verifica a resposta do servidor
                if (result.trim() === "sucesso") {
                    // Se deu certo, vai para a Dashboard do Participante
                    window.location.href = 'feed.html';
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