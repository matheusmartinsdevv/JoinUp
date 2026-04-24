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
// EVENT CREATION
// =========================================

function createEvent() {
  // Basic validation
  const eventName = document.querySelector('#page-create input[placeholder*="Nome do Evento"]').value;
  const eventDate = document.querySelector('#page-create input[type="date"]').value;
  const eventLocation = document.querySelector('#page-create input[placeholder*="Local"]').value;
  const eventCity = document.querySelector('#page-create input[placeholder*="Cidade"]').value;
  const eventDescription = document.querySelector('#page-create textarea').value;

  if (!eventName || !eventDate || !eventLocation || !eventCity || !eventDescription) {
    showToast('Preencha todos os campos obrigatórios!', '⚠️');
    return;
  }

  // Simulate event creation
  showToast('Evento criado com sucesso! 🎉', '🎪');

  // Reset form and go back to dashboard
  setTimeout(() => {
    document.querySelectorAll('#page-create input, #page-create textarea').forEach(el => el.value = '');
    goPage('dashboard');
  }, 1500);
}

// =========================================
// TICKET TYPES MANAGEMENT
// =========================================

function addTicketType() {
  const ticketTypes = document.querySelector('.ticket-types');
  const ticketType = document.createElement('div');
  ticketType.className = 'ticket-type';
  ticketType.innerHTML = `
    <div class="ticket-type__header">
      <span class="ticket-type__name">Novo Tipo</span>
      <button class="btn btn--ghost btn--xs" onclick="removeTicketType(this)">✕</button>
    </div>
    <div class="ticket-type__fields">
      <div class="form-group">
        <label>Preço (R$)</label>
        <input type="number" placeholder="120" />
      </div>
      <div class="form-group">
        <label>Quantidade</label>
        <input type="number" placeholder="1000" />
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

document.addEventListener('DOMContentLoaded', () => {
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