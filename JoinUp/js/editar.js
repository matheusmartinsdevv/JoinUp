document.addEventListener('DOMContentLoaded', async () => {
    // 1. Carrega os dados atuais nos inputs
    try {
        const response = await fetch('../php/get_user_data.php');
        const data = await response.json();

        if (data.error) {
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('edit-nome').value = data.nome;
        document.getElementById('edit-email').value = data.email;
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }

    // 2. Envia a atualização
    const editForm = document.getElementById('editForm');
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editForm);

        const res = await fetch('../php/editar_perfil.php', {
            method: 'POST',
            body: formData
        });

        const result = await res.text();
        if (result.trim() === "sucesso") {
            alert("Perfil atualizado com sucesso!");
            window.location.href = 'dashboard.html';
        } else {
            alert("Erro ao atualizar: " + result);
        }
    });
});