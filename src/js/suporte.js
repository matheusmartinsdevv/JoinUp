const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const burgerBtn = document.getElementById('burgerBtn');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const toast = document.getElementById('toast');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const ticketResponseForm = document.getElementById('ticketResponseForm');
const closeTicketBtn = document.getElementById('closeTicketBtn');
const chatReplyForm = document.getElementById('chatReplyForm');

let supportTickets = [];
let currentTicketFilter = 'all';
let currentTicketId = null;
let currentChatTicketId = null;
let currentSupport = null;

const statusLabels = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  aguardando_usuario: 'Aguardando usuário',
  fechado: 'Fechado'
};

const statusClasses = {
  aberto: 'ticket-card__status--urgent',
  em_atendimento: 'ticket-card__status--high',
  aguardando_usuario: 'ticket-card__status--normal',
  fechado: 'ticket-card__status--closed'
};

const statusIcons = {
  aberto: 'fa-inbox',
  em_atendimento: 'fa-headset',
  aguardando_usuario: 'fa-reply',
  fechado: 'fa-circle-check'
};

function goPage(pageName) {
  pages.forEach(page => page.classList.remove('active'));

  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) targetPage.classList.add('active');

  navItems.forEach(item => item.classList.remove('active'));
  const activeNav = document.querySelector(`[data-page="${pageName}"]`);
  if (activeNav) activeNav.classList.add('active');

  if (pageName === 'chat' && !currentChatTicketId) {
    const firstChatTicket = getChatTickets()[0];
    if (firstChatTicket) currentChatTicketId = firstChatTicket.id_ticket;
    renderChat();
  }

  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

function iconMarkup(icon = '') {
  if (!icon) return '';
  if (String(icon).includes('<i')) return icon;
  return `<i class="fa-solid ${icon}"></i>`;
}

function showToast(message, icon = '', duration = 3000) {
  document.getElementById('toastIcon').innerHTML = iconMarkup(icon);
  document.getElementById('toastMsg').textContent = message;
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), duration);
}

async function loadSupportTickets() {
  renderLoadingState();

  try {
    const response = await fetch('../php/get_support_tickets.php');
    const result = await response.json();

    if (response.status === 401) {
      window.location.href = 'loginSuporte.html';
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao carregar tickets.');
    }

    supportTickets = Array.isArray(result.tickets) ? result.tickets : [];
    currentSupport = result.suporte || {};
    updateSupportProfile(currentSupport);
    updateSupportStats(result.stats || calculateStats(supportTickets));
    renderRecentTickets();
    renderSupportTickets();
    renderChat();
    renderAnalytics();
    renderReports();
    renderProfileMetrics();
  } catch (error) {
    console.error('Erro ao carregar tickets:', error);
    showToast(error.message || 'Erro ao carregar tickets.');
    renderErrorState(error.message || 'Não foi possível carregar os dados.');
  }
}

function renderLoadingState() {
  setHtml('supportTicketsList', loadingCard('Carregando tickets...'));
  setHtml('recentTicketsList', loadingActivity('Carregando atividade recente...'));
  setHtml('chatTicketsList', loadingCard('Carregando conversas...'));
  setHtml('chatMessages', '');
}

function renderErrorState(message) {
  const html = emptyStateHtml('fa-triangle-exclamation', 'Dados indisponíveis', message);
  setHtml('supportTicketsList', html);
  setHtml('recentTicketsList', html);
  setHtml('chatTicketsList', html);
  setHtml('chatMessages', '');
}

function updateSupportProfile(suporte) {
  const nome = suporte.nome || 'Suporte';
  const email = suporte.email || '';
  const initials = getInitials(nome);

  setText('supportAvatar', initials);
  setText('supportName', nome);
  setText('supportEmail', email || 'Email não informado');
  setText('profileSupportName', nome);
  setText('profileSupportEmail', email || 'Email não informado');
}

function updateSupportStats(stats) {
  setText('statOpenTickets', stats.abertos || 0);
  setText('statProgressTickets', stats.em_atendimento || 0);
  setText('statWaitingTickets', stats.aguardando_usuario || 0);
  setText('statClosedTickets', stats.fechados || 0);
}

async function loadSupportProfileData() {
  try {
    const response = await fetch('../php/get_suporte_data.php');
    const result = await response.json();

    if (result?.sucesso || result?.success) {
      updateSupportProfile({ nome: result.nome, email: result.email });
      return;
    }

    console.warn('Não foi possível carregar perfil de suporte:', result.mensagem || result.error || 'Resposta inválida');
  } catch (error) {
    console.error('Erro ao carregar perfil de suporte:', error);
  }

  // Fallback: tente usar o mesmo payload de tickets, caso a sessão de suporte exista
  await loadSupportProfileFromTickets();
}

async function loadSupportProfileFromTickets() {
  try {
    const response = await fetch('../php/get_support_tickets.php');
    const result = await response.json();

    if (result?.success && result.suporte) {
      updateSupportProfile({ nome: result.suporte.nome, email: result.suporte.email });
      return;
    }

    console.warn('Fallback de perfil de suporte também falhou:', result.error || result.mensagem || 'Resposta inválida');
  } catch (error) {
    console.error('Erro no fallback de perfil de suporte:', error);
  }
}

function renderRecentTickets() {
  const recent = supportTickets.slice(0, 6);
  if (!recent.length) {
    setHtml('recentTicketsList', emptyActivity('Nenhum ticket encontrado.', 'Os chamados aparecerão aqui quando forem cadastrados.'));
    return;
  }

  setHtml('recentTicketsList', recent.map(ticket => `
    <div class="activity-item glass">
      <div class="activity-item__icon"><i class="fa-solid ${statusIcons[ticket.status_ticket] || 'fa-ticket'}"></i></div>
      <div class="activity-item__content">
        <div class="activity-item__title">#${ticket.id_ticket} - ${escapeHtml(ticket.titulo)}</div>
        <div class="activity-item__meta">${escapeHtml(ticket.usuario_nome)} - ${formatDate(ticket.data_atualizacao || ticket.data_criacao)}</div>
      </div>
      <div class="activity-item__status ${activityStatusClass(ticket.status_ticket)}">${statusLabels[ticket.status_ticket] || 'Aberto'}</div>
    </div>
  `).join(''));
}

function renderSupportTickets() {
  const tickets = getFilteredTickets();

  if (!tickets.length) {
    setHtml('supportTicketsList', emptyStateHtml('fa-ticket', 'Nenhum ticket encontrado', 'Ajuste os filtros ou aguarde novos chamados.'));
    return;
  }

  setHtml('supportTicketsList', tickets.map(ticket => {
    const status = ticket.status_ticket || 'aberto';
    const canRespond = status !== 'fechado';
    const hasReturn = ticket.retorno_usuario ? `<div class="ticket-card__note"><strong>Retorno do usuário:</strong> ${escapeHtml(ticket.retorno_usuario)}</div>` : '';
    const response = ticket.resposta ? `<div class="ticket-card__note"><strong>Última resposta:</strong> ${escapeHtml(ticket.resposta)}</div>` : '';

    return `
      <div class="ticket-card glass">
        <div class="ticket-card__header">
          <div class="ticket-card__info">
            <div class="ticket-card__id">#${ticket.id_ticket}</div>
            <div class="ticket-card__title">${escapeHtml(ticket.titulo)}</div>
            <div class="ticket-card__user">${escapeHtml(ticket.usuario_nome)} (${escapeHtml(ticket.usuario_tipo)})</div>
          </div>
          <div class="ticket-card__status ${statusClasses[status] || statusClasses.aberto}">${statusLabels[status] || 'Aberto'}</div>
        </div>
        <div class="ticket-card__content">
          <p>${escapeHtml(ticket.descricao)}</p>
          ${response}
          ${hasReturn}
        </div>
        <div class="ticket-card__footer">
          <div class="ticket-card__meta">
            <span>Criado em ${formatDate(ticket.data_criacao)}</span>
            <span>Atualizado em ${formatDate(ticket.data_atualizacao)}</span>
          </div>
          <div class="ticket-card__actions">
            <button class="btn btn--sm ${canRespond ? 'btn--primary' : 'btn--ghost'}" onclick="openTicket(${ticket.id_ticket})">${canRespond ? 'Atender' : 'Visualizar'}</button>
          </div>
        </div>
      </div>
    `;
  }).join(''));
}

function getFilteredTickets() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  const userType = document.getElementById('supportUserTypeFilter')?.value || 'all';

  return supportTickets.filter(ticket => {
    const matchesStatus = currentTicketFilter === 'all' || ticket.status_ticket === currentTicketFilter;
    const matchesType = userType === 'all' || ticket.usuario_tipo === userType;
    const haystack = `${ticket.id_ticket} ${ticket.titulo} ${ticket.descricao} ${ticket.usuario_nome} ${ticket.usuario_email}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesStatus && matchesType && matchesSearch;
  });
}

function filterTickets(status) {
  currentTicketFilter = status;
  document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));

  const activeTab = Array.from(document.querySelectorAll('.filter-tab')).find(tab => {
    const onclick = tab.getAttribute('onclick') || '';
    return onclick.includes(`'${status}'`);
  });
  if (activeTab) activeTab.classList.add('active');

  renderSupportTickets();
}

function getChatTickets() {
  return supportTickets.filter(ticket => (
    (Array.isArray(ticket.mensagens) && ticket.mensagens.length > 0) ||
    ticket.resposta ||
    ticket.retorno_usuario ||
    ticket.status_ticket === 'aberto' ||
    ticket.status_ticket === 'em_atendimento' ||
    ticket.status_ticket === 'aguardando_usuario'
  ));
}

function renderChat() {
  const chatTickets = getChatTickets();
  const list = document.getElementById('chatTicketsList');
  const messages = document.getElementById('chatMessages');

  if (!chatTickets.length) {
    list.innerHTML = emptyStateHtml('fa-comments', 'Nenhuma conversa ativa', 'As conversas aparecem quando um ticket recebe resposta ou retorno.');
    messages.innerHTML = emptyStateHtml('fa-comment-slash', 'Sem conversa selecionada', 'Responda um ticket para iniciar o histórico de atendimento.');
    setHtml('activeChatUser', '');
    document.getElementById('messageInput').disabled = true;
    return;
  }

  if (!currentChatTicketId || !chatTickets.some(ticket => ticket.id_ticket === currentChatTicketId)) {
    currentChatTicketId = chatTickets[0].id_ticket;
  }

  list.innerHTML = chatTickets.map(ticket => `
    <button class="chat-item glass ${ticket.id_ticket === currentChatTicketId ? 'active' : ''}" type="button" onclick="selectChatTicket(${ticket.id_ticket})">
      <div class="chat-item__avatar">${escapeHtml(getInitials(ticket.usuario_nome))}</div>
      <div class="chat-item__content">
        <div class="chat-item__name">${escapeHtml(ticket.usuario_nome)}</div>
        <div class="chat-item__last-msg">${escapeHtml(getLastTicketMessage(ticket))}</div>
      </div>
      <div class="chat-item__time">${formatDate(ticket.data_atualizacao || ticket.data_criacao)}</div>
    </button>
  `).join('');

  const ticket = chatTickets.find(item => item.id_ticket === currentChatTicketId);
  renderSelectedChat(ticket);
}

function selectChatTicket(ticketId) {
  currentChatTicketId = Number(ticketId);
  renderChat();
}

function renderSelectedChat(ticket) {
  if (!ticket) return;

  setHtml('activeChatUser', `
    <div class="chat-user__avatar">${escapeHtml(getInitials(ticket.usuario_nome))}</div>
    <div class="chat-user__info">
      <div class="chat-user__name">${escapeHtml(ticket.usuario_nome)}</div>
      <div class="chat-user__status">${statusLabels[ticket.status_ticket] || 'Aberto'}</div>
    </div>
  `);

  const entries = getTicketChatEntries(ticket);

  setHtml('chatMessages', entries.map(entry => `
    <div class="message ${entry.type}">
      <div class="message__author">${escapeHtml(entry.label)}</div>
      <div class="message__content">${escapeHtml(entry.text)}</div>
      <div class="message__time">${formatDate(entry.date)}</div>
    </div>
  `).join(''));

  const input = document.getElementById('messageInput');
  input.disabled = ticket.status_ticket === 'fechado';
  input.placeholder = ticket.status_ticket === 'fechado' ? 'Ticket fechado' : 'Digite sua resposta ao usuário';
  document.getElementById('chatOpenTicketBtn').onclick = () => openTicket(ticket.id_ticket);
}

function getTicketChatEntries(ticket) {
  const history = Array.isArray(ticket.mensagens) ? ticket.mensagens : [];
  if (history.length) {
    return history.map(message => ({
      type: message.autor_tipo === 'suporte' ? 'sent' : 'received',
      label: message.autor_tipo === 'suporte' ? (message.autor_nome || 'Suporte') : ticket.usuario_nome,
      text: message.mensagem,
      date: message.data_mensagem
    }));
  }

  const entries = [{
    type: 'received',
    label: ticket.usuario_nome,
    text: ticket.descricao,
    date: ticket.data_criacao
  }];

  if (ticket.resposta) {
    entries.push({
      type: 'sent',
      label: ticket.suporte_nome || 'Suporte',
      text: ticket.resposta,
      date: ticket.data_atualizacao
    });
  }

  if (ticket.retorno_usuario) {
    entries.push({
      type: 'received',
      label: ticket.usuario_nome,
      text: ticket.retorno_usuario,
      date: ticket.data_atualizacao
    });
  }

  return entries;
}

function getLastTicketMessage(ticket) {
  const entries = getTicketChatEntries(ticket);
  const last = entries[entries.length - 1];
  return last ? last.text : ticket.descricao;
}

function renderAnalytics() {
  const stats = calculateStats(supportTickets);
  const byUserType = countBy(supportTickets, ticket => ticket.usuario_tipo || 'Usuário');
  const byDay = countBy(supportTickets, ticket => formatDateOnly(ticket.data_criacao));

  renderDataList('analyticsStatusList', [
    ['Abertos', stats.abertos],
    ['Em atendimento', stats.em_atendimento],
    ['Aguardando usuário', stats.aguardando_usuario],
    ['Fechados', stats.fechados]
  ]);

  renderDataList('analyticsUserTypeList', Object.entries(byUserType));
  renderDataList('analyticsDailyList', Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7));
  setText('analyticsAvgResolution', calculateAverageResolution(supportTickets) || 'Sem dados');
}

function renderReports() {
  const stats = calculateStats(supportTickets);
  const closedWithTime = supportTickets.filter(ticket => ticket.status_ticket === 'fechado' && ticket.data_fechamento);
  const content = [
    ['Total de tickets', stats.total],
    ['Abertos', stats.abertos],
    ['Em atendimento', stats.em_atendimento],
    ['Aguardando usuário', stats.aguardando_usuario],
    ['Fechados', stats.fechados],
    ['Tickets fechados com data de fechamento', closedWithTime.length]
  ];

  setHtml('reportsContainer', content.map(([label, value]) => `
    <div class="report-card glass">
      <div class="report-card__icon"><i class="fa-solid fa-file-lines"></i></div>
      <div class="report-card__content">
        <h3>${escapeHtml(label)}</h3>
        <p>${escapeHtml(String(value))}</p>
        <div class="report-card__meta">Calculado a partir da tabela ticket</div>
      </div>
    </div>
  `).join(''));
}

function renderProfileMetrics() {
  const supportId = Number(currentSupport?.id || 0);
  const assigned = supportTickets.filter(ticket => Number(ticket.id_usuario_suporte) === supportId);
  const closed = assigned.filter(ticket => ticket.status_ticket === 'fechado');
  const createdToday = supportTickets.filter(ticket => isToday(ticket.data_criacao));
  const rate = assigned.length ? `${Math.round((closed.length / assigned.length) * 100)}%` : 'Sem dados';

  setText('profileResolutionRate', rate);
  setText('profileAvgTime', calculateAverageResolution(assigned) || 'Sem dados');
  setText('profileAssignedTickets', assigned.length);
  setText('profileTicketsToday', createdToday.length);
}

function openTicket(ticketId) {
  const ticket = supportTickets.find(item => Number(item.id_ticket) === Number(ticketId));
  if (!ticket) {
    showToast('Ticket não encontrado.');
    return;
  }

  currentTicketId = ticket.id_ticket;
  setText('modalTicketId', `Ticket #${ticket.id_ticket}`);
  setText('modalTicketTitle', ticket.titulo || 'Sem título');
  document.getElementById('modalTicketInputId').value = ticket.id_ticket;
  document.getElementById('ticketResponseText').value = '';

  const historyHtml = getTicketChatEntries(ticket).map(entry => `
    <div class="ticket-detail-box">
      <strong>${escapeHtml(entry.label)} - ${formatDate(entry.date)}</strong>
      <p>${escapeHtml(entry.text)}</p>
    </div>
  `).join('');

  setHtml('modalTicketBody', `
    <div class="ticket-detail-row"><strong>Usuário:</strong> ${escapeHtml(ticket.usuario_nome)} (${escapeHtml(ticket.usuario_tipo)})</div>
    <div class="ticket-detail-row"><strong>E-mail:</strong> ${escapeHtml(ticket.usuario_email || 'Não informado')}</div>
    <div class="ticket-detail-row"><strong>Status:</strong> ${statusLabels[ticket.status_ticket] || 'Aberto'}</div>
    <div class="ticket-detail-box"><strong>Demanda:</strong><p>${escapeHtml(ticket.descricao)}</p></div>
    ${ticket.retorno_usuario ? `<div class="ticket-detail-box"><strong>Retorno do usuário:</strong><p>${escapeHtml(ticket.retorno_usuario)}</p></div>` : ''}
    ${ticket.resposta ? `<div class="ticket-detail-box"><strong>Resposta enviada:</strong><p>${escapeHtml(ticket.resposta)}</p></div>` : ''}
  `);

  setHtml('modalTicketBody', `
    <div class="ticket-detail-row"><strong>Usuario:</strong> ${escapeHtml(ticket.usuario_nome)} (${escapeHtml(ticket.usuario_tipo)})</div>
    <div class="ticket-detail-row"><strong>E-mail:</strong> ${escapeHtml(ticket.usuario_email || 'Nao informado')}</div>
    <div class="ticket-detail-row"><strong>Status:</strong> ${statusLabels[ticket.status_ticket] || 'Aberto'}</div>
    ${historyHtml}
  `);

  const isClosed = ticket.status_ticket === 'fechado';
  document.getElementById('ticketResponseText').disabled = isClosed;
  ticketResponseForm.querySelector('button[type="submit"]').disabled = isClosed;
  closeTicketBtn.disabled = isClosed || ticket.status_ticket === 'aguardando_usuario';

  document.getElementById('supportTicketModal').classList.add('open');
}

function closeTicketModal() {
  document.getElementById('supportTicketModal').classList.remove('open');
  currentTicketId = null;
}

async function submitTicketResponse(event) {
  event.preventDefault();
  const idTicket = Number(document.getElementById('modalTicketInputId').value || currentTicketId);
  const resposta = document.getElementById('ticketResponseText').value.trim();

  if (!idTicket || !resposta) {
    showToast('Informe a resposta antes de enviar.');
    return;
  }

  await postTicketAction('../php/respond_support_ticket.php', { id_ticket: idTicket, resposta }, 'Resposta enviada. O ticket está aguardando o usuário.');
}

async function closeCurrentTicket() {
  const idTicket = Number(document.getElementById('modalTicketInputId').value || currentTicketId);
  if (!idTicket) return;
  if (!confirm('Fechar este ticket agora?')) return;

  await postTicketAction('../php/close_support_ticket.php', { id_ticket: idTicket }, 'Ticket fechado.');
}

async function submitChatReply(event) {
  event.preventDefault();
  const resposta = document.getElementById('messageInput').value.trim();
  if (!currentChatTicketId || !resposta) return;

  const ok = await postTicketAction('../php/respond_support_ticket.php', { id_ticket: currentChatTicketId, resposta }, 'Resposta enviada. O ticket está aguardando o usuário.');
  if (ok) document.getElementById('messageInput').value = '';
}

async function postTicketAction(url, payload, successMessage) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Não foi possível atualizar o ticket.');
    }

    showToast(successMessage);
    closeTicketModal();
    await loadSupportTickets();
    return true;
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error);
    showToast(error.message || 'Erro ao atualizar ticket.');
    return false;
  }
}

function renderDataList(id, rows) {
  if (!rows.length) {
    setHtml(id, emptyStateHtml('fa-chart-simple', 'Sem dados', 'Não há registros suficientes para calcular esta seção.'));
    return;
  }

  setHtml(id, rows.map(([label, value]) => `
    <div class="data-list__row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `).join(''));
}

function calculateStats(tickets) {
  return tickets.reduce((acc, ticket) => {
    const status = ticket.status_ticket || 'aberto';
    if (status === 'aberto') acc.abertos++;
    if (status === 'em_atendimento') acc.em_atendimento++;
    if (status === 'aguardando_usuario') acc.aguardando_usuario++;
    if (status === 'fechado') acc.fechados++;
    acc.total++;
    return acc;
  }, { abertos: 0, em_atendimento: 0, aguardando_usuario: 0, fechados: 0, total: 0 });
}

function calculateAverageResolution(tickets) {
  const durations = tickets
    .filter(ticket => ticket.status_ticket === 'fechado' && ticket.data_criacao && ticket.data_fechamento)
    .map(ticket => new Date(String(ticket.data_fechamento).replace(' ', 'T')) - new Date(String(ticket.data_criacao).replace(' ', 'T')))
    .filter(duration => Number.isFinite(duration) && duration >= 0);

  if (!durations.length) return '';

  const avgMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  const totalMinutes = Math.round(avgMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item) || 'Não informado';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function activityStatusClass(status) {
  if (status === 'fechado') return 'activity-item__status--resolved';
  if (status === 'aguardando_usuario') return 'activity-item__status--active';
  return 'activity-item__status--urgent';
}

function emptyActivity(title, meta) {
  return `
    <div class="activity-item glass">
      <div class="activity-item__icon"><i class="fa-solid fa-circle-info"></i></div>
      <div class="activity-item__content">
        <div class="activity-item__title">${escapeHtml(title)}</div>
        <div class="activity-item__meta">${escapeHtml(meta)}</div>
      </div>
    </div>
  `;
}

function loadingActivity(text) {
  return emptyActivity(text, 'Aguarde enquanto os dados são consultados.');
}

function loadingCard(text) {
  return `<div class="ticket-card glass"><div class="ticket-card__content"><p>${escapeHtml(text)}</p></div></div>`;
}

function emptyStateHtml(icon, title, text) {
  return `
    <div class="empty-state">
      <i class="fa-solid ${icon}"></i>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function getInitials(name) {
  return String(name || 'Suporte')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return 'Sem data';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateOnly(value) {
  if (!value) return 'Sem data';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return date.toLocaleDateString('pt-BR');
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(String(value).replace(' ', 'T'));
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-page');
    if (page) goPage(page);
  });
});

burgerBtn.addEventListener('click', openSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);
logoutBtn.addEventListener('click', () => {
  window.location.href = '../php/logout.php';
});
if (ticketResponseForm) ticketResponseForm.addEventListener('submit', submitTicketResponse);
if (closeTicketBtn) closeTicketBtn.addEventListener('click', closeCurrentTicket);
if (chatReplyForm) chatReplyForm.addEventListener('submit', submitChatReply);
if (searchInput) searchInput.addEventListener('input', renderSupportTickets);

document.addEventListener('DOMContentLoaded', () => {
  goPage('dashboard');
  loadSupportProfileData();
  loadSupportTickets();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeSidebar();
    closeTicketModal();
  }

  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    searchInput?.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 700) closeSidebar();
});
