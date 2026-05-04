/* =========================================
   INITIALIZATION & AJAX
========================================= */
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  loadEvents();
});

async function loadUserData() {
  try {
    const response = await fetch('../php/get_user_data.php');
    const user = await response.json();

    if (user.error) {
      window.location.href = 'loginParticipante.html';
      return;
    }

    const initials = user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = user.nome;
    document.getElementById('userTag').textContent = '@' + user.nome.toLowerCase().replace(/\s/g, '');

    // Atualiza também no perfil
    const profileAvatars = document.querySelectorAll('.profile-avatar, .composer__avatar');
    profileAvatars.forEach(av => av.textContent = initials);
    const profileNames = document.querySelectorAll('.profile-name, .post__name');
    profileNames.forEach(name => {
      if (name.textContent === "João Carlos") name.textContent = user.nome;
    });

  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
  }
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
      const bgCard = cores[evento.genero_nome] || 'linear-gradient(135deg,#312e81,#4f46e5)';
      const participantes = (evento.total_participantes || 0) > 0 ? `+${evento.total_participantes}` : '0';
      const artistasTxt = (evento.artistas && evento.artistas.length > 0) ? evento.artistas.join(', ') : 'Atrações a confirmar';

      // Sanitização segura (evita erro se algum campo vier null)
      const cleanName = (evento.evento_nome || '').replace(/'/g, "\\'");
      const cleanDesc = (evento.descricao || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
      const cleanLoc = (evento.localizacao || '').replace(/'/g, "\\'");
      const cleanCity = (evento.cidade || '').replace(/'/g, "\\'");
      const cleanUF = (evento.estado || '').replace(/'/g, "\\'");
      const cleanArtistas = artistasTxt.replace(/'/g, "\\'");

      return `
        <div class="event-card" onclick="showEventModal('${cleanName}','${evento.data_formatada}','${evento.preco_formatado}','🎵','${evento.total_participantes || 0}','${cleanDesc}','${cleanLoc}','${cleanArtistas}','${cleanCity}','${cleanUF}')">
          <div class="event-card__img" style="background:${bgCard}">✨
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

/* =========================================
   MODALS
========================================= */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showEventModal(name, date, price, icon, going, description, location, attractions, city, uf) {
  document.getElementById('eventModalContent').innerHTML = `
    <!-- Banner do evento -->
    <div class="event-modal__banner">
      <div class="event-modal__icon">${icon}</div>
      <div class="event-modal__title">${name}</div>
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

    <!-- CTA de compra e comunidade -->
    <div class="event-modal__cta-section">
      <div class="event-modal__community-banner">
        <span>🎟 Compre para participar da comunidade!</span>
      </div>
      <button class="btn btn--primary btn--large" onclick="closeModal('eventModal');showToast('🎟 Abrindo compra segura...')">Comprar ingresso — ${price}</button>
      <p class="event-modal__footer-text">✅ Transação verificada · 🔒 Pagamento protegido · 📱 Ingresso no seu celular</p>
    </div>
  `;
  openModal('eventModal');
}

function openSellModal() { openModal('sellModal'); }

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
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
