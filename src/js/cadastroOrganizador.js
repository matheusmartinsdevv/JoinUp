document.addEventListener('DOMContentLoaded', () => {
    const ctaForm = document.getElementById('ctaForm');

    if (ctaForm) {
        ctaForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o envio padrão do HTML

            // pega os dados do forms
            const formData = new FormData(ctaForm);

            try {
                // envia para o PHP
                const response = await fetch('../php/cadastroOrganizador.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.text();

                // verifica a resposta do PHP
                if (result.trim() === "sucesso") {
                    alert("Cadastro realizado com sucesso! Redirecionando...");
                    window.location.href = 'loginOrganizador.html';
                } else {
                    alert("Erro no cadastro: " + result);
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                alert("Erro ao conectar com o servidor. Verifique se o XAMPP está ligado.");
            }
        
        });
    }

});

    
    
