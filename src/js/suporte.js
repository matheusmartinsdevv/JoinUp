// =========================================
// SUPORTE.JS - Central de Suporte
// =========================================

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const burgerBtn = document.getElementById('burgerBtn');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const toast = document.getElementById('toast');
const logoutBtn = document.getElementById('logoutBtn');

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

let currentSupportUser = null;
let allTickets = [];

async function loadSupportData() {
  try {
    const response = await fetch('../php/get_suporte_data.php');
    const result = await response.json();
    if (result.sucesso) {
      currentSupportUser = result;
      // Update sidebar
      const nameEl = document.querySelector('.sidebar__user .user-name');
      const tagEl = document.querySelector('.sidebar__user .user-tag');
      const avatarEl = document.querySelector('.sidebar__user .user-avatar');
      
      if (nameEl) nameEl.textContent = result.nome;
      if (tagEl) tagEl.textContent = result.email;
      if (avatarEl) {
        avatarEl.textContent = result.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      }

      // Preencher form de perfil
      const nameInput = document.querySelector('#page-profile input[placeholder="Seu nome completo"]');
      const emailInput = document.querySelector('#page-profile input[placeholder="seu.email@exemplo.com"]');
      if (nameInput) nameInput.value = result.nome;
      if (emailInput) emailInput.value = result.email;
    } else {
      window.location.href = 'loginSuporte.html';
    }
  } catch (error) {
    console.error('Erro ao carregar dados do suporte:', error);
  }
}

async function loadTickets() {
  const container = document.getElementById('ticketsListContainer');
  if (!container) return;

  try {
    const response = await fetch('../php/tickets.php');
    const result = await response.json();

    if (result.success) {
      allTickets = result.tickets || [];
      renderTickets(allTickets);
      updateDashboardStats(allTickets);
    } else {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px;">Erro ao carregar tickets: ${result.error}</p>`;
    }
  } catch (error) {
    console.error('Erro ao carregar tickets:', error);
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Erro ao conectar com o servidor.</p>';
  }
}

function updateDashboardStats(tickets) {
  const openCount = tickets.filter(t => !t.id_usuario_suporte).length;
  const inProgressCount = tickets.filter(t => t.id_usuario_suporte).length;

  const abertosEl = document.getElementById('statsAbertos');
  const emAndamentoEl = document.getElementById('statsEmAndamento');

  if (abertosEl) abertosEl.textContent = openCount;
  if (emAndamentoEl) emAndamentoEl.textContent = inProgressCount;

  // Render recent activity on dashboard
  const activityContainer = document.getElementById('activityListContainer');
  if (activityContainer) {
    if (tickets.length === 0) {
      activityContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:20px;text-align:center;">Nenhum ticket recente.</p>';
      return;
    }

    const recentTickets = tickets.slice(0, 5); // top 5 recent
    activityContainer.innerHTML = recentTickets.map(t => {
      const isAssigned = !!t.id_usuario_suporte;
      const statusText = isAssigned ? `Atendido por ${escapeHtml(t.suporte_nome)}` : 'Em Aberto';
      const statusClass = isAssigned ? 'activity-item__status--resolved' : 'activity-item__status--urgent';
      
      return `
        <div class="activity-item glass">
          <div class="activity-item__icon">🎫</div>
          <div class="activity-item__content">
            <div class="activity-item__title">${escapeHtml(t.titulo)}</div>
            <div class="activity-item__meta">Por ${escapeHtml(t.participante_nome || (t.organizador_nome ? t.organizador_nome + ' (Org)' : 'Usuário'))} • #${t.id_ticket}</div>
          </div>
          <span class="activity-item__status ${statusClass}">${statusText}</span>
        </div>
      `;
    }).join('');
  }
}

function renderTickets(tickets) {
  const container = document.getElementById('ticketsListContainer');
  if (!container) return;

  if (tickets.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Nenhum ticket encontrado. 😢</p>';
    return;
  }

  container.innerHTML = tickets.map(t => {
    const isAssigned = !!t.id_usuario_suporte;
    const isAssignedToMe = isAssigned && currentSupportUser && Number(t.id_usuario_suporte) === Number(currentSupportUser.id);
    
    let statusText = 'Em Aberto';
    let statusClass = 'ticket-card__status--urgent';
    let actionsHtml = '';

    if (isAssigned) {
      if (isAssignedToMe) {
        statusText = 'Comigo (Em Atendimento)';
        statusClass = 'ticket-card__status--normal';
        actionsHtml = `
          <button class="btn btn--primary btn--sm" onclick="respondTicket(${t.id_ticket})">💬 Responder</button>
        `;
      } else {
        statusText = `Atendido por ${escapeHtml(t.suporte_nome)}`;
        statusClass = 'ticket-card__status--high';
        actionsHtml = `<span style="font-size:0.8rem;color:var(--text-muted);">Em andamento</span>`;
      }
    } else {
      actionsHtml = `
        <button class="btn btn--primary btn--sm" onclick="associateTicket(${t.id_ticket})">⚡ Associar-se</button>
      `;
    }

    return `
      <div class="ticket-card glass" onclick="openTicket(${t.id_ticket})">
        <div class="ticket-card__header">
          <div class="ticket-card__info">
            <div class="ticket-card__id">Ticket #${t.id_ticket}</div>
            <h3 class="ticket-card__title">${escapeHtml(t.titulo)}</h3>
            <div class="ticket-card__user">Por: <strong>${escapeHtml(t.participante_nome || (t.organizador_nome ? t.organizador_nome + ' (Organizador)' : 'Usuário'))}</strong> (${escapeHtml(t.participante_email || t.organizador_email || '')})</div>
          </div>
          <span class="ticket-card__status ${statusClass}">${statusText}</span>
        </div>
        <div class="ticket-card__content">
          <p>${escapeHtml(t.descricao || 'Sem descrição.')}</p>
        </div>
        <div class="ticket-card__footer">
          <span class="ticket-card__meta">JoinUp Atendimento</span>
          <div class="ticket-card__actions" onclick="event.stopPropagation()">
            ${actionsHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function associateTicket(idTicket) {
  try {
    const response = await fetch('../php/tickets.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_ticket: idTicket, action: 'associate' })
    });
    const result = await response.json();
    if (result.success) {
      showToast(result.message || 'Ticket associado com sucesso!');
      loadTickets();
    } else {
      showToast('❌ Erro: ' + result.error, '⚠️');
    }
  } catch (error) {
    console.error('Erro ao associar ticket:', error);
    showToast('❌ Erro na conexão.', '⚠️');
  }
}

function filterTickets(status) {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');

  let filtered = allTickets;
  if (status === 'open') {
    filtered = allTickets.filter(t => !t.id_usuario_suporte);
  } else if (status === 'progress') {
    filtered = allTickets.filter(t => t.id_usuario_suporte);
  }
  
  renderTickets(filtered);
  showToast(`Filtrando tickets: ${status}`, '🎫');
}

function openTicket(ticketId) {
  showToast(`Abrindo ticket #${ticketId}`, '🎫');
}

function respondTicket(ticketId) {
  showToast(`Respondendo ticket #${ticketId}`, '💬');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =========================================
// CHAT MANAGEMENT
// =========================================

function selectChat(user) {
  // Update active chat
  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');

  showToast(`Chat com ${user}`, '💬');
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message) return;

  // Add message to chat (simulated)
  const messagesContainer = document.getElementById('chatMessages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message sent';
  messageElement.innerHTML = `
    <div class="message__content">${message}</div>
    <div class="message__time">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
  `;

  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Clear input
  input.value = '';

  // Simulate response after 2 seconds
  setTimeout(() => {
    const responseElement = document.createElement('div');
    responseElement.className = 'message received';
    responseElement.innerHTML = `
      <div class="message__content">Obrigado pela resposta! Vou verificar isso para você.</div>
      <div class="message__time">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    messagesContainer.appendChild(responseElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 2000);
}

function closeChat() {
  showToast('Chat fechado', '✕');
}

// =========================================
// EVENT LISTENERS
// =========================================

// Navigation
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-page');
    goPage(page);
  });
});

// Sidebar
burgerBtn.addEventListener('click', openSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Logout
logoutBtn.addEventListener('click', () => {
  showToast('Até logo! 👋', '👋');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1500);
});

// Chat input
document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// =========================================
// INITIALIZATION
// =========================================

document.addEventListener('DOMContentLoaded', () => {
  // Start on dashboard
  goPage('dashboard');

  // Load Support & Tickets
  loadSupportData();
  loadTickets();

  // Welcome message
  setTimeout(() => {
    showToast('Bem-vindo à Central de Suporte!', '🎫');
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

  // Ctrl/Cmd + Enter to send message (when in chat)
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const activePage = document.querySelector('.page.active');
    if (activePage.id === 'page-chat') {
      sendMessage();
    }
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