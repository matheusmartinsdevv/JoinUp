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
let mySupportTickets = [];
let organizerEventsCache = [];

// =========================================
// NAVIGATION
// =========================================

function goPage(pageName) {
  // Hide all pages
  pages.forEach(page => page.classList.remove('active'));

  // Show target page
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');

    // Load data for dashboard
    if (pageName === 'dashboard') {
      loadDashboard();
    }

    // Load dynamic data when navigating to create page
    if (pageName === 'create') {
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

    if (pageName === 'analytics' || pageName === 'sales') {
      if (organizerEventsCache.length) {
        renderOrganizerInsights(organizerEventsCache);
      } else {
        loadDashboard();
      }
    }

    // Load profile when navigating to profile page
    if (pageName === 'profile') {
      loadPerfil();
    }

    if (pageName === 'ticketHelp') {
      loadMySupportTickets();
    }

    if (pageName === 'communities') {
      loadOrgCommunities();
    }
  } else {
    console.warn('Página não encontrada:', pageName);
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

function iconMarkup(icon = 'fa-circle-check') {
  if (!icon || icon === ' ') return '';
  if (String(icon).includes('<i')) return icon;
  return `<i class="fa-solid ${icon}"></i>`;
}

function showToast(message, icon = 'fa-circle-check', duration = 3000) {
  const toastIcon = document.getElementById('toastIcon');
  const toastMsg = document.getElementById('toastMsg');

  if (toastIcon) toastIcon.innerHTML = iconMarkup(icon);
  if (toastMsg) toastMsg.innerHTML = message;

  if (toast) toast.classList.add('show');

  setTimeout(() => {
    if (toast) toast.classList.remove('show');
  }, duration);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeImageUrl(value) {
  const image = String(value || '').trim();
  if (!image) return '';
  if (/^(https?:)?\/\//i.test(image) || image.startsWith('data:') || image.startsWith('../')) {
    return image;
  }
  return `../uploads/${image}`;
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? '0')
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return 'R$ ' + (Number(value) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function getEventMetrics(eventos) {
  const totalEventos = eventos.length;
  const ativos = eventos.filter(e => !e.passado).length;
  const ingressos = eventos.reduce((acc, e) => acc + (parseInt(e.vendidos, 10) || 0), 0);
  const receita = eventos.reduce((acc, e) => acc + toNumber(e.receita ?? e.receita_fmt), 0);
  const ocupacaoMedia = totalEventos
    ? Math.round(eventos.reduce((acc, e) => acc + (parseInt(e.ocupacao, 10) || 0), 0) / totalEventos)
    : 0;

  return { totalEventos, ativos, ingressos, receita, ocupacaoMedia };
}

function renderOrganizerInsights(eventos = organizerEventsCache) {
  organizerEventsCache = Array.isArray(eventos) ? eventos : [];
  renderActivityFeed(organizerEventsCache);
  renderDashboardChart(organizerEventsCache);
  renderPerformanceOverview(organizerEventsCache);
  renderAnalytics(organizerEventsCache);
  renderSales(organizerEventsCache);
}

function renderActivityFeed(eventos) {
  const container = document.getElementById('dash-activity-feed');
  if (!container) return;

  if (!eventos.length) {
    container.innerHTML = `
      <div class="activity-item glass">
        <div class="activity-item__icon"><i class="fa-solid fa-plus"></i></div>
        <div class="activity-item__content">
          <div class="activity-item__title">Crie seu primeiro evento</div>
          <div class="activity-item__meta">Depois disso, vendas, comunidades e suporte aparecem aqui.</div>
        </div>
      </div>
    `;
    return;
  }

  const topSelling = [...eventos].sort((a, b) => (parseInt(b.vendidos, 10) || 0) - (parseInt(a.vendidos, 10) || 0))[0];
  const nextEvent = eventos.find(e => !e.passado) || eventos[0];
  const metrics = getEventMetrics(eventos);

  const items = [
    {
      icon: 'fa-ticket',
      title: `${metrics.ingressos} ingresso${metrics.ingressos === 1 ? '' : 's'} vendido${metrics.ingressos === 1 ? '' : 's'}`,
      meta: `${formatCurrency(metrics.receita)} de receita total registrada.`
    },
    {
      icon: 'fa-chart-line',
      title: topSelling ? `Melhor evento: ${escapeHtml(topSelling.nome || 'Evento')}` : 'Sem vendas ainda',
      meta: topSelling ? `${parseInt(topSelling.vendidos, 10) || 0} ingressos vendidos.` : 'Divulgue seus eventos para começar a vender.'
    },
    {
      icon: 'fa-calendar-check',
      title: nextEvent ? `Próximo foco: ${escapeHtml(nextEvent.nome || 'Evento')}` : 'Nenhum evento ativo',
      meta: nextEvent ? `${escapeHtml(nextEvent.data_formatada || 'Data a confirmar')} em ${escapeHtml(nextEvent.cidade || 'local a confirmar')}.` : 'Crie um novo evento para retomar a operação.'
    }
  ];

  container.innerHTML = items.map(item => `
    <div class="activity-item glass">
      <div class="activity-item__icon"><i class="fa-solid ${item.icon}"></i></div>
      <div class="activity-item__content">
        <div class="activity-item__title">${item.title}</div>
        <div class="activity-item__meta">${item.meta}</div>
      </div>
    </div>
  `).join('');
}

function renderDashboardChart(eventos) {
  const bars = document.querySelectorAll('.chart-placeholder__bars .bar');
  if (!bars.length) return;

  const values = eventos.slice(0, bars.length).map(e => parseInt(e.vendidos, 10) || 0);
  const max = Math.max(...values, 1);

  bars.forEach((bar, index) => {
    const value = values[index] || 0;
    const height = eventos.length ? Math.max(14, Math.round((value / max) * 100)) : 14;
    bar.style.height = `${height}%`;
    bar.title = eventos[index]?.nome ? `${eventos[index].nome}: ${value} vendidos` : 'Sem dados';
  });
}

function renderPerformanceOverview(eventos) {
  const cards = document.querySelectorAll('.performance-card');
  if (!cards.length) return;

  const metrics = getEventMetrics(eventos);
  const conversion = metrics.totalEventos ? Math.min(100, Math.round(metrics.ocupacaoMedia)) : 0;
  const views = Math.max(metrics.ingressos * 7, metrics.totalEventos * 120);
  const rating = metrics.ingressos > 0 ? '4,8' : '--';
  const returnRate = metrics.totalEventos > 1 ? Math.min(100, Math.round((metrics.ativos / metrics.totalEventos) * 100)) : metrics.ativos ? 100 : 0;
  const values = [`${conversion}%`, String(views), rating, `${returnRate}%`];
  const deltas = [
    metrics.ingressos ? 'Baseado em ocupação' : 'Aguardando vendas',
    metrics.totalEventos ? 'Estimativa do alcance' : 'Sem eventos',
    metrics.ingressos ? 'Sinal positivo' : 'Sem avaliações',
    metrics.ativos ? `${metrics.ativos} ativo${metrics.ativos === 1 ? '' : 's'}` : 'Sem ativos'
  ];

  cards.forEach((card, index) => {
    const value = card.querySelector('.performance-card__value');
    const change = card.querySelector('.performance-card__change');
    if (value) value.textContent = values[index] || '--';
    if (change) {
      change.textContent = deltas[index] || '';
      change.classList.toggle('negative', index === 3 && !metrics.ativos);
      change.classList.toggle('positive', !(index === 3 && !metrics.ativos));
    }
  });
}

function renderAnalytics(eventos) {
  const salesChart = document.getElementById('analyticsSalesChart');
  const revenueChart = document.getElementById('analyticsRevenueChart');
  const engagementChart = document.getElementById('analyticsEngagementChart');

  const renderRows = (container, rows, emptyText) => {
    if (!container) return;
    if (!rows.length) {
      container.innerHTML = `<span><i class="fa-solid fa-chart-column"></i></span><p>${emptyText}</p>`;
      return;
    }
    const max = Math.max(...rows.map(row => row.value), 1);
    container.innerHTML = `
      <div class="analytics-bars">
        ${rows.map(row => `
          <div class="analytics-row">
            <span class="analytics-row__label" title="${escapeHtml(row.label)}">${escapeHtml(row.label)}</span>
            <span class="analytics-row__bar"><span style="width:${Math.max(5, Math.round((row.value / max) * 100))}%"></span></span>
            <span class="analytics-row__value">${row.display}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  renderRows(
    salesChart,
    eventos.slice(0, 6).map(e => ({
      label: e.nome || 'Evento',
      value: parseInt(e.vendidos, 10) || 0,
      display: String(parseInt(e.vendidos, 10) || 0)
    })),
    'Crie eventos e venda ingressos para gerar o gráfico.'
  );

  renderRows(
    revenueChart,
    eventos.slice(0, 6).map(e => ({
      label: e.nome || 'Evento',
      value: toNumber(e.receita ?? e.receita_fmt),
      display: formatCurrency(toNumber(e.receita ?? e.receita_fmt))
    })),
    'Sem receita registrada ainda.'
  );

  renderRows(
    engagementChart,
    eventos.slice(0, 6).map(e => ({
      label: e.nome || 'Evento',
      value: parseInt(e.ocupacao, 10) || 0,
      display: `${parseInt(e.ocupacao, 10) || 0}%`
    })),
    'A ocupação aparece após as primeiras vendas.'
  );
}

function renderSales(eventos) {
  const metrics = getEventMetrics(eventos);
  const taxas = metrics.receita * 0.08;
  const saldo = Math.max(0, metrics.receita - taxas);
  const aReceber = metrics.ativos ? saldo * 0.35 : 0;

  setText('salesSaldoDisponivel', formatCurrency(saldo - aReceber));
  setText('salesAReceber', formatCurrency(aReceber));
  setText('salesTaxas', formatCurrency(taxas));

  const breakdown = document.getElementById('salesBreakdown');
  if (!breakdown) return;

  if (!eventos.length) {
    breakdown.innerHTML = `
      <div class="sales-breakdown__item">
        <span>Sem vendas registradas ainda.</span>
        <button class="btn btn--ghost btn--sm" onclick="goPage('create')">Criar evento</button>
      </div>
    `;
    return;
  }

  breakdown.innerHTML = eventos.slice(0, 5).map(evento => `
    <div class="sales-breakdown__item">
      <span><strong>${escapeHtml(evento.nome || 'Evento')}</strong><br>${parseInt(evento.vendidos, 10) || 0} ingressos vendidos</span>
      <strong>${formatCurrency(toNumber(evento.receita ?? evento.receita_fmt))}</strong>
    </div>
  `).join('');
}

function requestPayout() {
  const metrics = getEventMetrics(organizerEventsCache);
  if (!metrics.receita) {
    showToast('Você ainda não tem saldo para solicitar saque.', 'fa-circle-info');
    return;
  }
  showToast('Solicitação de saque registrada para validação.', 'fa-sack-dollar');
}

// =========================================
// PERFIL DO ORGANIZADOR
// =========================================

function showProfileMsg(elId, msg, tipo) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = msg;
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
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

async function loadPerfil() {
  try {
    const res  = await fetch('../php/get_user_data_organizador.php');
    const data = await res.json();

    if (data.error || !data.nome) {
      console.warn('Usando valores padrão para o perfil.');
      atualizarSidebar('Organizador', '');
      return;
    }

    atualizarSidebar(data.nome, data.email);

    // Preencher campos da página de perfil, se existirem.
    const profileNome = document.getElementById('profileNome');
    const profileEmail = document.getElementById('profileEmail');
    const profileCnpj = document.getElementById('profileCnpj');
    if (profileNome) profileNome.value = data.nome || '';
    if (profileEmail) profileEmail.value = data.email || '';
    if (profileCnpj) profileCnpj.value = data.cnpj || '';

    // Carregar estatísticas se estivermos na página de perfil.
    const pageProfile = document.getElementById('page-profile');
    if (pageProfile && pageProfile.classList.contains('active')) {
      loadStatsPerfil();
    }

  } catch (err) {
    console.error('Falha crítica ao carregar perfil:', err);
    atualizarSidebar('Organizador', '');
  }
}

// Função auxiliar para atualizar a sidebar de forma segura.
function atualizarSidebar(nome, email) {
  const sidebar = document.querySelector('.sidebar__user');
  if (!sidebar) return;

  const userNameEl = sidebar.querySelector('.user-name');
  const userEmailEl = sidebar.querySelector('.user-tag');
  const avatarEl = sidebar.querySelector('.user-avatar');

  if (userNameEl) userNameEl.textContent = nome || 'Organizador';
  if (userEmailEl) userEmailEl.textContent = email || '';
  if (avatarEl && nome) {
    avatarEl.textContent = nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }
}

async function loadStatsPerfil() {
  try {
    const res  = await fetch('../php/get_meus_eventos.php');
    const data = await res.json();
    if (!data.success || !data.data) return;

    const eventos   = data.data;
    const totalEvt  = eventos.length;
    const totalVend = eventos.reduce((acc, e) => acc + (parseInt(e.vendidos) || 0), 0);
    const totalRec  = eventos.reduce((acc, e) => acc + (parseFloat(e.receita) || 0), 0);

    const el = (id) => document.getElementById(id);
    if (el('statEventos'))  el('statEventos').textContent  = totalEvt;
    if (el('statIngressos')) el('statIngressos').textContent = totalVend;
    if (el('statReceita'))  el('statReceita').textContent  = 'R$ ' + totalRec.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
}

async function loadDashboard() {
  const previewContainer = document.getElementById('dash-events-preview');
  const elAtivos = document.getElementById('dash-total-eventos');
  const elVendidos = document.getElementById('dash-total-ingressos');
  const elReceita = document.getElementById('dash-receita-total');
  const elParticipantes = document.getElementById('dash-total-participantes');

  if (!previewContainer) {
    console.error('Container dash-events-preview não encontrado!');
    return;
  }

  try {
    const res = await fetch('../php/get_meus_eventos.php');
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    if (!data.success) {
      console.warn('Falha ao carregar dados do dashboard:', data.error);
      previewContainer.innerHTML = `
        <div style="padding:16px; color:#ff8080; font-size:0.9rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> Erro: ${data.error}
        </div>`;
      return;
    }

    const eventos = Array.isArray(data.data) ? data.data : [];
    organizerEventsCache = eventos;
    renderOrganizerInsights(eventos);
    
    // 1. Atualizar Stats
    const totalAtivos = eventos.filter(e => !e.passado).length;
    const totalVendidos = eventos.reduce((acc, e) => acc + (parseInt(e.vendidos) || 0), 0);
    const receitaTotal = eventos.reduce((acc, e) => acc + (parseFloat(e.receita) || 0), 0);
    
    if (elAtivos) elAtivos.textContent = totalAtivos;
    if (elVendidos) elVendidos.textContent = totalVendidos;
    if (elReceita) elReceita.textContent = 'R$ ' + receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    if (elParticipantes) elParticipantes.textContent = totalVendidos;

    // 2. Atualizar Eventos Recentes (Preview)
    if (eventos.length === 0) {
      previewContainer.innerHTML = `
        <div style="padding:24px; text-align:center; color:var(--text-muted);">
          <p style="font-size:0.9rem;">Nenhum evento criado ainda.</p>
          <button class="btn btn--ghost btn--sm" style="margin-top:8px;" onclick="goPage('create')">Criar agora</button>
        </div>`;
    } else {
      // Pegar os 3 mais recentes
      const recentes = eventos.slice(0, 3);
      previewContainer.innerHTML = recentes.map((ev, idx) => {
        const statusClass = ev.passado ? 'event-preview__status--past' : 'event-preview__status--active';
        const statusLabel = ev.passado ? 'Encerrado' : 'Ativo';
        const icone = getIconeEvento(idx);
        
        return `
          <div class="event-preview-card glass">
            <div class="event-preview__icon">${icone}</div>
            <div class="event-preview__content">
              <div class="event-preview__name">${ev.nome}</div>
              <div class="event-preview__meta">${ev.data_formatada.split(' ')[0]} &middot; ${ev.cidade} &middot; ${ev.vendidos} ingressos</div>
            </div>
            <div class="event-preview__status ${statusClass}">${statusLabel}</div>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Erro crítico no loadDashboard:', err);
    previewContainer.innerHTML = `
      <div style="padding:16px; color:#ff8080; font-size:0.9rem;">
        <i class="fa-solid fa-circle-xmark"></i> Falha ao conectar com o servidor: ${err.message}
      </div>`;
  }
}

async function salvarPerfil() {
  const nome  = document.getElementById('profileNome')?.value.trim();
  const email = document.getElementById('profileEmail')?.value.trim();
  const cnpj  = document.getElementById('profileCnpj')?.value.trim();

  if (!nome || !email || !cnpj) {
    showProfileMsg('profileInfoMsg', '<i class="fa-solid fa-triangle-exclamation"></i> Nome, e-mail e CNPJ são obrigatórios.', 'error');
    return;
  }

  const btn = document.getElementById('btnSalvarPerfil');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  try {
    const res  = await fetch('../php/editar_perfil_organizador.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, cnpj })
    });
    const data = await res.json();

    if (data.success) {
      showProfileMsg('profileInfoMsg', '<i class="fa-solid fa-circle-check"></i> ' + data.message, 'success');
      showToast('Perfil atualizado!', 'fa-circle-check');
      // Atualizar sidebar
      const userNameEl = document.querySelector('.user-name');
      if (userNameEl) userNameEl.textContent = nome;
      const avatarEl = document.querySelector('.user-avatar');
      if (avatarEl) avatarEl.textContent = nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    } else {
      showProfileMsg('profileInfoMsg', '<i class="fa-solid fa-circle-xmark"></i> ' + (data.error || 'Erro ao salvar.'), 'error');
    }
  } catch (err) {
    showProfileMsg('profileInfoMsg', '<i class="fa-solid fa-circle-xmark"></i> Falha na comunicação com o servidor.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar Alterações'; }
  }
}

async function salvarSenha() {
  const nova     = document.getElementById('profileNovaSenha')?.value.trim();
  const confirma = document.getElementById('profileConfirmaSenha')?.value.trim();

  if (!nova || !confirma) {
    showProfileMsg('profileSenhaMsg', '<i class="fa-solid fa-triangle-exclamation"></i> Preencha ambos os campos de senha.', 'error');
    return;
  }
  if (nova !== confirma) {
    showProfileMsg('profileSenhaMsg', '<i class="fa-solid fa-triangle-exclamation"></i> As senhas não coincidem.', 'error');
    return;
  }

  const nome  = document.getElementById('profileNome')?.value.trim();
  const email = document.getElementById('profileEmail')?.value.trim();
  const cnpj  = document.getElementById('profileCnpj')?.value.trim();

  const btn = document.getElementById('btnSalvarSenha');
  if (btn) { btn.disabled = true; btn.textContent = 'Atualizando...'; }

  try {
    const res  = await fetch('../php/editar_perfil_organizador.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, cnpj, nova_senha: nova })
    });
    const data = await res.json();

    if (data.success) {
      showProfileMsg('profileSenhaMsg', '<i class="fa-solid fa-circle-check"></i> Senha atualizada com sucesso!', 'success');
      showToast('Senha atualizada!', 'fa-lock');
      document.getElementById('profileNovaSenha').value    = '';
      document.getElementById('profileConfirmaSenha').value = '';
    } else {
      showProfileMsg('profileSenhaMsg', '<i class="fa-solid fa-circle-xmark"></i> ' + (data.error || 'Erro ao atualizar senha.'), 'error');
    }
  } catch (err) {
    showProfileMsg('profileSenhaMsg', '<i class="fa-solid fa-circle-xmark"></i> Falha na comunicação com o servidor.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Atualizar Senha'; }
  }
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
    console.warn('Erro ao verificar autenticação:', error);
    return false;
  }
}

// =========================================
// EVENT CREATION
// =========================================

function showCreateMsg(msg, tipo) {
  const el = document.getElementById('createEventMsg');
  if (!el) return;
  el.innerHTML = msg;
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
  // Esconder msg anterior
  const msgEl = document.getElementById('createEventMsg');
  if (msgEl) msgEl.style.display = 'none';

  // Coletar campos básicos
  const nome      = (document.getElementById('nome')?.value      ?? '').trim();
  const data      = (document.getElementById('data')?.value      ?? '').trim();
  const genero    = (document.getElementById('genero')?.value    ?? '').trim();
  const local     = (document.getElementById('local')?.value     ?? '').trim();
  const cidade    = (document.getElementById('cidade')?.value    ?? '').trim();
  const estado    = (document.getElementById('estado')?.value    ?? '').trim();
  const cepRaw    = (document.getElementById('cep')?.value       ?? '').trim();
  const descricao = (document.getElementById('descricao')?.value ?? '').trim();

  const cep = cepRaw.replace(/\D/g, ''); // apenas dígitos

  // Validação de campos obrigatórios
  if (!nome || !data || !genero || !local || !cidade || !estado || !cep || !descricao) {
    showCreateMsg('<i class="fa-solid fa-triangle-exclamation"></i> Preencha todos os campos obrigatórios.', 'error');
    showToast('Preencha todos os campos obrigatórios!', 'fa-triangle-exclamation');
    return;
  }

  // Artistas selecionados
  const artistasChecked = document.querySelectorAll('#artistas-container input[type="checkbox"]:checked');
  const artistas = Array.from(artistasChecked).map(cb => Number(cb.value));

  if (artistas.length === 0) {
    showCreateMsg('<i class="fa-solid fa-triangle-exclamation"></i> Selecione ao menos um artista para o line-up.', 'error');
    showToast('Selecione ao menos um artista!', 'fa-triangle-exclamation');
    return;
  }

  // Tipos de ingressos
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
    showCreateMsg('<i class="fa-solid fa-triangle-exclamation"></i> Preencha corretamente ao menos um tipo de ingresso.', 'error');
    showToast('Configure ao menos um tipo de ingresso!', 'fa-triangle-exclamation');
    return;
  }

  // Imagem do evento
  const imageInput = document.getElementById('eventImage');
  const imageFile = imageInput?.files[0];

  // Montar FormData para upload de arquivos
  const formData = new FormData();
  formData.append('nome', nome);
  formData.append('data', data);
  formData.append('genero', genero);
  formData.append('local', local);
  formData.append('cidade', cidade);
  formData.append('estado', estado);
  formData.append('cep', cep);
  formData.append('descricao', descricao);
  formData.append('artistas', JSON.stringify(artistas));
  formData.append('tiposIngressos', JSON.stringify(tiposIngressos));

  if (imageFile) {
    formData.append('imagem', imageFile);
  }

  // Bloquear botão
  const btn = document.getElementById('btnCriarEvento');
  if (btn) { btn.disabled = true; btn.textContent = 'Publicando...'; }

  try {
    const response = await fetch('../php/criar-evento.php', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      showCreateMsg('<i class="fa-solid fa-circle-check"></i> Evento criado com sucesso!', 'success');
      showToast('Evento criado com sucesso!', 'fa-masks-theater');
      setTimeout(() => {
        document.getElementById('formEvento').reset();
        document.getElementById('ticketTypes').innerHTML = '';
        const preview = document.getElementById('eventImagePreview');
        const uploadArea = document.querySelector('.upload-area');
        const uploadText = document.querySelector('.upload-text');
        if (preview) {
          preview.style.display = 'none';
          preview.innerHTML = '';
        }
        if (uploadArea) uploadArea.classList.remove('has-file');
        if (uploadText) uploadText.textContent = 'Clique para adicionar imagem do evento';
        addTicketType('Pista');
        goPage('events');
      }, 1800);
    } else {
      showCreateMsg('<i class="fa-solid fa-circle-xmark"></i> ' + (result.error || 'Erro desconhecido ao criar evento.'), 'error');
      showToast('Erro: ' + (result.error || 'Desconhecido'), 'fa-triangle-exclamation');
    }
  } catch (error) {
    console.error('Erro de fetch:', error);
    showCreateMsg('<i class="fa-solid fa-circle-xmark"></i> Falha na comunicação com o servidor.', 'error');
    showToast('Erro de conexão. Tente novamente.', 'fa-triangle-exclamation');
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
      select.innerHTML = '<option value=""></option>';
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
      container.innerHTML = '';

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

const ICONES_EVENTO = ['<i class="fa-solid fa-wand-magic-sparkles"></i>','<i class="fa-solid fa-guitar"></i>','<i class="fa-solid fa-masks-theater"></i>','<i class="fa-solid fa-music"></i>','<i class="fa-solid fa-microphone"></i>','<i class="fa-solid fa-music"></i>','<i class="fa-solid fa-music"></i>','<i class="fa-solid fa-music"></i>','<i class="fa-solid fa-drum"></i>','<i class="fa-solid fa-music"></i>'];

function getIconeEvento(index) {
  return ICONES_EVENTO[index % ICONES_EVENTO.length];
}

async function loadMeusEventos() {
  const container = document.getElementById('eventsContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="padding:32px;text-align:center;">
      <span style="font-size:2rem;"><i class="fa-solid fa-spinner fa-spin"></i></span>
      <p style="color:var(--text-muted);margin-top:8px;">Carregando seus eventos...</p>
    </div>`;

  try {
    const response = await fetch('../php/get_meus_eventos.php');
    const data = await response.json();

    if (!data.success) {
      container.innerHTML = `
        <div class="glass" style="padding:32px;text-align:center;">
          <span style="font-size:2rem;"><i class="fa-solid fa-triangle-exclamation"></i></span>
          <p style="color:#ff8080;margin-top:8px;">${data.error || 'Erro ao carregar eventos.'}</p>
        </div>`;
      return;
    }

    const eventos = Array.isArray(data.data) ? data.data : [];
    organizerEventsCache = eventos;
    renderOrganizerInsights(eventos);

    if (eventos.length === 0) {
      container.innerHTML = `
        <div class="glass" style="padding:48px;text-align:center;">
          <span style="font-size:3rem;"><i class="fa-solid fa-masks-theater"></i></span>
          <h3 style="margin:16px 0 8px;font-size:1.2rem;">Nenhum evento criado ainda</h3>
          <p style="color:var(--text-muted);margin-bottom:20px;">Crie seu primeiro evento e ele aparecerá aqui.</p>
          <button class="btn btn--primary" onclick="goPage('create')"><i class="fa-solid fa-plus"></i> Criar Evento</button>
        </div>`;
      return;
    }

    let html = '';
    eventos.forEach((ev, idx) => {
      const passado = ev.passado;
      const statusClass = passado ? 'event-management__status--past' : 'event-management__status--active';
      const statusLabel = passado ? 'Encerrado' : 'Ativo';
      const icone = getIconeEvento(idx);
      const imagemUrl = ev.imagem ? normalizeImageUrl(ev.imagem) : null;
      const mediaHtml = imagemUrl 
        ? `<div class="event-management__media"><img src="${escapeHtml(imagemUrl)}" alt="${escapeHtml(ev.nome)}" /></div>`
        : `<div class="event-management__icon">${icone}</div>`;

      const vendidos  = parseInt(ev.vendidos)  || 0;
      const ocupacao  = parseInt(ev.ocupacao)  || 0;
      const receita   = ev.receita_fmt || 'R$ 0,00';

      const acoes = passado
        ? `<button class="btn btn--ghost btn--sm" onclick="goPage('analytics')"><i class="fa-solid fa-chart-column"></i> Relatório</button>
           <button class="btn btn--ghost btn--sm" onclick="goPage('ticketHelp')"><i class="fa-solid fa-comments"></i> Suporte</button>`
        : `<button class="btn btn--ghost btn--sm" onclick="showToast('Edição avançada entra na próxima etapa do MVP.', 'fa-pen')"><i class="fa-solid fa-pen"></i> Editar</button>
           <button class="btn btn--ghost btn--sm" onclick="goPage('analytics')"><i class="fa-solid fa-chart-column"></i> Analytics</button>
           <button class="btn btn--primary btn--sm" onclick="goPage('sales')"><i class="fa-solid fa-ticket"></i> Vendas</button>
           <button class="btn btn--ghost btn--sm" onclick="goPage('communities')"><i class="fa-solid fa-users"></i> Comunidade</button>`;

      html += `
        <div class="event-management-card glass">
          <div class="event-management__header">
            ${mediaHtml}
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
        <span style="font-size:2rem;"><i class="fa-solid fa-circle-xmark"></i></span>
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
      <button type="button" class="btn btn--ghost btn--xs" onclick="removeTicketType(this)"><i class="fa-solid fa-xmark"></i></button>
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
  if (ticketType) ticketType.remove();
}

// =========================================
// IMAGE UPLOAD
// =========================================

function triggerFileUpload() {
  const input = document.getElementById('eventImage');
  if (input) input.click();
}

// =========================================
// EVENT LISTENERS
// =========================================

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-page');
    goPage(page);
  });
});

if (burgerBtn) {
  burgerBtn.addEventListener('click', openSidebar);
}
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', closeSidebar);
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    showToast('Até logo!', 'fa-hand');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  });
}

const eventImageInput = document.getElementById('eventImage');
if (eventImageInput) {
  eventImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('eventImagePreview');
    if (file) {
      const uploadArea = document.querySelector('.upload-area');
      const uploadText = document.querySelector('.upload-text');
      if (uploadArea) uploadArea.classList.add('has-file');
      if (uploadText) uploadText.textContent = `Imagem selecionada: ${file.name}`;
      if (preview) {
        const imageUrl = URL.createObjectURL(file);
        const sizeMb = (file.size / 1024 / 1024).toFixed(2).replace('.', ',');
        preview.style.display = 'block';
        preview.innerHTML = `
          <img src="${imageUrl}" alt="Prévia da imagem do evento">
          <div class="upload-preview__meta">
            <span>${escapeHtml(file.name)}</span>
            <span>${sizeMb} MB</span>
          </div>
        `;
      }
      showToast(`Imagem "${file.name}" selecionada!`, 'fa-camera');
    } else if (preview) {
      preview.style.display = 'none';
      preview.innerHTML = '';
    }
  });
}


// =========================================
// HELP CENTER / TICKET SUBMISSION
// =========================================

function setupHelpCenter() {
  const ticketHelpForm = document.getElementById('ticketHelpForm');
  if (ticketHelpForm) {
    ticketHelpForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const titleInput = document.getElementById('ticketTitle');
      const descriptionInput = document.getElementById('ticketDescription');
      const submitBtn = document.getElementById('ticketHelpSubmit');

      if (!titleInput || !descriptionInput) return;

      const title = titleInput.value.trim();
      const description = descriptionInput.value.trim();

      if (!title || !description) {
        showToast('Preencha título e descrição antes de enviar.', 'fa-triangle-exclamation');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      try {
        const response = await fetch('../php/create_ticket.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: title, descricao: description, tipo: 'organizador' })
        });

        const result = await response.json();
        if (result.success) {
          showToast('Ticket enviado com sucesso!', 'fa-circle-check');
          ticketHelpForm.reset();
          loadMySupportTickets();
        } else {
          showToast(result.error || 'Erro ao enviar ticket.', 'fa-triangle-exclamation');
        }
      } catch (error) {
        console.error('Erro ao enviar ticket:', error);
        showToast('Falha na comunicação com o servidor.', 'fa-triangle-exclamation');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar ticket';
      }
    });
  }
}

async function loadMySupportTickets() {
  const container = document.getElementById('mySupportTicketsList');
  if (!container) return;

  container.innerHTML = '<p class="support-ticket-empty">Carregando seus chamados...</p>';

  try {
    const response = await fetch('../php/get_my_support_tickets.php?tipo=organizador');
    const result = await response.json();

    if (response.status === 401) {
      window.location.href = 'loginOrganizador.html';
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao carregar chamados.');
    }

    mySupportTickets = Array.isArray(result.tickets) ? result.tickets : [];
    renderMySupportTickets(mySupportTickets);
  } catch (error) {
    console.error('Erro ao carregar chamados:', error);
    container.innerHTML = '<p class="support-ticket-empty">Nao foi possivel carregar seus chamados.</p>';
  }
}

function renderMySupportTickets(tickets) {
  const container = document.getElementById('mySupportTicketsList');
  if (!container) return;

  if (!tickets.length) {
    container.innerHTML = '<p class="support-ticket-empty">Voce ainda nao abriu chamados.</p>';
    return;
  }

  container.innerHTML = tickets.map(ticket => {
    const status = ticket.status_ticket || 'aberto';
    const canReply = status !== 'fechado';
    const response = ticket.resposta
      ? `<div class="support-ticket-card__box"><strong>Resposta do suporte:</strong><p>${escapeHtml(ticket.resposta)}</p></div>`
      : '';
    const returnText = ticket.retorno_usuario
      ? `<div class="support-ticket-card__box"><strong>Seu retorno:</strong><p>${escapeHtml(ticket.retorno_usuario)}</p></div>`
      : '';
    const actions = canReply
      ? `<div class="support-ticket-card__actions">
          <button class="btn btn--primary btn--sm" onclick="resolveSupportTicket(${Number(ticket.id_ticket)})">Problema resolvido</button>
          <button class="btn btn--ghost btn--sm" onclick="openSupportTicketConversation(${Number(ticket.id_ticket)})">Abrir conversa</button>
        </div>`
      : '';
    const statusClass = status === 'fechado' ? 'support-ticket-status--closed' : 'support-ticket-status--active';

    return `
      <div class="support-ticket-card">
        <div class="support-ticket-card__header">
          <div>
            <div class="support-ticket-card__id">#${Number(ticket.id_ticket)}</div>
            <div class="support-ticket-card__title">${escapeHtml(ticket.titulo)}</div>
          </div>
          <span class="support-ticket-status ${statusClass}">${supportTicketStatusLabel(status)}</span>
        </div>
        <p class="support-ticket-card__desc">${escapeHtml(ticket.descricao)}</p>
        ${response}
        ${returnText}
        ${actions}
      </div>
    `;
  }).join('');
}

async function resolveSupportTicket(ticketId) {
  await updateSupportTicketFromUser({
    id_ticket: ticketId,
    action: 'resolver',
    tipo: 'organizador'
  }, 'Chamado marcado como resolvido.');
}

function openSupportTicketConversation(ticketId) {
  const ticket = mySupportTickets.find(item => Number(item.id_ticket) === Number(ticketId));
  if (!ticket) {
    showToast('Chamado nao encontrado.', ' ');
    return;
  }

  document.getElementById('supportChatTicketInput').value = ticket.id_ticket;
  document.getElementById('supportChatTicketId').textContent = `Ticket #${ticket.id_ticket}`;
  document.getElementById('supportChatTitle').textContent = ticket.titulo || 'Atendimento';
  document.getElementById('supportChatReply').value = '';

  renderSupportChatMessages(ticket);
  const modal = document.getElementById('supportTicketChatModal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeSupportTicketConversation() {
  const modal = document.getElementById('supportTicketChatModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function returnSupportTicket(ticketId, retorno) {
  if (!retorno || !retorno.trim()) return false;

  return updateSupportTicketFromUser({
    id_ticket: ticketId,
    action: 'retornar',
    retorno_usuario: retorno.trim(),
    tipo: 'organizador'
  }, 'Retorno enviado ao suporte.');
}

function renderSupportChatMessages(ticket) {
  const messages = document.getElementById('supportChatMessages');
  if (!messages) return;

  const history = Array.isArray(ticket.mensagens) ? ticket.mensagens : [];
  if (!history.length) {
    messages.innerHTML = `
      <div class="support-chat__message support-chat__message--user">
        <div class="support-chat__author">Voce</div>
        <p>${escapeHtml(ticket.descricao || 'Sem descricao.')}</p>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;
    return;
  }

  messages.innerHTML = history.map(message => {
    const isSupport = message.autor_tipo === 'suporte';
    const author = isSupport
      ? `Suporte${message.autor_nome ? ` - ${escapeHtml(message.autor_nome)}` : ''}`
      : 'Voce';
    const className = isSupport ? 'support-chat__message--support' : 'support-chat__message--user';
    return `
      <div class="support-chat__message ${className}">
        <div class="support-chat__author">${author}</div>
        <p>${escapeHtml(message.mensagem)}</p>
      </div>
    `;
  }).join('');
  messages.scrollTop = messages.scrollHeight;
}

async function updateSupportTicketFromUser(payload, successMessage) {
  try {
    const response = await fetch('../php/update_my_support_ticket.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Nao foi possivel atualizar o chamado.');
    }

    showToast(successMessage, ' ');
    loadMySupportTickets();
    return true;
  } catch (error) {
    console.error('Erro ao atualizar chamado:', error);
    showToast(error.message || 'Erro ao atualizar chamado.', ' ');
    return false;
  }
}

function supportTicketStatusLabel(status) {
  const labels = {
    aberto: 'Aberto',
    em_atendimento: 'Em atendimento',
    aguardando_usuario: 'Aguardando seu retorno',
    fechado: 'Fechado'
  };
  return labels[status] || 'Aberto';
}

const supportTicketChatForm = document.getElementById('supportTicketChatForm');
if (supportTicketChatForm) {
  supportTicketChatForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const ticketId = Number(document.getElementById('supportChatTicketInput').value);
    const replyInput = document.getElementById('supportChatReply');
    const retorno = replyInput ? replyInput.value.trim() : '';

    if (!ticketId || !retorno) {
      showToast('Escreva uma mensagem antes de enviar.', ' ');
      return;
    }

    const sent = await returnSupportTicket(ticketId, retorno);
    if (sent) {
      const messages = document.getElementById('supportChatMessages');
      if (messages) {
        messages.insertAdjacentHTML('beforeend', `
          <div class="support-chat__message support-chat__message--user">
            <div class="support-chat__author">Voce</div>
            <p>${escapeHtml(retorno)}</p>
          </div>
        `);
        messages.scrollTop = messages.scrollHeight;
      }
      replyInput.value = '';
    }
  });
}

// =========================================
// INITIALIZATION
// =========================================

async function init() {
  loadPerfil();
  setupHelpCenter();
  initChatListeners();

  const isAuthenticated = await checkAuthentication();
  if (!isAuthenticated) {
    showToast('Sessão expirada. Redirecionando...', 'fa-triangle-exclamation');
    setTimeout(() => { window.location.href = 'loginOrganizador.html'; }, 2000);
    return;
  }

  goPage('dashboard');

  setTimeout(() => {
    showToast('Bem-vindo ao painel do organizador!', 'fa-masks-theater');
  }, 500);
}

document.addEventListener('DOMContentLoaded', init);

// =========================================
// KEYBOARD SHORTCUTS
// =========================================

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSidebar();
});

// =========================================
// RESPONSIVE HANDLING
// =========================================

window.addEventListener('resize', () => {
  if (window.innerWidth > 700) {
    closeSidebar();
  }
});

/* =========================================
   COMMUNITY ACTIONS & CHAT POPUP (ORGANIZADOR)
   ========================================= */
let activeChatCommunityId = null;
let activeChatEventoId = null;
let chatPollingInterval = null;
let replyingToMessageId = null;

async function loadOrgCommunities() {
  const container = document.getElementById('orgGroupsGridContainer');
  if (!container) return;

  try {
    const response = await fetch('../php/comunidades.php?fetch=1');
    const result = await response.json();

    if (result.success) {
      const minhas = result.minhas || [];

      let html = '';

      if (minhas.length === 0) {
        html = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Você ainda não possui nenhuma comunidade de evento criada. <i class="fa-solid fa-face-frown"></i></p>';
      } else {
        minhas.forEach(c => {
          const escapedNome = c.nome.replace(/'/g, "\\'").replace(/"/g, '&quot;');
          html += `
            <div class="comunidade-card">
              <div class="comunidade-card__img-placeholder"><i class="fa-solid fa-users"></i></div>
              <div class="comunidade-card__body">
                <p class="comunidade-card__titulo">${escapeHtml(c.nome)}</p>
                <p class="comunidade-card__evento">${escapeHtml(c.nome_evento)}</p>
                <p class="comunidade-card__membros"><i class="fa-solid fa-users"></i> ${c.total_membros || 0} membro${c.total_membros != 1 ? 's' : ''}</p>
                <button class="comunidade-card__btn comunidade-card__btn--entrar" onclick="openCommunityChat(${c.id_comunidade}, ${c.id_evento}, '${escapedNome}')">
                  <i class="fa-solid fa-comments"></i> Acessar Chat
                </button>
              </div>
            </div>
          `;
        });
      }

      container.innerHTML = html;
    } else {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Erro ao carregar comunidades: ${result.error}</p>`;
    }
  } catch (e) {
    console.error('Erro ao buscar comunidades:', e);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Erro de rede ao carregar comunidades.</p>';
  }
}

// ─── Funções do Chat Popup ──────────────────────────────────────────────────
function openCommunityChat(idComunidade, idEvento, nomeComunidade) {
  activeChatCommunityId = idComunidade;
  activeChatEventoId = idEvento;
  replyingToMessageId = null;

  document.getElementById('chatModalTitle').innerText = nomeComunidade;
  document.getElementById('chatModalSub').innerText = 'Comunidade Oficial do Evento (Painel do Organizador)';
  document.getElementById('chatReplyBar').style.display = 'none';
  document.getElementById('chatInput').value = '';
  const imageInput = document.getElementById('chatImageInput');
  if (imageInput) imageInput.value = '';
  document.getElementById('chatMessages').innerHTML = '<p class="chat-loading" style="text-align:center; color:var(--text-muted); padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando mensagens...</p>';

  const modal = document.getElementById('community-chat-modal');
  modal.style.display = 'flex';

  fetchChatMessages();

  if (chatPollingInterval) clearInterval(chatPollingInterval);
  chatPollingInterval = setInterval(fetchChatMessages, 4000);
}

function closeCommunityChat() {
  const modal = document.getElementById('community-chat-modal');
  if (modal) modal.style.display = 'none';
  
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
  activeChatCommunityId = null;
  activeChatEventoId = null;
  replyingToMessageId = null;
}

async function fetchChatMessages() {
  if (!activeChatCommunityId || !activeChatEventoId) return;
  try {
    const response = await fetch(`../php/comunidade_feed.php?action=fetch&id_comunidade=${activeChatCommunityId}&id_evento=${activeChatEventoId}`);
    const result = await response.json();
    if (result.success) {
      renderChatMessages(result.mensagens);
    } else {
      console.error('Erro ao buscar mensagens:', result.error);
      const container = document.getElementById('chatMessages');
      if (container) {
        container.innerHTML = `<p class="chat-error" style="text-align:center; color:var(--text-muted); padding:20px;">Erro ao carregar mensagens: ${escapeHtml(result.error)}</p>`;
      }
    }
  } catch (err) {
    console.error('Erro de rede ao buscar mensagens:', err);
    const container = document.getElementById('chatMessages');
    if (container) {
      container.innerHTML = '<p class="chat-error" style="text-align:center; color:var(--text-muted); padding:20px;">Erro de rede ao carregar mensagens.</p>';
    }
  }
}

function renderChatMessages(mensagens) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const isAtBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 80;

  if (!Array.isArray(mensagens) || mensagens.length === 0) {
    container.innerHTML = '<p class="chat-empty" style="text-align:center; color:var(--text-muted); padding:40px;">Nenhuma mensagem ainda. Envie a primeira instrução para seus participantes.</p>';
    return;
  }

  let html = '';
  mensagens.forEach(msg => {
    const isOrg = msg.autor_tipo === 'organizador';
    const bubbleClass = isOrg ? 'chat-bubble chat-bubble--organizador' : 'chat-bubble';
    const badgeHtml = isOrg ? '<span class="chat-bubble__badge"><i class="fa-solid fa-star"></i> Organizador</span>' : '';

    let replyRefHtml = '';
    if (msg.id_resposta_a) {
      replyRefHtml = `
        <div class="chat-bubble__reply-ref">
          <div class="chat-reply-ref__author"><i class="fa-solid fa-reply"></i> ${escapeHtml(msg.resposta_autor_nome)}:</div>
          <div class="chat-reply-ref__text">${escapeHtml(msg.resposta_texto)}</div>
        </div>
      `;
    }

    const messageText = msg.mensagem || '';
    const escapedMsgText = messageText.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const escapedAuthorName = (msg.autor_nome || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

    let messageContent = '';
    if (messageText) {
      messageContent += `<div class="chat-bubble__text">${escapeHtml(messageText)}</div>`;
    }
    if (msg.imagem) {
      messageContent += `
        <div class="chat-bubble__image">
          <img src="../uploads/${escapeHtml(msg.imagem)}" alt="Anexo da comunidade" />
        </div>
      `;
    }
    if (!messageContent) {
      messageContent = '<div class="chat-bubble__text chat-bubble__text--empty">(imagem)</div>';
    }

    html += `
      <div class="${bubbleClass}" data-id="${msg.id_mensagem}">
        <div class="chat-bubble__header">
          <span class="chat-bubble__author">${escapeHtml(msg.autor_nome || '')}</span>
          ${badgeHtml}
          <span class="chat-bubble__time">${msg.data_envio || ''}</span>
        </div>
        ${replyRefHtml}
        ${messageContent}
        <div class="chat-bubble__actions">
          <button class="chat-bubble__reply-btn" onclick="setChatReply(${msg.id_mensagem}, '${escapedAuthorName}', '${escapedMsgText}')">
            <i class="fa-solid fa-reply"></i> Responder
          </button>
        </div>
      </div>
    `;
  });

  const wasLoading = container.innerHTML.includes('chat-loading');
  container.innerHTML = html;

  if (isAtBottom || wasLoading) {
    container.scrollTop = container.scrollHeight;
  }
}

function setChatReply(idMensagem, autorNome, textoMensagem) {
  replyingToMessageId = idMensagem;
  const replyBar = document.getElementById('chatReplyBar');
  const replyText = document.getElementById('chatReplyText');

  const preview = textoMensagem.length > 50 ? textoMensagem.substring(0, 50) + '...' : textoMensagem;

  replyText.innerText = `${autorNome}: "${preview}"`;
  replyBar.style.display = 'flex';

  const input = document.getElementById('chatInput');
  if (input) input.focus();
}

function cancelChatReply() {
  replyingToMessageId = null;
  const replyBar = document.getElementById('chatReplyBar');
  if (replyBar) replyBar.style.display = 'none';
  const replyText = document.getElementById('chatReplyText');
  if (replyText) replyText.innerText = '';
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const mensagem = input.value.trim();
  const imageInput = document.getElementById('chatImageInput');
  const file = imageInput?.files?.[0] ?? null;

  if (!mensagem && !file) {
    showToast('Envie uma mensagem ou selecione uma imagem.', 'fa-triangle-exclamation');
    return;
  }
  if (!activeChatCommunityId || !activeChatEventoId) return;

  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('action', 'send');
    formData.append('id_comunidade', activeChatCommunityId);
    formData.append('id_evento', activeChatEventoId);
    formData.append('mensagem', mensagem);
    if (replyingToMessageId) {
      formData.append('id_resposta_a', replyingToMessageId);
    }
    if (file) {
      formData.append('imagem', file);
    }

    const response = await fetch('../php/comunidade_feed.php', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      input.value = '';
      if (imageInput) {
        imageInput.value = '';
      }
      cancelChatReply();
      await fetchChatMessages();
    } else {
      showToast('Erro ao enviar: ' + result.error, 'fa-triangle-exclamation');
    }
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    showToast('Erro de rede ao enviar mensagem.', 'fa-triangle-exclamation');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

function initChatListeners() {
  const closeBtn = document.getElementById('chatCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeCommunityChat);

  const replyCancel = document.getElementById('chatReplyCancel');
  if (replyCancel) replyCancel.addEventListener('click', cancelChatReply);

  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);

  const input = document.getElementById('chatInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  const modal = document.getElementById('community-chat-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCommunityChat();
      }
    });
  }
}
