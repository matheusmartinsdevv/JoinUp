

(function () {
    'use strict';

    const minhasGrid    = document.getElementById('minhas-comunidades-grid');
    const explorarGrid  = document.getElementById('explorar-grid');
    const minhasVazio   = document.getElementById('minhas-vazio');
    const explorarVazio = document.getElementById('explorar-vazio');

    function showToast(msg, erro = false) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = 'toast' + (erro ? ' toast--erro' : '');
        toast.style.display = 'block';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3200);
    }

    function renderSkeletons(grid, qtd = 6) {
        grid.innerHTML = '';
        for (let i = 0; i < qtd; i++) {
            const sk = document.createElement('div');
            sk.className = 'skeleton';
            grid.appendChild(sk);
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function criarCard(c, ehMinha) {
        const card = document.createElement('div');
        card.className = 'comunidade-card';
        card.dataset.id = c.id_comunidade;

        const badge = ehMinha
            ? `<span class="comunidade-card__badge-membro"><i class="fa-solid fa-check"></i> Membro</span>`
            : '';

        const imgHtml = c.imagem
            ? `<img class="comunidade-card__img" src="../uploads/${escapeHtml(c.imagem)}" alt="${escapeHtml(c.nome)}">`
            : `<div class="comunidade-card__img-placeholder"><i class="fa-solid fa-music"></i></div>`;

        const btnClass  = ehMinha ? 'comunidade-card__btn--sair'   : 'comunidade-card__btn--entrar';
        const btnLabel  = ehMinha ? 'Sair'                         : 'Entrar';
        const btnAction = ehMinha ? 'sair'                         : 'entrar';

        card.innerHTML = `
            ${badge}
            ${imgHtml}
            <div class="comunidade-card__body">
                <p class="comunidade-card__titulo">${escapeHtml(c.nome)}</p>
                <p class="comunidade-card__evento">${escapeHtml(c.nome_evento)}</p>
                <p class="comunidade-card__membros"><i class="fa-solid fa-users"></i> ${c.total_membros} membro${c.total_membros != 1 ? 's' : ''}</p>
                <button class="comunidade-card__btn ${btnClass}" data-action="${btnAction}" data-id="${c.id_comunidade}">
                    ${btnLabel}
                </button>
            </div>`;

        card.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            handleAcao(btnAction, c.id_comunidade, card);
        });

        return card;
    }

    function renderizarComunidades(data) {
        minhasGrid.innerHTML = '';
        if (data.minhas.length === 0) {
            minhasVazio.style.display = 'block';
        } else {
            minhasVazio.style.display = 'none';
            data.minhas.forEach(c => minhasGrid.appendChild(criarCard(c, true)));
        }

        explorarGrid.innerHTML = '';
        if (data.explorar.length === 0) {
            explorarVazio.style.display = 'block';
        } else {
            explorarVazio.style.display = 'none';
            data.explorar.forEach(c => explorarGrid.appendChild(criarCard(c, false)));
        }
    }

    function carregarComunidades() {
        renderSkeletons(minhasGrid, 4);
        renderSkeletons(explorarGrid, 6);

        fetch('../php/comunidades.php?fetch=1')
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    renderizarComunidades(data);
                } else {
                    showToast(data.error || 'Erro ao carregar comunidades.', true);
                }
            })
            .catch(() => showToast('Falha de conexão com o servidor.', true));
    }

    function handleAcao(action, id_comunidade, card) {
        const btn = card.querySelector('button');
        btn.disabled = true;
        btn.textContent = '...';

        fetch('../php/comunidades.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, id_comunidade: id_comunidade })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message);
                    carregarComunidades();
                } else {
                    showToast(data.error || 'Erro na operação.', true);
                    btn.disabled = false;
                    btn.textContent = action === 'entrar' ? 'Entrar' : 'Sair';
                }
            })
            .catch(() => {
                showToast('Erro de conexão.', true);
                btn.disabled = false;
                btn.textContent = action === 'entrar' ? 'Entrar' : 'Sair';
            });
    }

    carregarComunidades();

})();