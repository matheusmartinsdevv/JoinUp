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

// =========================================
// TICKETS MANAGEMENT
// =========================================

function filterTickets(status) {
  // Update filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');

  // Filter tickets (simulated)
  showToast(`Filtrando tickets: ${status}`, '🎫');
}

function openTicket(ticketId) {
  showToast(`Abrindo ticket #${ticketId}`, '🎫');
  // In a real app, this would open a modal or navigate to ticket detail
}

function respondTicket(ticketId) {
  showToast(`Respondendo ticket #${ticketId}`, '💬');
  // In a real app, this would open a response modal
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

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  if (query) {
    showToast(`Buscando por "${query}"...`, '🔍');
  }
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

  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
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