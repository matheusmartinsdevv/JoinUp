/* =========================================
   INITIALIZATION & AJAX
========================================= */
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  loadEvents();
  loadMyTickets();
});

const purchaseState = {
  eventId: null,
  ticketTypes: []
};

async function loadUserData() {
  try {
    console.log('Solicitando dados do usuário...');
    const response = await fetch('../php/get_user_data.php');
    const user = await response.json();
    console.log('Resposta recebida:', user);

    if (user.error) {
      console.warn('Usuário não autenticado, redirecionando...');
      window.location.href = 'loginParticipante.html';
      return;
    }

    // --- Atualizar Sidebar ---
    const nome = user.nome || 'Usuário';
    const email = user.email || 'participante@joinup.com';
    const initials = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    if (document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = initials;
    if (document.getElementById('userName')) document.getElementById('userName').textContent = nome;
    if (document.getElementById('userTag')) document.getElementById('userTag').textContent = email;

    // --- Atualizar Página de Perfil ---
    const profileAvatar = document.querySelector('.profile-avatar');
    if (profileAvatar) profileAvatar.textContent = initials;

    const profileName = document.querySelector('.profile-name');
    if (profileName) profileName.textContent = nome;

    // Preencher campos de edição
    if (document.getElementById('editNome')) document.getElementById('editNome').value = nome;
    if (document.getElementById('editEmail')) document.getElementById('editEmail').value = email;

    // Carregar postagens do usuário
    loadMyPosts(nome, initials);

    console.log('Interface atualizada com sucesso!');

  } catch (error) {
    console.error('Falha crítica ao carregar dados:', error);
  }
}

async function loadMyPosts(userName, initials) {
  const container = document.getElementById('minhasPostagensContainer');
  if (!container) return;

  try {
    const response = await fetch('../php/get_minhas_postagens.php');
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      container.innerHTML = result.data.map(post => `
        <div class="post glass">
          <div class="post__header">
            <div class="post__avatar">${initials}</div>
            <div>
              <div class="post__name">${userName}</div>
              <span class="post__event-tag">Postagem JoinUp</span>
            </div>
          </div>
          <p class="post__body">${post.descricao}</p>
          ${post.imagem ? `<img src="${post.imagem}" class="post__img" style="width:100%; border-radius:12px; margin: 10px 0;">` : ''}
          <div class="post__actions">
            <button class="post-action">❤️ ${post.curtidas || 0}</button>
            <button class="post-action">💬 0</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Você ainda não fez nenhuma postagem.</p>`;
    }
  } catch (error) {
    console.error('Erro ao carregar postagens:', error);
    container.innerHTML = `<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Erro ao carregar postagens.</p>`;
  }
}

function setMyTicketsBadge(totalTickets) {
  // Atualiza o badge do menu com o total real de ingressos.
  const badge = document.querySelector('[data-page="my-events"] .nav-badge');
  if (!badge) return;

  const total = Number(totalTickets) || 0;
  if (total > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = String(total);
    return;
  }

  badge.style.display = 'none';
}

async function loadMyTickets() {
  // Busca os ingressos do participante autenticado no backend.
  const container = document.getElementById('myTicketsList');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Carregando seus ingressos...</p>';

  try {
    const response = await fetch('../php/get_meus_ingressos.php');
    const result = await response.json();

    if (response.status === 401) {
      window.location.href = 'loginParticipante.html';
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao carregar ingressos.');
    }

    renderMyTickets(Array.isArray(result.data) ? result.data : []);
  } catch (error) {
    console.error('Erro ao carregar meus ingressos:', error);
    setMyTicketsBadge(0);
    container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Erro ao carregar seus ingressos.</p>';
  }
}

function renderMyTickets(tickets) {
  // Renderiza os cards de ingressos em "Meus Ingressos".
  const container = document.getElementById('myTicketsList');
  if (!container) return;

  if (!tickets.length) {
    setMyTicketsBadge(0);
    container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Você ainda não comprou ingressos.</p>';
    return;
  }

  const totalTickets = tickets.reduce((acc, ticket) => acc + (Number(ticket.quantidade) || 0), 0);
  setMyTicketsBadge(totalTickets);

  container.innerHTML = tickets.map(ticket => {
    const quantidade = Math.max(1, Number(ticket.quantidade) || 1);
    const quantidadeLabel = quantidade > 1 ? ` · ${quantidade} ingressos` : '';
    const statusClass = ticket.status_class === 'ticket__status--active' ? 'ticket__status--active' : 'ticket__status--past';
    const statusLabel = escapeHtml(ticket.status_label || 'Encerrado');
    const eventoNome = escapeHtml(ticket.evento_nome || 'Evento');
    const nomeTipo = escapeHtml(ticket.nome_tipo || 'Ingresso');
    const cidade = escapeHtml(ticket.cidade || '');
    const estado = escapeHtml(ticket.estado || '');
    const data = escapeHtml(ticket.evento_data_formatada || '');
    const local = cidade && estado ? `${cidade}, ${estado}` : 'Local a confirmar';
    const isAtivo = ticket.status === 'ativo' && !ticket.passado;

    const actions = isAtivo
      // Evento ativo mantém ações de QR, revenda e comunidade.
      ? `<button class="btn btn--ghost btn--sm" onclick="showToast('🔒 Abrindo QR Code seguro...')">Ver QR Code</button>
         <button class="btn btn--ghost btn--sm" onclick="openSellModal()">Revender</button>
         <button class="btn btn--primary btn--sm" onclick="goPage('groups')">Comunidade</button>`
      // Evento encerrado mostra apenas acesso às memórias/comunidade.
      : `<button class="btn btn--ghost btn--sm" onclick="goPage('groups')">Ver memórias</button>`;

    return `
      <div class="ticket glass">
        <div class="ticket__icon">🎟️</div>
        <div class="ticket__info">
          <div class="ticket__name">${eventoNome}</div>
          <div class="ticket__meta">📅 ${data} · 📍 ${local} · ${nomeTipo}${quantidadeLabel}</div>
        </div>
        <span class="ticket__status ${statusClass}">${statusLabel}</span>
        <div class="ticket__actions">
          ${actions}
        </div>
      </div>
    `;
  }).join('');
}

async function loadEvents() {
  const grid = document.getElementById('eventsGrid');
  try {
    const response = await fetch('../php/get_explorar_eventos.php');
    const eventos = await response.json();

    if (!eventos || eventos.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Nenhum evento encontrado no momento. 😢</p>';
      return;
    }

    const cores = {
      'Rock': 'linear-gradient(135deg,#1e1b4b,#4338ca)',
      'Pop': 'linear-gradient(135deg,#be185d,#db2777)',
      'Sertanejo': 'linear-gradient(135deg,#166534,#15803d)',
      'Eletrônica': 'linear-gradient(135deg,#4c1d95,#6d28d9)',
      'Funk': 'linear-gradient(135deg,#991b1b,#b91c1c)',
      'Pagode': 'linear-gradient(135deg,#854d0e,#a16207)'
    };

    grid.innerHTML = eventos.map(evento => {
      const eventId = Number(evento.id_evento) || 0;
      const bgCard = cores[evento.genero_nome] || 'linear-gradient(135deg,#312e81,#4f46e5)';
      const participantes = (evento.total_participantes || 0) > 0 ? `+${evento.total_participantes}` : '0';
      const artistasTxt = (evento.artistas && evento.artistas.length > 0) ? evento.artistas.join(', ') : 'Atrações a confirmar';

      const imagemUrl = evento.imagem ? `../uploads/${evento.imagem}` : null;
      const imgStyle = imagemUrl ? `background-image:url('${imagemUrl}'); background-size:cover; background-position:center;` : `background:${bgCard}`;
      const iconOrImg = imagemUrl ? '' : '✨';
      const imagemParam = imagemUrl ? `'${imagemUrl}'` : 'null';

      // Sanitização segura (evita erro se algum campo vier null)
      const cleanName = (evento.evento_nome || '').replace(/'/g, "\\'");
      const cleanDesc = (evento.descricao || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
      const cleanLoc = (evento.localizacao || '').replace(/'/g, "\\'");
      const cleanCity = (evento.cidade || '').replace(/'/g, "\\'");
      const cleanUF = (evento.estado || '').replace(/'/g, "\\'");
      const cleanArtistas = artistasTxt.replace(/'/g, "\\'");

      return `
        <div class="event-card" onclick="showEventModal(${eventId},'${cleanName}','${evento.data_formatada}','${evento.preco_formatado}','🎵','${evento.total_participantes || 0}','${cleanDesc}','${cleanLoc}','${cleanArtistas}','${cleanCity}','${cleanUF}', ${imagemParam})">
          <div class="event-card__img" style="${imgStyle}">${iconOrImg}
            <div class="event-card__img-overlay"></div>
            <span class="event-card__tag">📌 ${evento.genero_nome || 'Evento'}</span>
            <span class="event-card__going-count">${participantes} vão</span>
          </div>
          <div class="event-card__body">
            <div class="event-card__title">${evento.evento_nome || 'Sem nome'}</div>
            <div class="event-card__meta">📅 ${evento.data_formatada || ''}</div>
            <div class="event-card__footer">
              <span class="event-card__price">A partir de <strong>${evento.preco_formatado || 'Grátis'}</strong></span>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Erro ao carregar eventos. Tente novamente mais tarde.</p>';
  }
}

/* =========================================
   NAVIGATION
========================================= */
function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id)?.classList.add('active');
  document.querySelector(`[data-page="${id}"]`)?.classList.add('active');
  // Fecha sidebar no mobile
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
}

document.querySelectorAll('[data-page]').forEach(btn => {
  btn.addEventListener('click', function () { goPage(this.dataset.page); });
});

// Burger (mobile)
document.getElementById('burgerBtn').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('open');
  document.getElementById('sidebarOverlay').style.display =
    sb.classList.contains('open') ? 'block' : 'none';
});

document.getElementById('sidebarOverlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Sair do JoinUp?')) window.location.href = 'index.html';
});

/* =========================================
   SEARCH
========================================= */
const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');

searchInput.addEventListener('focus', () => searchDropdown.classList.add('open'));
searchInput.addEventListener('blur', () => setTimeout(() => searchDropdown.classList.remove('open'), 200));
searchInput.addEventListener('input', function () {
  searchDropdown.classList.toggle('open', this.value.length > 0 || document.activeElement === this);
});

/* =========================================
   POST ACTIONS
========================================= */
function likePost(btn) {
  btn.classList.toggle('liked');
  const parts = btn.textContent.split(' ');
  const emoji = parts[0];
  const n = parseInt(parts[1]);
  btn.textContent = emoji + ' ' + (btn.classList.contains('liked') ? n + 1 : n - 1);
}

function openComments() { openModal('commentsModal'); }

function publishPost() {
  const input = document.getElementById('composerInput');
  const text = input.value.trim();
  if (!text) return;

  const post = document.createElement('div');
  post.className = 'post glass';
  post.style.animation = 'fadeUp 0.3s ease';
  post.innerHTML = `
    <div class="post__header">
      <div class="post__avatar">JC</div>
      <div>
        <div class="post__name">João Carlos</div>
        <span class="post__event-tag">🎟 Festival Neon SP</span>
      </div>
      <span class="post__time">agora</span>
    </div>
    <p class="post__body">${text.replace(/</g, '&lt;')}</p>
    <div class="post__actions">
      <button class="post-action" onclick="likePost(this)">❤️ 0</button>
      <button class="post-action" onclick="openComments()">💬 0</button>
      <button class="post-action">↗ Compartilhar</button>
    </div>`;

  document.getElementById('feedPosts').prepend(post);
  input.value = '';
  input.style.minHeight = '48px';
  showToast('✅ Post publicado!');
}

/* =========================================
   EVENTS FILTER
========================================= */
function filterEvents(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

const ticketHelpForm = document.getElementById('ticketHelpForm');
if (ticketHelpForm) {
  ticketHelpForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const title = document.getElementById('ticketTitle').value.trim();
    const description = document.getElementById('ticketDescription').value.trim();
    const submitBtn = document.getElementById('ticketHelpSubmit');

    if (!title || !description) {
      showToast('Preencha título e descrição antes de enviar.', '⚠️');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      const response = await fetch('../php/create_ticket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: title, descricao: description })
      });

      const result = await response.json();
      if (result.success) {
        showToast('✅ Ticket enviado com sucesso!');
        ticketHelpForm.reset();
      } else {
        showToast(result.error || 'Erro ao enviar ticket.', '⚠️');
      }
    } catch (error) {
      console.error('Erro ao enviar ticket:', error);
      showToast('Erro de conexão ao enviar ticket.', '⚠️');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar ticket';
    }
  });
}

/* =========================================
   MODALS
========================================= */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showEventModal(eventId, name, date, price, icon, going, description, location, attractions, city, uf, imagemUrl) {
  purchaseState.eventId = Number(eventId) || null;
  purchaseState.ticketTypes = [];

  const bannerContent = imagemUrl 
    ? `<img src="${imagemUrl}" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0; z-index:0;" />
       <div class="event-modal__title" style="position:relative; z-index:1; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${name}</div>`
    : `<div class="event-modal__icon">${icon}</div>
       <div class="event-modal__title">${name}</div>`;

  document.getElementById('eventModalContent').innerHTML = `
    <!-- Banner do evento -->
    <div class="event-modal__banner" style="position:relative; overflow:hidden;">
      ${bannerContent}
    </div>

    <!-- Informações principais -->
    <div class="event-modal__info-grid">
      <div class="event-modal__info-item">
        <span class="event-modal__label">📅 Data</span>
        <span class="event-modal__value">${date}</span>
      </div>
      <div class="event-modal__info-item">
        <span class="event-modal__label">💵 Valor</span>
        <span class="event-modal__value">${price}</span>
      </div>
      <div class="event-modal__info-item">
        <span class="event-modal__label">👥 Participantes</span>
        <span class="event-modal__value">+${going}</span>
      </div>
    </div>

    <!-- Seção de detalhes -->
    <div class="event-modal__section">
      <h3 class="event-modal__section-title">📍 Local</h3>
      <p class="event-modal__section-content" id="eventLocation">${location} • ${city}, ${uf}</p>
    </div>

    <div class="event-modal__section">
      <h3 class="event-modal__section-title">🎤 Artistas/Atrações</h3>
      <p class="event-modal__section-content" id="eventAttractions">${attractions}</p>
    </div>

    <div class="event-modal__section">
      <h3 class="event-modal__section-title">ℹ️ Sobre o Evento</h3>
      <p class="event-modal__section-content" id="eventDescription">${description}</p>
    </div>

    <div class="event-modal__section">
      <h3 class="event-modal__section-title">🎟 Ingressos</h3>
      <div class="event-modal__section-content" id="ticketPurchaseArea">
        Carregando ingressos...
      </div>
    </div>

    <!-- CTA de compra e comunidade -->
    <div class="event-modal__cta-section">
      <div class="event-modal__community-banner">
        <span>🎟 Compre para participar da comunidade!</span>
      </div>
      <button id="buyTicketBtn" class="btn btn--primary btn--large" onclick="buyTicket()" disabled>Carregando ingressos...</button>
      <p class="event-modal__footer-text">✅ Transação verificada · 🔒 Pagamento protegido · 📱 Ingresso no seu celular</p>
    </div>
  `;
  openModal('eventModal');

  if (!purchaseState.eventId) {
    const area = document.getElementById('ticketPurchaseArea');
    const btn = document.getElementById('buyTicketBtn');
    if (area) area.textContent = 'Ingresso indisponível para este evento';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Ingresso indisponível para este evento';
    }
    return;
  }

  loadTicketTypesForEvent(purchaseState.eventId);
}

async function loadTicketTypesForEvent(eventId) {
  const area = document.getElementById('ticketPurchaseArea');
  const btn = document.getElementById('buyTicketBtn');
  if (!area || !btn) return;

  area.textContent = 'Carregando ingressos...';
  btn.disabled = true;
  btn.textContent = 'Carregando ingressos...';

  try {
    const response = await fetch(`../php/get_tipos_ingressos_evento.php?id_evento=${encodeURIComponent(eventId)}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao carregar ingressos.');
    }

    purchaseState.ticketTypes = Array.isArray(result.data) ? result.data : [];
    renderPurchaseArea();
  } catch (error) {
    console.error('Erro ao carregar tipos de ingresso:', error);
    area.textContent = 'Ingresso indisponível para este evento';
    btn.disabled = true;
    btn.textContent = 'Ingresso indisponível para este evento';
  }
}

function renderPurchaseArea() {
  const area = document.getElementById('ticketPurchaseArea');
  const btn = document.getElementById('buyTicketBtn');
  if (!area || !btn) return;

  const tiposDisponiveis = purchaseState.ticketTypes.filter(tipo => Number(tipo.quantidade_disponivel) > 0);
  if (tiposDisponiveis.length === 0) {
    area.textContent = 'Ingresso indisponível para este evento';
    btn.disabled = true;
    btn.textContent = 'Ingresso indisponível para este evento';
    return;
  }

  const options = purchaseState.ticketTypes.map(tipo => {
    const quantidade = Number(tipo.quantidade_disponivel) || 0;
    const esgotado = quantidade <= 0;
    const valorFmt = tipo.valor_formatado || `R$ ${Number(tipo.valor || 0).toFixed(2).replace('.', ',')}`;
    const label = `${escapeHtml(tipo.nome_tipo)} - ${escapeHtml(valorFmt)} (${esgotado ? 'Esgotado' : `${quantidade} disponiveis`})`;
    return `<option value="${Number(tipo.id_tipo_ingresso)}" data-qtd="${quantidade}" data-valor="${Number(tipo.valor || 0)}" ${esgotado ? 'disabled' : ''}>${label}</option>`;
  }).join('');

  area.innerHTML = `
    <div style="display:grid; gap:10px;">
      <label style="display:grid; gap:6px;">
        <span>Tipo de ingresso</span>
        <select id="ticketTypeSelect" class="results-field">${options}</select>
      </label>
      <label style="display:grid; gap:6px;">
        <span>Quantidade</span>
        <input id="ticketQuantityInput" class="results-field" type="number" min="1" step="1" value="1">
      </label>
      <small id="ticketStockHint" style="color:var(--text-muted);"></small>
    </div>
  `;

  const select = document.getElementById('ticketTypeSelect');
  const firstEnabled = Array.from(select.options).find(opt => !opt.disabled);
  if (firstEnabled) {
    select.value = firstEnabled.value;
  }

  select.addEventListener('change', syncPurchaseState);
  document.getElementById('ticketQuantityInput').addEventListener('input', syncPurchaseState);
  syncPurchaseState();
}

function syncPurchaseState() {
  const select = document.getElementById('ticketTypeSelect');
  const quantityInput = document.getElementById('ticketQuantityInput');
  const stockHint = document.getElementById('ticketStockHint');
  const btn = document.getElementById('buyTicketBtn');
  if (!select || !quantityInput || !stockHint || !btn) return;

  const selectedOption = select.options[select.selectedIndex];
  if (!selectedOption || selectedOption.disabled) {
    btn.disabled = true;
    btn.textContent = 'Ingresso indisponível para este evento';
    stockHint.textContent = 'Ingresso indisponível para este evento';
    return;
  }

  const quantidadeDisponivel = Number(selectedOption.dataset.qtd || 0);
  const valor = Number(selectedOption.dataset.valor || 0);
  const quantidadeAtual = Math.max(1, Number(quantityInput.value) || 1);
  const quantidadeAjustada = Math.min(quantidadeAtual, quantidadeDisponivel);

  quantityInput.max = String(quantidadeDisponivel);
  quantityInput.value = String(quantidadeAjustada);

  const total = valor * quantidadeAjustada;
  btn.disabled = quantidadeDisponivel <= 0;
  btn.textContent = `Comprar ingresso — R$ ${total.toFixed(2).replace('.', ',')}`;
  stockHint.textContent = `${quantidadeDisponivel} disponiveis`;
}

async function buyTicket() {
  const select = document.getElementById('ticketTypeSelect');
  const quantityInput = document.getElementById('ticketQuantityInput');
  const btn = document.getElementById('buyTicketBtn');

  if (!select || !quantityInput || !btn || !purchaseState.eventId) {
    showToast('Ingresso indisponível para este evento', '⚠️');
    return;
  }

  const idTipo = Number(select.value);
  const quantidade = Math.max(1, Number(quantityInput.value) || 1);
  if (!idTipo || !quantidade) {
    showToast('Ingresso indisponível para este evento', '⚠️');
    return;
  }

  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Processando compra...';

  try {
    const response = await fetch('../php/comprar_ingresso.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_evento: purchaseState.eventId,
        id_tipo_ingresso: idTipo,
        quantidade
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showToast('Ingresso comprado com sucesso', '✅');
      closeModal('eventModal');
      loadEvents();
      loadMyTickets();
      return;
    }

    if (result.message === 'Ingresso indisponível para este evento') {
      showToast('Ingresso indisponível para este evento', '⚠️');
      await loadTicketTypesForEvent(purchaseState.eventId);
      return;
    }

    showToast(result.error || result.message || 'Falha ao concluir compra.', '⚠️');
  } catch (error) {
    console.error('Erro ao comprar ingresso:', error);
    showToast('Erro ao processar compra.', '⚠️');
  } finally {
    if (btn.textContent === 'Processando compra...') {
      btn.textContent = textoOriginal;
    }
    if (document.getElementById('ticketTypeSelect')) {
      syncPurchaseState();
    } else {
      btn.disabled = false;
    }
  }
}

function openSellModal() { openModal('sellModal'); }

/* =========================================
   PROFILE ACTIONS
   ========================================= */
async function saveProfile() {
  const btn = document.getElementById('btnSalvarPerfil');
  const nome = document.getElementById('editNome').value.trim();
  const email = document.getElementById('editEmail').value.trim();

  if (!nome || !email) {
    showToast('❌ Nome e E-mail são obrigatórios!', '⚠️');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const response = await fetch('../php/update_profile_participante.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email })
    });

    const result = await response.json();

    if (result.success) {
      showToast('✅ Perfil atualizado com sucesso!', '✨');
      // Recarregar dados para atualizar UI
      loadUserData();
    } else {
      showToast('❌ Erro: ' + result.error, '⚠️');
    }
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    showToast('❌ Erro de conexão com o servidor.', '⚠️');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar alterações';
  }
}

// Fechar modal clicando no backdrop
document.querySelectorAll('.modal-backdrop').forEach(bd => {
  bd.addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('open');
  });
});

/* =========================================
   TOAST
========================================= */
let toastTimer;
function showToast(msg, icon = '✅') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  if (toastIcon) toastIcon.textContent = icon;
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
