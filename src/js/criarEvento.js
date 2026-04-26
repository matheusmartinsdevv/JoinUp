document.addEventListener('DOMContentLoaded', function () {

  // ─── Prévia em tempo real ────────────────────────────────────────────────
  const previewNome  = document.getElementById('previewNome');
  const previewData  = document.getElementById('previewData');
  const previewLocal = document.getElementById('previewLocal');

  document.getElementById('nome').addEventListener('input', function () {
    previewNome.textContent = this.value || 'Nome do evento';
  });
  document.getElementById('data').addEventListener('input', function () {
    if (this.value) {
      const d = new Date(this.value);
      previewData.textContent = d.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
    } else {
      previewData.textContent = 'Data definida no formulário';
    }
  });
  document.getElementById('local').addEventListener('input', function () {
    previewLocal.textContent = this.value || 'Local informado pelo organizador';
  });

  // ─── Máscara de CEP ──────────────────────────────────────────────────────
  document.getElementById('cep').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    this.value = v;
  });

  // ─── Carregar gêneros musicais ───────────────────────────────────────────
  const selectGenero = document.getElementById('genero');
  fetch('../php/get_generos.php')
    .then(r => r.json())
    .then(data => {
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        selectGenero.innerHTML = '<option value="">Selecione o gênero</option>';
        data.data.forEach(g => {
          const opt = document.createElement('option');
          opt.value = g.id;
          opt.textContent = g.nome;
          selectGenero.appendChild(opt);
        });
      } else {
        selectGenero.innerHTML = '<option value="">Erro ao carregar gêneros</option>';
      }
    })
    .catch(() => {
      selectGenero.innerHTML = '<option value="">Erro ao carregar gêneros</option>';
    });

  // ─── Carregar artistas ───────────────────────────────────────────────────
  const artistasGrid = document.getElementById('artistasGrid');
  fetch('../php/get_artistas.php')
    .then(r => r.json())
    .then(data => {
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        artistasGrid.innerHTML = '';
        data.data.forEach(artista => {
          const label = document.createElement('label');
          label.className = 'artista-checkbox';
          label.innerHTML = `
            <input type="checkbox" value="${artista.id}" class="artista-check" />
            ${artista.nome}
          `;
          label.querySelector('input').addEventListener('change', function () {
            label.classList.toggle('checked', this.checked);
          });
          artistasGrid.appendChild(label);
        });
      } else {
        artistasGrid.innerHTML = '<span style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Nenhum artista disponível.</span>';
      }
    })
    .catch(() => {
      artistasGrid.innerHTML = '<span style="color:#ff6b6b;font-size:0.85rem;">Erro ao carregar artistas.</span>';
    });

  // ─── Tipos de ingressos dinâmicos ────────────────────────────────────────
  const ticketsList  = document.getElementById('ticketsList');
  const btnAddTicket = document.getElementById('btnAddTicket');
  let ticketCount = 0;

  function addTicket() {
    ticketCount++;
    const div = document.createElement('div');
    div.className = 'ticket-item';
    div.dataset.ticket = ticketCount;
    div.innerHTML = `
      <label class="field">
        <span>Nome do tipo</span>
        <input type="text" class="ticket-nome" placeholder="Ex: Inteira" required />
      </label>
      <label class="field">
        <span>Preço (R$)</span>
        <input type="number" class="ticket-preco" placeholder="140.00" min="0" step="0.01" required />
      </label>
      <label class="field">
        <span>Quantidade</span>
        <input type="number" class="ticket-qtd" placeholder="500" min="1" required />
      </label>
      <button type="button" class="btn-remove-ticket" title="Remover">✕</button>
    `;
    div.querySelector('.btn-remove-ticket').addEventListener('click', () => div.remove());
    ticketsList.appendChild(div);
  }

  btnAddTicket.addEventListener('click', addTicket);
  addTicket(); // Começa com um tipo já pronto

  // ─── Envio do formulário via fetch (JSON) ────────────────────────────────
  const form       = document.getElementById('formEvento');
  const btnPublicar = document.getElementById('btnPublicar');
  const msgFeedback = document.getElementById('msgFeedback');

  function showMsg(msg, tipo) {
    msgFeedback.textContent = msg;
    msgFeedback.className = tipo; // 'error' ou 'success'
    msgFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Esconder msgs anteriores
    msgFeedback.className = '';
    msgFeedback.textContent = '';
    document.getElementById('erroArtistas').style.display = 'none';
    document.getElementById('erroIngressos').style.display = 'none';

    // Coletar artistas selecionados
    const artistasSelecionados = [...document.querySelectorAll('.artista-check:checked')].map(c => Number(c.value));
    if (artistasSelecionados.length === 0) {
      document.getElementById('erroArtistas').style.display = 'block';
      document.getElementById('erroArtistas').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Coletar tipos de ingressos
    const ticketItems = document.querySelectorAll('.ticket-item');
    const tiposIngressos = [];
    let ingressosValidos = true;
    ticketItems.forEach(item => {
      const nome     = item.querySelector('.ticket-nome').value.trim();
      const preco    = parseFloat(item.querySelector('.ticket-preco').value);
      const qtd      = parseInt(item.querySelector('.ticket-qtd').value);
      if (!nome || isNaN(preco) || preco < 0 || isNaN(qtd) || qtd < 1) {
        ingressosValidos = false;
      } else {
        tiposIngressos.push({ nome, preco, quantidade: qtd });
      }
    });

    if (tiposIngressos.length === 0 || !ingressosValidos) {
      document.getElementById('erroIngressos').style.display = 'block';
      document.getElementById('erroIngressos').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Sanitizar CEP: remover hífen antes de enviar (banco guarda 8 dígitos)
    const cepRaw = document.getElementById('cep').value.replace('-', '');

    // Montar payload JSON
    const payload = {
      nome:     document.getElementById('nome').value.trim(),
      data:     document.getElementById('data').value,
      descricao: document.getElementById('descricao').value.trim(),
      local:    document.getElementById('local').value.trim(),
      cidade:   document.getElementById('cidade').value.trim(),
      estado:   document.getElementById('estado').value,
      cep:      cepRaw,
      genero:   document.getElementById('genero').value,
      artistas: artistasSelecionados,
      tiposIngressos
    };

    // Bloquear botão
    btnPublicar.disabled = true;
    btnPublicar.textContent = 'Publicando...';
    form.classList.add('loading');

    fetch('../php/criar-evento.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          showMsg('✅ Evento criado com sucesso! Redirecionando...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboardOrganizador.html';
          }, 2000);
        } else {
          showMsg('❌ ' + (data.error || 'Erro desconhecido ao criar evento.'), 'error');
        }
      })
      .catch(err => {
        showMsg('❌ Falha na comunicação com o servidor. Tente novamente.', 'error');
        console.error(err);
      })
      .finally(() => {
        btnPublicar.disabled = false;
        btnPublicar.textContent = 'Publicar evento';
        form.classList.remove('loading');
      });
  });
});
