/* =========================================
   INITIALIZATION & AJAX
========================================= */
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  loadEvents();
});

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

      const imagemUrl = evento.imagem ? `../uploads/${evento.imagem}` : null;
      const imgStyle = imagemUrl ? `background-image:url('${imagemUrl}'); background-size:cover; background-position:center;` : `background:${bgCard}`;
      const iconOrImg = imagemUrl ? '' : '✨';

      // Sanitização segura (evita erro se algum campo vier null)
      const cleanName = (evento.evento_nome || '').replace(/'/g, "\\'");
      const cleanDesc = (evento.descricao || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
      const cleanLoc = (evento.localizacao || '').replace(/'/g, "\\'");
      const cleanCity = (evento.cidade || '').replace(/'/g, "\\'");
      const cleanUF = (evento.estado || '').replace(/'/g, "\\'");
      const cleanArtistas = artistasTxt.replace(/'/g, "\\'");

      return `
        <div class="event-card" onclick="showEventModal('${cleanName}','${evento.data_formatada}','${evento.preco_formatado}','🎵','${evento.total_participantes || 0}','${cleanDesc}','${cleanLoc}','${cleanArtistas}','${cleanCity}','${cleanUF}', '${imagemUrl}')">
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

/* =========================================
   MODALS
========================================= */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showEventModal(name, date, price, icon, going, description, location, attractions, city, uf, imagemUrl) {
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
