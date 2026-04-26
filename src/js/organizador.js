// =========================================
// ORGANIZADOR.JS - Painel do Organizador
// =========================================

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const burgerBtn = document.getElementById('burgerBtn');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const toast = document.getElementById('toast');
const logoutBtn = document.getElementById('logoutBtn');

console.log('Elementos DOM carregados:', {
  sidebar: !!sidebar,
  sidebarOverlay: !!sidebarOverlay,
  burgerBtn: !!burgerBtn,
  navItems: navItems.length,
  pages: pages.length,
  toast: !!toast,
  logoutBtn: !!logoutBtn
});

// =========================================
// NAVIGATION
// =========================================

function goPage(pageName) {
  console.log('goPage chamado com:', pageName);

  // Hide all pages
  pages.forEach(page => page.classList.remove('active'));

  // Show target page
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
    console.log('Página ativada:', pageName);

    // Load dynamic data when navigating to create page
    if (pageName === 'create') {
      console.log('Carregando dados para página create');
      loadGeneros();
      loadArtistas();
      // Garantir ao menos um tipo de ingresso inicial
      const ticketTypes = document.getElementById('ticketTypes');
      if (ticketTypes && ticketTypes.children.length === 0) {
        addTicketType('Pista');
      }
    }

    // Load events when navigating to events page
    if (pageName === 'events') {
      loadMeusEventos();
    }
  } else {
    console.log('Página não encontrada:', pageName);
  }

  // Update nav active state
  navItems.forEach(item => item.classList.remove('active'));
  const activeNav = document.querySelector(`[data-page="${pageName}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
  }

  // Close sidebar on mobile
  closeSidebar();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================
// SIDEBAR MANAGEMENT
// =========================================

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

// =========================================
// TOAST NOTIFICATIONS
// =========================================

function showToast(message, icon = '✅', duration = 3000) {
  const toastIcon = document.getElementById('toastIcon');
  const toastMsg = document.getElementById('toastMsg');

  toastIcon.textContent = icon;
  toastMsg.textContent = message;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// =========================================
// CHECK AUTHENTICATION
// =========================================

async function checkAuthentication() {
  try {
    const response = await fetch('../php/check_auth.php', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const result = await response.json();
      return result.authenticated;
    }
    return false;
  } catch (error) {
    console.log('Erro ao verificar autenticação:', error);
    return false;
  }
}

// =========================================
// EVENT CREATION
// =========================================

// =========================================
// EVENT CREATION
// =========================================

function showCreateMsg(msg, tipo) {
  const el = document.getElementById('createEventMsg');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  if (tipo === 'error') {
    el.style.background = 'rgba(255,60,60,0.15)';
    el.style.border = '1px solid rgba(255,60,60,0.35)';
    el.style.color = '#ff8080';
  } else {
    el.style.background = 'rgba(74,222,128,0.15)';
    el.style.border = '1px solid rgba(74,222,128,0.35)';
    el.style.color = '#4ade80';
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function submeterEvento() {
  console.log('createEvent chamado');

  // Esconder msg anterior
  const msgEl = document.getElementById('createEventMsg');
  if (msgEl) msgEl.style.display = 'none';

  // ── Coletar campos básicos ──
  const nome     = (document.getElementById('nome')?.value     ?? '').trim();
  const data     = (document.getElementById('data')?.value     ?? '').trim();
  const genero   = (document.getElementById('genero')?.value   ?? '').trim();
  const local    = (document.getElementById('local')?.value    ?? '').trim();
  const cidade   = (document.getElementById('cidade')?.value   ?? '').trim();
  const estado   = (document.getElementById('estado')?.value   ?? '').trim();
  const cepRaw   = (document.getElementById('cep')?.value      ?? '').trim();
  const descricao= (document.getElementById('descricao')?.value?? '').trim();

  const cep = cepRaw.replace(/\D/g, ''); // apenas dígitos

  // ── Validação de campos obrigatórios ──
  if (!nome || !data || !genero || !local || !cidade || !estado || !cep || !descricao) {
    showCreateMsg('⚠️ Preencha todos os campos obrigatórios.', 'error');
    showToast('Preencha todos os campos obrigatórios!', '⚠️');
    return;
  }

  if (cep.length !== 8) {
    showCreateMsg('⚠️ CEP inválido. Use o formato 00000-000.', 'error');
    showToast('CEP inválido!', '⚠️');
    return;
  }

  // ── Artistas selecionados ──
  const artistasChecked = document.querySelectorAll('#artistas-container input[type="checkbox"]:checked');
  const artistas = Array.from(artistasChecked).map(cb => Number(cb.value));

  if (artistas.length === 0) {
    showCreateMsg('⚠️ Selecione ao menos um artista para o line-up.', 'error');
    showToast('Selecione ao menos um artista!', '⚠️');
    return;
  }

  // ── Tipos de ingressos ──
  const tiposIngressos = [];
  let ingressoValido = true;

  document.querySelectorAll('.ticket-type').forEach(ticket => {
    const nomeInput  = ticket.querySelector('.ticket-nome');
    const precoInput = ticket.querySelector('.ticket-preco');
    const qtdInput   = ticket.querySelector('.ticket-qtd');

    if (!nomeInput || !precoInput || !qtdInput) return;

    const nomeTipo   = nomeInput.value.trim();
    const preco      = parseFloat(precoInput.value);
    const quantidade = parseInt(qtdInput.value);

    if (!nomeTipo || isNaN(preco) || preco < 0 || isNaN(quantidade) || quantidade < 1) {
      ingressoValido = false;
    } else {
      tiposIngressos.push({ nome: nomeTipo, preco, quantidade });
    }
  });

  if (tiposIngressos.length === 0 || !ingressoValido) {
    showCreateMsg('⚠️ Preencha corretamente ao menos um tipo de ingresso.', 'error');
    showToast('Configure ao menos um tipo de ingresso!', '⚠️');
    return;
  }

  // ── Montar payload ──
  const dados = { nome, data, genero, local, cidade, estado, cep, descricao, artistas, tiposIngressos };
  console.log('Payload a enviar:', dados);

  // ── Bloquear botão ──
  const btn = document.getElementById('btnCriarEvento');
  if (btn) { btn.disabled = true; btn.textContent = 'Publicando...'; }

  try {
    const response = await fetch('../php/criar-evento.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const result = await response.json();
    console.log('Resposta do servidor:', result);

    if (result.success) {
      showCreateMsg('✅ Evento criado com sucesso!', 'success');
      showToast('Evento criado com sucesso! 🎉', '🎪');
      setTimeout(() => {
        // Limpar form
        document.querySelectorAll('#page-create input:not([type=file]), #page-create textarea, #page-create select').forEach(el => el.value = '');
        document.querySelectorAll('#artistas-container input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.getElementById('ticketTypes').innerHTML = '';
        addTicketType(); // repor um ingresso inicial
        goPage('events');
      }, 1800);
    } else {
      showCreateMsg('❌ ' + (result.error || 'Erro desconhecido ao criar evento.'), 'error');
      showToast('Erro: ' + (result.error || 'Desconhecido'), '⚠️');
    }
  } catch (error) {
    console.error('Erro de fetch:', error);
    showCreateMsg('❌ Falha na comunicação com o servidor.', 'error');
    showToast('Erro de conexão. Tente novamente.', '⚠️');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Criar Evento'; }
  }
}

// =========================================
// LOAD DATA FUNCTIONS
// =========================================

async function loadGeneros() {
  try {
    const response = await fetch('../php/get_generos.php');
    const data = await response.json();
    if (data.success) {
      const select = document.getElementById('genero');
      select.innerHTML = '<option value=""></option>'; // Option vazia sem texto
      data.data.forEach(genero => {
        const option = document.createElement('option');
        option.value = genero.id;
        option.textContent = genero.nome;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar gêneros:', error);
  }
}

async function loadArtistas() {
  try {
    const response = await fetch('../php/get_artistas.php');
    const data = await response.json();
    if (data.success) {
      const container = document.getElementById('artistas-container');
      container.innerHTML = ''; // Limpar loading text

      data.data.forEach(artista => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `artista-${artista.id}`;
        checkbox.name = 'artistas[]';
        checkbox.value = artista.id;

        const label = document.createElement('label');
        label.htmlFor = `artista-${artista.id}`;
        label.textContent = artista.nome;

        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        container.appendChild(checkboxItem);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar artistas:', error);
  }
}

// =========================================
// LOAD MEUS EVENTOS
// =========================================

const ICONES_EVENTO = ['🎆','🎸','🎪','🎵','🎤','🎷','🎹','🎻','🥁','🎺'];

function getIconeEvento(index) {
  return ICONES_EVENTO[index % ICONES_EVENTO.length];
}

async function loadMeusEventos() {
  const container = document.getElementById('eventsContainer');
  if (!container) return;

  // Mostrar loading
  container.innerHTML = `
    <div style="padding:32px;text-align:center;">
      <span style="font-size:2rem;">⏳</span>
      <p style="color:var(--text-muted);margin-top:8px;">Carregando seus eventos...</p>
    </div>`;

  try {
    const response = await fetch('../php/get_meus_eventos.php');
    const data = await response.json();

    if (!data.success) {
      container.innerHTML = `
        <div class="glass" style="padding:32px;text-align:center;">
          <span style="font-size:2rem;">⚠️</span>
          <p style="color:#ff8080;margin-top:8px;">${data.error || 'Erro ao carregar eventos.'}</p>
        </div>`;
      return;
    }

    if (data.data.length === 0) {
      container.innerHTML = `
        <div class="glass" style="padding:48px;text-align:center;">
          <span style="font-size:3rem;">🎪</span>
          <h3 style="margin:16px 0 8px;font-size:1.2rem;">Nenhum evento criado ainda</h3>
          <p style="color:var(--text-muted);margin-bottom:20px;">Crie seu primeiro evento e ele aparecerá aqui.</p>
          <button class="btn btn--primary" onclick="goPage('create')">➕ Criar Evento</button>
        </div>`;
      return;
    }

    // Renderizar cards
    let html = '';
    data.data.forEach((ev, idx) => {
      const passado = ev.passado;
      const statusClass = passado ? 'event-management__status--past' : 'event-management__status--active';
      const statusLabel = passado ? 'Encerrado' : 'Ativo';
      const icone = getIconeEvento(idx);

      const vendidos  = parseInt(ev.vendidos)  || 0;
      const ocupacao  = parseInt(ev.ocupacao)  || 0;
      const receita   = ev.receita_fmt || 'R$ 0,00';

      const acoes = passado
        ? `<button class="btn btn--ghost btn--sm" onclick="showToast('📊 Relatório em breve')">Relatório</button>
           <button class="btn btn--ghost btn--sm" onclick="showToast('💬 Suporte')">Suporte</button>`
        : `<button class="btn btn--ghost btn--sm" onclick="showToast('✏️ Editar em breve')">Editar</button>
           <button class="btn btn--ghost btn--sm" onclick="showToast('📊 Analytics em breve')">Analytics</button>
           <button class="btn btn--primary btn--sm" onclick="showToast('🎟️ Gerenciar ingressos')">Ingressos</button>`;

      html += `
        <div class="event-management-card glass">
          <div class="event-management__header">
            <div class="event-management__icon">${icone}</div>
            <div class="event-management__info">
              <div class="event-management__name">${ev.nome}</div>
              <div class="event-management__meta">${ev.data_formatada} &middot; ${ev.cidade}/${ev.estado} &middot; ${ev.genero || 'Gênero não informado'}</div>
            </div>
            <div class="event-management__status ${statusClass}">${statusLabel}</div>
          </div>
          <div class="event-management__stats">
            <div class="stat-item">
              <span class="stat-value">${vendidos}</span>
              <span class="stat-label">Vendidos</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${receita}</span>
              <span class="stat-label">Receita</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${ocupacao}%</span>
              <span class="stat-label">Ocupação</span>
            </div>
          </div>
          <div class="event-management__actions">
            ${acoes}
          </div>
        </div>`;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error('Erro ao carregar eventos:', err);
    container.innerHTML = `
      <div class="glass" style="padding:32px;text-align:center;">
        <span style="font-size:2rem;">❌</span>
        <p style="color:#ff8080;margin-top:8px;">Falha na comunicação com o servidor.</p>
      </div>`;
  }
}

// =========================================
// TICKET TYPES MANAGEMENT
// =========================================

let _ticketCounter = 0;

function addTicketType(nomeDefault) {
  const ticketTypes = document.getElementById('ticketTypes');
  if (!ticketTypes) return;
  _ticketCounter++;
  const n = _ticketCounter;
  const nomeLabel = nomeDefault || `Tipo ${n}`;
  const ticketType = document.createElement('div');
  ticketType.className = 'ticket-type';
  ticketType.innerHTML = `
    <div class="ticket-type__header">
      <span class="ticket-type__name">
        <input class="ticket-nome" type="text" value="${nomeLabel}" placeholder="Ex: Pista, VIP..." style="background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.2);color:inherit;font-weight:600;font-size:0.95rem;width:140px;padding:0.1rem 0.2rem;" />
      </span>
      <button type="button" class="btn btn--ghost btn--xs" onclick="removeTicketType(this)">✕</button>
    </div>
    <div class="ticket-type__fields">
      <div class="form-group">
        <label>Preço (R$)</label>
        <input type="number" class="ticket-preco" placeholder="120" min="0" step="0.01" />
      </div>
      <div class="form-group">
        <label>Quantidade</label>
        <input type="number" class="ticket-qtd" placeholder="1000" min="1" />
      </div>
    </div>
  `;
  ticketTypes.appendChild(ticketType);
}

function removeTicketType(button) {
  const ticketType = button.closest('.ticket-type');
  ticketType.remove();
}

// =========================================
// IMAGE UPLOAD
// =========================================

function triggerFileUpload() {
  document.getElementById('eventImage').click();
}

// =========================================
// EVENT LISTENERS
// =========================================

// Navigation
navItems.forEach(item => {
  item.addEventListener('click', () => {
    console.log('Botão de navegação clicado');
    const page = item.getAttribute('data-page');
    console.log('Página solicitada:', page);
    goPage(page);
  });
});

console.log('Event listeners de navegação adicionados');

// Sidebar
burgerBtn.addEventListener('click', () => {
  console.log('Botão burger clicado');
  openSidebar();
});
sidebarOverlay.addEventListener('click', () => {
  console.log('Overlay clicado');
  closeSidebar();
});

// Logout
logoutBtn.addEventListener('click', () => {
  console.log('Botão logout clicado');
  showToast('Até logo! 👋', '👋');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1500);
});

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  if (query) {
    showToast(`Buscando por "${query}"...`, '🔍');
  }
});

// File upload
document.getElementById('eventImage').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    showToast(`Imagem "${file.name}" selecionada!`, '📷');
  }
});

// =========================================
// INITIALIZATION
// =========================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded disparado');

  // Verificar autenticação
  const isAuthenticated = await checkAuthentication();
  console.log('Usuário autenticado:', isAuthenticated);

  if (!isAuthenticated) {
    showToast('Você precisa fazer login primeiro!', '⚠️');
    setTimeout(() => {
      window.location.href = 'loginOrganizador.html';
    }, 2000);
    return;
  }

  // Start on dashboard
  goPage('dashboard');

  // Welcome message
  setTimeout(() => {
    showToast('Bem-vindo ao painel do organizador!', '🎪');
  }, 500);
});

// =========================================
// KEYBOARD SHORTCUTS
// =========================================

document.addEventListener('keydown', (e) => {
  // ESC to close sidebar
  if (e.key === 'Escape') {
    closeSidebar();
  }

  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});

// =========================================
// RESPONSIVE HANDLING
// =========================================

window.addEventListener('resize', () => {
  if (window.innerWidth > 700) {
    closeSidebar();
  }
});