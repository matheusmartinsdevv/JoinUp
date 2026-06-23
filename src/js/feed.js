/* =========================================
   INITIALIZATION & AJAX
========================================= */
document.addEventListener('DOMContentLoaded', () => {
  initSocialComposer();
  loadUserData();
  loadEvents();
  loadSocialFeed();
  loadMyTickets();
  loadResaleListings();
  loadCommunities();
  loadMySupportTickets();
  initChatListeners();
  updateParticipantOverview();
});

const purchaseState = {
  eventId: null,
  ticketTypes: []
};
let currentSellTicket = null;
let mySupportTickets = [];
let allEvents = [];
let selectedSearchEventId = null;
let currentUser = null;
let currentUserInitials = 'JU';
let availableCommunities = [];
let socialPosts = [];
let myTicketsTotal = 0;

function updateParticipantOverview() {
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  };

  const firstName = String(currentUser?.nome || '').trim().split(/\s+/)[0];
  const greeting = document.getElementById('overviewGreeting');
  if (greeting) {
    greeting.textContent = firstName ? `Olá, ${firstName}` : 'Bem-vindo ao JoinUp';
  }

  setText('overviewEventsCount', allEvents.length);
  setText('overviewTicketsCount', myTicketsTotal);
  setText('overviewCommunitiesCount', availableCommunities.length);
  setText('overviewPostsCount', socialPosts.length);
  renderSocialDiscoveryStrip();
}

function renderSocialDiscoveryStrip() {
  const container = document.getElementById('socialDiscoveryItems');
  if (!container) return;

  const items = [];

  availableCommunities.slice(0, 4).forEach(community => {
    items.push({
      icon: 'fa-users',
      image: getCommunityVisualUrl(community, Number(community.id_comunidade) || items.length),
      label: normalizeCommunityName(community.nome),
      action: `openCommunityChat(${Number(community.id_comunidade)}, ${Number(community.id_evento)}, '${escapeJsString(community.nome || 'Comunidade')}')`
    });
  });

  allEvents.slice(0, 4).forEach(evento => {
    items.push({
      icon: 'fa-calendar-days',
      image: getEventVisualUrl(evento, Number(evento.id_evento) || items.length),
      label: escapeHtml(evento.evento_nome || 'Evento'),
      action: `selectSearchResult(${Number(evento.id_evento)})`
    });
  });

  if (!items.length) {
    container.innerHTML = `
      <button class="discovery-pill" type="button" onclick="goPage('events')">
        <span><i class="fa-solid fa-compass"></i></span>
        Explorar eventos
      </button>
      <button class="discovery-pill" type="button" onclick="goPage('groups')">
        <span><i class="fa-solid fa-users"></i></span>
        Comunidades
      </button>
      <button class="discovery-pill" type="button" onclick="goPage('resale')">
        <span><i class="fa-solid fa-rotate"></i></span>
        Revenda segura
      </button>
    `;
    return;
  }

  container.innerHTML = items.slice(0, 7).map(item => `
    <button class="discovery-pill" type="button" onclick="${item.action}">
      <span class="discovery-pill__media">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : `<i class="fa-solid ${item.icon}"></i>`}
      </span>
      <span class="discovery-pill__label">${item.label}</span>
    </button>
  `).join('');
}

function getInitials(name) {
  const safeName = String(name || 'JoinUp').trim();
  return safeName
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'JU';
}

async function loadUserData() {
  try {
    const response = await fetch('../php/get_user_data.php');
    const user = await response.json();

    if (user.error) {
      console.warn('Usuário não autenticado, redirecionando...');
      window.location.href = 'loginParticipante.html';
      return;
    }

    // --- Atualizar Sidebar ---
   // const telefone = user.telefone || 'Telefone não informado'; ERIC PROVA
    const nome = user.nome || 'Usuário';
    const email = user.email || 'participante@joinup.com';
    const initials = getInitials(nome);
    currentUser = user;
    currentUserInitials = initials;
    updateParticipantOverview();
    
    if (document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = initials;
    if (document.getElementById('userName')) document.getElementById('userName').textContent = nome;
    if (document.getElementById('userTag')) document.getElementById('userTag').textContent = email;
    if (document.getElementById('composerAvatar')) document.getElementById('composerAvatar').textContent = initials;
    if (document.getElementById('commentAvatar')) document.getElementById('commentAvatar').textContent = initials;

    // --- Atualizar Página de Perfil ---
    const profileAvatar = document.querySelector('.profile-avatar');
    if (profileAvatar) profileAvatar.textContent = initials;

    const profileName = document.querySelector('.profile-name');
    if (profileName) profileName.textContent = nome;
    const profileBio = document.getElementById('profileBio');
    if (profileBio) profileBio.textContent = email;

    // Preencher campos de edição
    if (document.getElementById('editNome')) document.getElementById('editNome').value = nome;
    if (document.getElementById('editEmail')) document.getElementById('editEmail').value = email;
    // if (document.getElementById('variavel_prova')) document.getElementById('variavel_prova').textContent = telefone;

    // Carregar postagens do usuário
    loadMyPosts(nome, initials);
  } catch (error) {
    console.error('Falha crítica ao carregar dados:', error);
  }
}

function normalizeCommunityName(rawName) {
  const name = String(rawName || '').trim();
  if (!name) return 'Desconhecida';
  return escapeHtml(name.replace(/^Comunidade:\s*/i, '').trim() || 'Desconhecida');
}

async function loadMyPosts(userName, initials) {
  const container = document.getElementById('minhasPostagensContainer');
  if (!container) return;

  try {
    const response = await fetch('../php/get_minhas_postagens.php');
    const result = await response.json();

    if (result.success && result.data.length > 0) {
      const profilePostsCount = document.getElementById('profilePostsCount');
      if (profilePostsCount) profilePostsCount.textContent = String(result.data.length);

      container.innerHTML = result.data.map(post => `
        <div class="post glass">
          <div class="post__header">
            <div class="post__avatar">${initials}</div>
            <div>
              <div class="post__name">${userName}</div>
              <span class="post__community-tag">Comunidade: ${normalizeCommunityName(post.comunidade_nome)}</span>
            </div>
          </div>
          <p class="post__body">${escapeHtml(post.descricao || '')}</p>
          ${post.imagem ? `<img src="${escapeHtml(normalizeUploadUrl(post.imagem))}" class="post__photo" alt="Imagem da publicação">` : ''}
        </div>
      `).join('');
    } else {
      const profilePostsCount = document.getElementById('profilePostsCount');
      if (profilePostsCount) profilePostsCount.textContent = '0';
      container.innerHTML = `<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Você ainda não fez nenhuma postagem.</p>`;
    }
  } catch (error) {
    console.error('Erro ao carregar postagens:', error);
    container.innerHTML = `<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Erro ao carregar postagens.</p>`;
  }
}

function normalizeUploadUrl(fileName) {
  const value = String(fileName || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('../')) {
    return value;
  }
  return `../uploads/${value}`;
}

const landingVisualsByGenre = {
  'Rock': 'rock-stage.jpg',
  'Pop': 'lolla-crowd.jpg',
  'Eletrônica': 'festival-neon.jpg',
  'Eletronica': 'festival-neon.jpg',
  'Funk': 'crowd-dancing.jpg',
  'Pagode': 'crowd-dancing.jpg',
  'Sertanejo': 'lolla-crowd.jpg',
  'Trap': 'ultra-festival.jpg',
  'Rap': 'ultra-festival.jpg',
  'MPB': 'vip-smartphone.jpg',
  'Indie': 'lolla-crowd.jpg'
};
const landingFallbackVisuals = [
  'festival-neon.jpg',
  'rock-stage.jpg',
  'ultra-festival.jpg',
  'lolla-crowd.jpg',
  'crowd-dancing.jpg',
  'vip-smartphone.jpg'
];

function landingAssetUrl(fileName) {
  return `../assets/images/landing/${fileName}`;
}

function getLandingFallbackVisual(seed = 0) {
  const index = Math.abs(Number(seed) || 0) % landingFallbackVisuals.length;
  return landingAssetUrl(landingFallbackVisuals[index]);
}

function getEventVisualUrl(evento = {}, seed = 0) {
  if (evento.imagem) return normalizeUploadUrl(evento.imagem);
  const genreImage = landingVisualsByGenre[String(evento.genero_nome || '').trim()];
  return genreImage ? landingAssetUrl(genreImage) : getLandingFallbackVisual(seed);
}

function getCommunityVisualUrl(community = {}, seed = 0) {
  if (community.imagem) return normalizeUploadUrl(community.imagem);
  return getLandingFallbackVisual(seed || community.id_evento || community.id_comunidade || 0);
}

function initSocialComposer() {
  const input = document.getElementById('composerInput');
  const imageInput = document.getElementById('composerImageInput');
  const commentsForm = document.getElementById('commentsForm');

  if (input) {
    input.addEventListener('input', updateComposerCounter);
    updateComposerCounter();
  }

  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const name = imageInput.files?.[0]?.name || '';
      const label = document.getElementById('composerImageName');
      if (label) label.textContent = name ? name.substring(0, 34) : '';
    });
  }

  if (commentsForm) {
    commentsForm.addEventListener('submit', submitComment);
  }
}

function updateComposerCounter() {
  const input = document.getElementById('composerInput');
  const counter = document.getElementById('composerCounter');
  if (!input || !counter) return;
  counter.textContent = `${input.value.length}/500`;
}

async function loadSocialFeed() {
  const container = document.getElementById('socialFeed');
  if (container) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 24px;">Carregando publicações...</p>';
  }

  try {
    const response = await fetch('../php/social.php?action=feed');
    const result = await response.json();

    if (response.status === 401) {
      window.location.href = 'loginParticipante.html';
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao carregar publicações.');
    }

    socialPosts = Array.isArray(result.posts) ? result.posts : [];
    updateParticipantOverview();
    if (result.user && !currentUser) {
      currentUser = result.user;
      currentUserInitials = getInitials(result.user.nome);
      updateParticipantOverview();
    }

    renderSocialFeed();
    renderNotifications();
    updateProfileStats();
    renderSearchResults(searchInput?.value.trim() || '');
  } catch (error) {
    console.error('Erro ao carregar feed social:', error);
    if (container) {
      container.innerHTML = '<div class="post glass empty-state">Não foi possível carregar as publicações agora.</div>';
    }
  }
}

function renderSocialFeed() {
  const container = document.getElementById('socialFeed');
  if (!container) return;

  if (!socialPosts.length) {
    container.innerHTML = `
      <div class="post glass empty-state">
        <i class="fa-solid fa-comments"></i>
        <strong>Ainda sem publicações</strong>
        <span>Publique em uma comunidade liberada ou participe de um evento para movimentar seu feed.</span>
        <button class="btn btn--ghost btn--sm" onclick="goPage('groups')">Ver comunidades</button>
      </div>
    `;
    return;
  }

  container.innerHTML = socialPosts.map(renderSocialPost).join('');
}

function renderSocialPost(post) {
  const id = Number(post.id_postagem) || 0;
  const author = escapeHtml(post.autor_nome || 'Participante');
  const initials = getInitials(post.autor_nome);
  const community = normalizeCommunityName(post.comunidade_nome || 'Comunidade');
  const eventName = escapeHtml(post.evento_nome || '');
  const city = escapeHtml(post.cidade || '');
  const state = escapeHtml(post.estado || '');
  const local = city || state ? `${city}${state ? `, ${state}` : ''}` : '';
  const text = escapeHtml(post.descricao || '').replace(/\n/g, '<br>');
  const imageUrl = normalizeUploadUrl(post.imagem);
  const comments = Number(post.total_comentarios) || 0;
  const likes = Number(post.total_curtidas ?? post.curtidas) || 0;
  const liked = post.curtido_por_mim === true || post.curtido_por_mim === 1 || post.curtido_por_mim === '1';
  const mineTag = post.is_mine ? '<span class="post__community-tag">Seu post</span>' : '';

  return `
    <div class="post glass social-post" data-post-id="${id}">
      <div class="post__header">
        <div class="post__avatar">${initials}</div>
        <div>
          <div class="post__name">${author}</div>
          <span class="post__community-tag">${community}</span>
          ${eventName ? `<span class="post__event-tag">${eventName}</span>` : ''}
          ${mineTag}
        </div>
        <span class="post__time">${escapeHtml(post.data_formatada || 'agora')}</span>
      </div>
      <p class="post__body">${text || 'Publicação sem texto.'}</p>
      ${imageUrl ? `<img class="post__photo" src="${escapeHtml(imageUrl)}" alt="Imagem da publicação">` : ''}
      ${local ? `<div class="post__meta-line"><i class="fa-solid fa-location-dot"></i> ${local}</div>` : ''}
      <div class="post__actions">
        <button class="post-action ${liked ? 'liked' : ''}" data-liked="${liked ? '1' : '0'}" onclick="togglePostLike(${id}, this)">
          <i class="fa-solid fa-heart"></i> <span>${likes}</span>
        </button>
        <button class="post-action" onclick="openComments(${id})">
          <i class="fa-solid fa-comments"></i> <span>${comments}</span>
        </button>
        <button class="post-action" onclick="sharePost(${id})">
          <i class="fa-solid fa-share-nodes"></i> Compartilhar
        </button>
        <button class="post-action post-action--cta" onclick="openCommunityFromPost(${id})">
          <i class="fa-solid fa-users"></i> Comunidade
        </button>
      </div>
    </div>
  `;
}

async function publishPost() {
  const input = document.getElementById('composerInput');
  const communitySelect = document.getElementById('composerCommunity');
  const imageInput = document.getElementById('composerImageInput');
  const button = document.getElementById('publishPostBtn');

  const text = input?.value.trim() || '';
  const idComunidade = Number(communitySelect?.value || 0);
  const file = imageInput?.files?.[0] || null;

  if (!idComunidade) {
    showToast('Escolha uma comunidade para publicar.', 'fa-triangle-exclamation');
    return;
  }
  if (!text && !file) {
    showToast('Escreva algo ou selecione uma imagem.', 'fa-triangle-exclamation');
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = 'Publicando...';
  }

  try {
    const formData = new FormData();
    formData.append('action', 'create');
    formData.append('id_comunidade', idComunidade);
    formData.append('descricao', text);
    if (file) formData.append('imagem', file);

    const response = await fetch('../php/social.php', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao publicar.');
    }

    if (input) {
      input.value = '';
      input.style.minHeight = '48px';
    }
    if (imageInput) imageInput.value = '';
    const imageName = document.getElementById('composerImageName');
    if (imageName) imageName.textContent = '';
    updateComposerCounter();
    showToast('Post publicado!', 'fa-circle-check');
    await loadSocialFeed();
    if (currentUser) {
      loadMyPosts(currentUser.nome || 'Usuário', currentUserInitials);
    }
  } catch (error) {
    console.error('Erro ao publicar:', error);
    showToast(error.message || 'Erro ao publicar.', 'fa-triangle-exclamation');
  } finally {
    if (button) {
      button.disabled = availableCommunities.length === 0;
      button.textContent = 'Publicar';
    }
  }
}

async function togglePostLike(postId, btn) {
  if (!postId || !btn) return;
  btn.disabled = true;

  try {
    const response = await fetch('../php/social.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', id_postagem: postId })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Não foi possível curtir.');
    }

    btn.classList.toggle('liked', !!result.liked);
    btn.dataset.liked = result.liked ? '1' : '0';
    const count = btn.querySelector('span');
    if (count) count.textContent = String(result.total_curtidas || 0);

    const post = socialPosts.find(item => Number(item.id_postagem) === Number(postId));
    if (post) {
      post.curtido_por_mim = !!result.liked;
      post.total_curtidas = Number(result.total_curtidas) || 0;
      post.curtidas = Number(result.total_curtidas) || 0;
    }
    renderNotifications();
  } catch (error) {
    console.error('Erro ao curtir:', error);
    showToast(error.message || 'Erro ao curtir postagem.', 'fa-triangle-exclamation');
  } finally {
    btn.disabled = false;
  }
}

async function openComments(postId) {
  const id = Number(postId) || 0;
  if (!id) return;

  const post = socialPosts.find(item => Number(item.id_postagem) === id);
  const title = document.getElementById('commentsModalTitle');
  const hidden = document.getElementById('commentsPostId');
  const list = document.getElementById('commentsList');
  const input = document.getElementById('commentInput');

  if (title) title.innerHTML = `<i class="fa-solid fa-comments"></i> ${escapeHtml(post?.evento_nome || 'Comentários')}`;
  if (hidden) hidden.value = String(id);
  if (input) input.value = '';
  if (list) list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:12px 0;">Carregando comentários...</p>';
  openModal('commentsModal');

  try {
    const response = await fetch(`../php/social.php?action=comments&id_postagem=${encodeURIComponent(id)}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao carregar comentários.');
    }
    renderComments(result.comments || []);
  } catch (error) {
    console.error('Erro ao carregar comentários:', error);
    if (list) list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:12px 0;">Não foi possível carregar os comentários.</p>';
  }
}

function renderComments(comments) {
  const list = document.getElementById('commentsList');
  if (!list) return;

  if (!comments.length) {
    list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:12px 0;">Nenhum comentário ainda.</p>';
    return;
  }

  list.innerHTML = comments.map(comment => `
    <div class="notif" style="padding:10px 0;">
      <div class="notif__av">${getInitials(comment.autor_nome)}</div>
      <div class="notif__body">
        <div class="notif__text"><strong>${escapeHtml(comment.autor_nome || 'Participante')}</strong> - ${escapeHtml(comment.texto || '')}</div>
        <div class="notif__time">${escapeHtml(comment.data_formatada || '')}</div>
      </div>
    </div>
  `).join('');
}

async function submitComment(event) {
  event.preventDefault();
  const postId = Number(document.getElementById('commentsPostId')?.value || 0);
  const input = document.getElementById('commentInput');
  const text = input?.value.trim() || '';

  if (!postId || !text) {
    showToast('Escreva um comentário antes de enviar.', 'fa-triangle-exclamation');
    return;
  }

  try {
    const response = await fetch('../php/social.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comment', id_postagem: postId, texto: text })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao enviar comentário.');
    }

    input.value = '';
    const post = socialPosts.find(item => Number(item.id_postagem) === postId);
    if (post) post.total_comentarios = (Number(post.total_comentarios) || 0) + 1;
    renderSocialFeed();
    renderNotifications();
    await openComments(postId);
  } catch (error) {
    console.error('Erro ao comentar:', error);
    showToast(error.message || 'Erro ao enviar comentário.', 'fa-triangle-exclamation');
  }
}

function sharePost(postId) {
  const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link da publicação copiado.', 'fa-share-nodes'))
      .catch(() => showToast('Publicação pronta para compartilhar.', 'fa-share-nodes'));
    return;
  }
  showToast('Publicação pronta para compartilhar.', 'fa-share-nodes');
}

function openCommunityFromPost(postId) {
  const post = socialPosts.find(item => Number(item.id_postagem) === Number(postId));
  if (!post) {
    goPage('groups');
    return;
  }

  const community = availableCommunities.find(item => Number(item.id_comunidade) === Number(post.id_comunidade));
  if (!community) {
    goPage('groups');
    return;
  }

  openCommunityChat(Number(community.id_comunidade), Number(community.id_evento), community.nome || 'Comunidade');
}

function renderComposerCommunities() {
  const select = document.getElementById('composerCommunity');
  const button = document.getElementById('publishPostBtn');
  if (!select) return;

  if (!availableCommunities.length) {
    select.innerHTML = '<option value="">Nenhuma comunidade liberada</option>';
    select.disabled = true;
    if (button) button.disabled = true;
    return;
  }

  select.disabled = false;
  if (button) button.disabled = false;
  select.innerHTML = availableCommunities.map(c =>
    `<option value="${Number(c.id_comunidade)}">${normalizeCommunityName(c.nome)} · ${escapeHtml(c.nome_evento || 'Evento')}</option>`
  ).join('');
}

function renderCommunityWidget() {
  const container = document.getElementById('communityWidgetList');
  if (!container) return;

  if (!availableCommunities.length) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem;">Nenhuma comunidade liberada.</p>';
    return;
  }

  container.innerHTML = availableCommunities.slice(0, 4).map(c => {
    const name = escapeJsString(c.nome || 'Comunidade');
    const imageUrl = getCommunityVisualUrl(c, Number(c.id_comunidade) || 0);
    return `
      <div class="widget-event" onclick="openCommunityChat(${Number(c.id_comunidade)}, ${Number(c.id_evento)}, '${name}')">
        <div class="widget-event__icon widget-event__icon--image">
          <img src="${escapeHtml(imageUrl)}" alt="">
        </div>
        <div>
          <div class="widget-event__name">${normalizeCommunityName(c.nome)}</div>
          <div class="widget-event__date">${escapeHtml(c.total_membros || 0)} membros</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderUpcomingEventsWidget() {
  const container = document.getElementById('upcomingEventsWidget');
  if (!container) return;

  const upcoming = allEvents.slice(0, 4);
  if (!upcoming.length) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem;">Nenhum evento encontrado.</p>';
    return;
  }

  container.innerHTML = upcoming.map(evento => `
    <div class="widget-event" onclick="selectSearchResult(${Number(evento.id_evento)})">
      <div class="widget-event__icon widget-event__icon--image">
        <img src="${escapeHtml(getEventVisualUrl(evento, Number(evento.id_evento) || 0))}" alt="">
      </div>
      <div>
        <div class="widget-event__name">${escapeHtml(evento.evento_nome || 'Evento')}</div>
        <div class="widget-event__date">${escapeHtml(evento.data_formatada || '')}</div>
      </div>
      <span class="widget-event__badge">${escapeHtml(evento.estado || '')}</span>
    </div>
  `).join('');
}

function renderMessagesPreview() {
  const container = document.getElementById('messagesList');
  const badge = document.getElementById('messagesBadge');
  if (!container) return;

  if (badge) {
    badge.style.display = availableCommunities.length ? 'inline-block' : 'none';
    badge.textContent = String(availableCommunities.length);
  }

  if (!availableCommunities.length) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:16px;">Nenhuma conversa liberada.</p>';
    return;
  }

  container.innerHTML = availableCommunities.map(c => {
    const name = escapeJsString(c.nome || 'Comunidade');
    return `
      <div class="notif" onclick="openCommunityChat(${Number(c.id_comunidade)}, ${Number(c.id_evento)}, '${name}')">
        <div class="notif__av"><i class="fa-solid fa-users"></i><div class="online-dot"></div></div>
        <div class="notif__body">
          <div class="notif__text"><strong>${normalizeCommunityName(c.nome)}</strong> - ${escapeHtml(c.nome_evento || 'Evento')}</div>
          <div class="notif__time">${escapeHtml(c.total_membros || 0)} membros</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderNotifications() {
  const container = document.getElementById('notificationsList');
  const badge = document.getElementById('notificationsBadge');
  const dot = document.getElementById('topbarNotifDot');
  if (!container) return;

  const items = [];
  const ownPostsWithComments = socialPosts
    .filter(post => post.is_mine && Number(post.total_comentarios) > 0)
    .slice(0, 3);

  ownPostsWithComments.forEach(post => {
    items.push({
      icon: 'fa-comments',
      text: `<strong>${Number(post.total_comentarios)} comentário${Number(post.total_comentarios) === 1 ? '' : 's'}</strong> em sua publicação de ${normalizeCommunityName(post.comunidade_nome)}.`,
      time: post.data_formatada || 'recentemente',
      action: `openComments(${Number(post.id_postagem)})`,
      unread: true
    });
  });

  if (availableCommunities.length) {
    items.push({
      icon: 'fa-users',
      text: `Você tem <strong>${availableCommunities.length}</strong> comunidade${availableCommunities.length === 1 ? '' : 's'} liberada${availableCommunities.length === 1 ? '' : 's'}.`,
      time: 'Agora',
      action: "goPage('groups')",
      unread: true
    });
  }

  if (myTicketsTotal > 0) {
    items.push({
      icon: 'fa-ticket',
      text: `<strong>${myTicketsTotal}</strong> ingresso${myTicketsTotal === 1 ? '' : 's'} ativo${myTicketsTotal === 1 ? '' : 's'} no seu perfil.`,
      time: 'Atualizado',
      action: "goPage('my-events')",
      unread: false
    });
  }

  const nextEvent = allEvents[0];
  if (nextEvent) {
    items.push({
      icon: 'fa-calendar-days',
      text: `<strong>${escapeHtml(nextEvent.evento_nome || 'Evento')}</strong> está disponível em Explorar Eventos.`,
      time: escapeHtml(nextEvent.data_formatada || ''),
      action: `selectSearchResult(${Number(nextEvent.id_evento)})`,
      unread: false
    });
  }

  const unreadCount = items.filter(item => item.unread).length;
  if (badge) {
    badge.style.display = unreadCount ? 'inline-block' : 'none';
    badge.textContent = String(unreadCount);
  }
  if (dot) dot.style.display = unreadCount ? 'block' : 'none';

  if (!items.length) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:16px;">Nada novo por enquanto.</p>';
    return;
  }

  container.innerHTML = items.slice(0, 8).map(item => `
    <div class="notif ${item.unread ? 'unread' : ''}" onclick="${item.action}">
      <div class="notif__av"><i class="fa-solid ${item.icon}"></i></div>
      <div class="notif__body">
        <div class="notif__text">${item.text}</div>
        <div class="notif__time">${item.time}</div>
      </div>
      ${item.unread ? '<div class="notif__dot"></div>' : ''}
    </div>
  `).join('');
}

function updateProfileStats() {
  const profilePostsCount = document.getElementById('profilePostsCount');
  const profileCommunitiesCount = document.getElementById('profileCommunitiesCount');
  const profileTicketsCount = document.getElementById('profileTicketsCount');
  const profileTags = document.getElementById('profileTags');

  if (profilePostsCount && currentUser) {
    const myPosts = socialPosts.filter(post => Number(post.id_participante) === Number(currentUser.id_participante));
    profilePostsCount.textContent = String(myPosts.length);
  }
  if (profileCommunitiesCount) profileCommunitiesCount.textContent = String(availableCommunities.length);
  if (profileTicketsCount) profileTicketsCount.textContent = String(myTicketsTotal);

  if (profileTags) {
    const tags = availableCommunities.slice(0, 3).map(c => `<span class="profile-tag">${normalizeCommunityName(c.nome)}</span>`);
    profileTags.innerHTML = tags.length ? tags.join('') : '<span class="profile-tag">Explorador</span>';
  }
}

function setMyTicketsBadge(totalTickets) {
  // Badge com total de ingressos do participante.
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

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  throw new Error(`Resposta inválida do servidor: ${text}`);
}

async function loadMyTickets() {
  // Carrega os ingressos comprados para a tela "Meus Ingressos".
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
    myTicketsTotal = 0;
    setMyTicketsBadge(0);
    updateProfileStats();
    renderNotifications();
    updateParticipantOverview();
    container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Erro ao carregar seus ingressos.</p>';
  }
}

function renderMyTickets(tickets) {
  // Monta a lista de cards com status e ações por ingresso.
  const container = document.getElementById('myTicketsList');
  if (!container) return;

  if (!tickets.length) {
    myTicketsTotal = 0;
    setMyTicketsBadge(0);
    updateProfileStats();
    renderNotifications();
    updateParticipantOverview();
    container.innerHTML = `
      <div class="ticket glass empty-state">
        <i class="fa-solid fa-ticket"></i>
        <strong>Você ainda não comprou ingressos</strong>
        <span>Explore eventos para liberar comunidades e acompanhar tudo pelo JoinUp.</span>
        <button class="btn btn--primary btn--sm" onclick="goPage('events')">Explorar eventos</button>
      </div>
    `;
    return;
  }

  const totalTickets = tickets.reduce((acc, ticket) => acc + (Number(ticket.quantidade) || 0), 0);
  myTicketsTotal = totalTickets;
  setMyTicketsBadge(totalTickets);
  updateProfileStats();
  renderNotifications();
  updateParticipantOverview();

  container.innerHTML = tickets.map(ticket => {
    const quantidade = Math.max(1, Number(ticket.quantidade) || 1);
    const quantidadeLabel = quantidade > 1 ? ` · ${quantidade} ingressos` : '';
    const statusClass = ticket.status_class === 'ticket__status--active' ? 'ticket__status--active' : 'ticket__status--past';
    const statusLabel = escapeHtml(ticket.status_label || 'Encerrado');
    const eventoNome = escapeHtml(ticket.evento_nome || 'Evento');
    const nomeTipo = escapeHtml(ticket.nome_tipo || 'Ingresso');
    const valorFormatado = escapeHtml(ticket.valor_formatado || 'R$ 0,00');
    const cidade = escapeHtml(ticket.cidade || '');
    const estado = escapeHtml(ticket.estado || '');
    const data = escapeHtml(ticket.evento_data_formatada || '');
    const local = cidade && estado ? `${cidade}, ${estado}` : 'Local a confirmar';
    const isAtivo = ticket.status === 'ativo' && !ticket.passado;
    const quantidadeDisponivelRevenda = Math.max(0, Number(ticket.quantidade_disponivel_revenda) || 0);
    const quantidadeEmRevenda = Math.max(0, Number(ticket.quantidade_em_revenda) || 0);
    const revendaStatusLabel = quantidadeEmRevenda > 0
      ? ` · ${quantidadeEmRevenda} em revenda`
      : '';

    const sellButton = isAtivo && quantidadeDisponivelRevenda > 0
      ? `<button class="btn btn--ghost btn--sm" onclick="openSellModal(${Number(ticket.id_evento || 0)}, ${Number(ticket.id_tipo_ingresso || 0)}, '${escapeJsString(eventoNome)}', '${escapeJsString(nomeTipo)}', '${escapeJsString(valorFormatado)}', ${quantidadeDisponivelRevenda})">Revenda</button>`
      : '';

    const actions = isAtivo
      ? `${sellButton}
         <button class="btn btn--primary btn--sm" onclick="goPage('groups')">Comunidade</button>`
      : `<button class="btn btn--ghost btn--sm" onclick="goPage('groups')">Ver memórias</button>`;

    return `
      <div class="ticket glass">
        <div class="ticket__icon"><i class="fa-solid fa-ticket"></i></div>
        <div class="ticket__info">
          <div class="ticket__name">${eventoNome}</div>
          <div class="ticket__meta"><i class="fa-solid fa-calendar-days"></i> ${data} · <i class="fa-solid fa-location-dot"></i> ${local} · ${nomeTipo}${quantidadeLabel}</div>
          <div class="ticket__meta" style="margin-top:8px; font-size:0.85rem; color:var(--text-muted);">Valor original: ${valorFormatado}${revendaStatusLabel}</div>
        </div>
        <span class="ticket__status ${statusClass}">${statusLabel}</span>
        <div class="ticket__actions">
          ${actions}
        </div>
      </div>
    `;
  }).join('');
}

function formatBrl(value) {
  const amount = Number(value) || 0;
  return `R$ ${amount.toFixed(2).replace('.', ',')}`;
}

function updateSellModalHints() {
  const quantityInput = document.getElementById('sellTicketQuantity');
  const priceInput = document.getElementById('sellTicketPrice');
  const quantityHint = document.getElementById('sellTicketQuantityHint');
  const priceHint = document.getElementById('sellTicketPriceHint');
  const maxQuantidade = Math.max(1, Number(currentSellTicket?.quantidade_disponivel) || 1);
  const quantidade = Math.min(
    maxQuantidade,
    Math.max(1, Number(quantityInput?.value || 1))
  );
  const valorTotal = Number(priceInput?.value || 0);

  if (quantityHint) {
    quantityHint.textContent = maxQuantidade > 1
      ? `${maxQuantidade} ingressos disponíveis para revenda`
      : '1 ingresso disponível para revenda';
  }

  if (priceHint) {
    if (valorTotal > 0 && quantidade > 1) {
      priceHint.textContent = `${formatBrl(valorTotal / quantidade)} por ingresso (${quantidade} un.)`;
    } else if (valorTotal > 0) {
      priceHint.textContent = `${formatBrl(valorTotal)} por ingresso`;
    } else {
      priceHint.textContent = quantidade > 1
        ? 'O valor informado será dividido igualmente entre os ingressos.'
        : '';
    }
  }
}

function bindSellModalInputs() {
  const quantityInput = document.getElementById('sellTicketQuantity');
  const priceInput = document.getElementById('sellTicketPrice');

  if (quantityInput && !quantityInput.dataset.bound) {
    quantityInput.addEventListener('input', updateSellModalHints);
    quantityInput.dataset.bound = '1';
  }
  if (priceInput && !priceInput.dataset.bound) {
    priceInput.addEventListener('input', updateSellModalHints);
    priceInput.dataset.bound = '1';
  }
}

function openSellModal(idEvento, idTipoIngresso, eventoNome, nomeTipo, valorFormatado, quantidadeDisponivel) {
  const maxQuantidade = Math.max(1, Number(quantidadeDisponivel) || 1);

  currentSellTicket = {
    id_evento: Number(idEvento) || 0,
    id_tipo_ingresso: Number(idTipoIngresso) || 0,
    quantidade_disponivel: maxQuantidade,
    evento_nome: String(eventoNome || ''),
    nome_tipo: String(nomeTipo || ''),
    valor_formatado: String(valorFormatado || '')
  };

  const quantityInput = document.getElementById('sellTicketQuantity');
  const priceInput = document.getElementById('sellTicketPrice');

  document.getElementById('sellEventName').value = currentSellTicket.evento_nome;
  document.getElementById('sellTicketType').value = currentSellTicket.nome_tipo;
  document.getElementById('sellTicketPrice').value = '';
  document.getElementById('sellTicketMessage').value = '';

  if (quantityInput) {
    quantityInput.min = '1';
    quantityInput.max = String(maxQuantidade);
    quantityInput.value = '1';
  }

  bindSellModalInputs();
  updateSellModalHints();

  document.getElementById('publishResaleBtn').disabled = false;
  openModal('sellModal');
}

async function publishResaleListing() {
  const priceInput = document.getElementById('sellTicketPrice');
  const messageInput = document.getElementById('sellTicketMessage');
  const quantityInput = document.getElementById('sellTicketQuantity');
  const button = document.getElementById('publishResaleBtn');

  if (!currentSellTicket || !currentSellTicket.id_evento || !currentSellTicket.id_tipo_ingresso) {
    showToast('Selecione um ingresso válido para revender.', 'fa-triangle-exclamation');
    return;
  }

  const maxQuantidade = Math.max(1, Number(currentSellTicket.quantidade_disponivel) || 1);
  const quantidade = Math.min(
    maxQuantidade,
    Math.max(1, Number(quantityInput?.value || 1))
  );

  const valorRevendaTotal = Number(priceInput.value || 0);
  if (valorRevendaTotal <= 0) {
    showToast('Informe o preço total da revenda.', 'fa-triangle-exclamation');
    return;
  }

  button.disabled = true;
  button.textContent = 'Publicando...';

  try {
    const response = await fetch('../php/create_revenda_anuncio.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_evento: currentSellTicket.id_evento,
        id_tipo_ingresso: currentSellTicket.id_tipo_ingresso,
        quantidade,
        valor_revenda_total: valorRevendaTotal,
        mensagem: messageInput.value.trim()
      })
    });

    const result = await parseJsonResponse(response);
    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || 'Falha ao publicar anúncio.');
    }

    showToast(result.message || 'Anúncio de revenda publicado com sucesso!', 'fa-circle-check');
    closeModal('sellModal');
    loadResaleListings();
    loadMyTickets();
  } catch (error) {
    console.error('Erro ao publicar anúncio de revenda:', error);
    showToast(error.message || 'Erro ao publicar anúncio.', 'fa-triangle-exclamation');
  } finally {
    button.disabled = false;
    button.textContent = 'Publicar anúncio';
  }
}

async function loadResaleListings() {
  const container = document.getElementById('resaleTicketsList');
  if (!container) return;
  container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Carregando anúncios de revenda...</p>';

  try {
    const response = await fetch('../php/get_revenda_anuncios.php');
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao carregar anúncios de revenda.');
    }

    renderResaleListings(Array.isArray(result.data) ? result.data : []);
  } catch (error) {
    console.error('Erro ao carregar anúncios de revenda:', error);
    container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem; padding: 20px; text-align: center;">Não foi possível carregar os anúncios de revenda.</p>';
  }
}

function groupResaleListings(listings) {
  const groups = new Map();

  listings.forEach(ad => {
    const key = [
      ad.id_evento,
      ad.nome_tipo,
      ad.vendedor_nome,
      Number(ad.valor_revenda).toFixed(2),
      ad.evento_data_formatada,
      ad.cidade,
      ad.estado
    ].join('|');

    if (!groups.has(key)) {
      groups.set(key, {
        ...ad,
        quantidade: 1,
        ids: [Number(ad.id_revenda_anuncios)]
      });
      return;
    }

    const group = groups.get(key);
    group.quantidade += 1;
    group.ids.push(Number(ad.id_revenda_anuncios));
  });

  return Array.from(groups.values());
}

function renderResaleListings(listings) {
  const container = document.getElementById('resaleTicketsList');
  if (!container) return;

  if (!listings.length) {
    container.innerHTML = `
      <div class="ticket glass empty-state">
        <i class="fa-solid fa-rotate"></i>
        <strong>Nenhum ingresso em revenda agora</strong>
        <span>Quando participantes anunciarem ingressos, eles aparecerão aqui com compra segura.</span>
        <button class="btn btn--ghost btn--sm" onclick="goPage('events')">Ver eventos disponíveis</button>
      </div>
    `;
    return;
  }

  const grouped = groupResaleListings(listings);

  container.innerHTML = grouped.map(ad => {
    const eventoNome = escapeHtml(ad.evento_nome || 'Evento');
    const nomeTipo = escapeHtml(ad.nome_tipo || 'Ingresso');
    const valorUnitario = formatBrl(ad.valor_revenda);
    const quantidade = Math.max(1, Number(ad.quantidade) || 1);
    const quantidadeLabel = quantidade > 1 ? `${quantidade}x ` : '';
    const precoLabel = quantidade > 1
      ? `${quantidadeLabel}${escapeHtml(valorUnitario)} <span style="font-size:0.75rem;opacity:0.85;">cada</span>`
      : escapeHtml(valorUnitario);
    const data = escapeHtml(ad.evento_data_formatada || '');
    const local = escapeHtml(ad.cidade || '') + (ad.estado ? `, ${escapeHtml(ad.estado)}` : '');
    const vendedor = escapeHtml(ad.vendedor_nome || 'Participante');
    const disponibilidade = quantidade > 1 ? ` · ${quantidade} disponíveis` : '';
    const firstListingId = Number(ad.ids[0] || ad.id_revenda_anuncios);

    return `
      <div class="ticket glass">
        <div class="ticket__icon"><i class="fa-solid fa-ticket"></i></div>
        <div class="ticket__info">
          <div class="ticket__name">${eventoNome}</div>
          <div class="ticket__meta"><i class="fa-solid fa-calendar-days"></i> ${data} · <i class="fa-solid fa-location-dot"></i> ${local} · ${nomeTipo}${disponibilidade}</div>
          <div class="ticket__meta" style="margin-top:8px; font-size:0.85rem; color:var(--text-muted);">Vendedor: ${vendedor}</div>
        </div>
        <span class="ticket__status ticket__status--active">${precoLabel}</span>
        <div class="ticket__actions">
          <button class="btn btn--primary btn--sm" onclick="buyResaleTicket(${firstListingId})">Comprar</button>
        </div>
      </div>
    `;
  }).join('');
}

async function buyResaleTicket(idRevenda) {
  if (!idRevenda) {
    showToast('Anúncio inválido.', 'fa-triangle-exclamation');
    return;
  }

  if (!confirm('Deseja comprar este ingresso de revenda?')) return;

  try {
    const response = await fetch('../php/comprar_ingresso_revenda.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_revenda_anuncios: idRevenda })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || 'Falha ao comprar ingresso de revenda.');
    }

    showToast('Ingresso comprado com sucesso!', 'fa-circle-check');
    loadResaleListings();
    loadMyTickets();
  } catch (error) {
    console.error('Erro ao comprar ingresso de revenda:', error);
    showToast(error.message || 'Erro ao completar a compra.', 'fa-triangle-exclamation');
  }
}

async function loadEvents() {
  const grid = document.getElementById('eventsGrid');
  try {
    const response = await fetch('../php/get_explorar_eventos.php');
    const eventos = await response.json();
    allEvents = Array.isArray(eventos) ? eventos : [];
    updateParticipantOverview();

    if (!allEvents.length) {
      if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Nenhum evento encontrado no momento. <i class="fa-solid fa-face-frown"></i></p>';
      renderFeedEvents([]);
      renderUpcomingEventsWidget();
      renderNotifications();
      renderSearchResults(searchInput?.value.trim() || '');
      return;
    }

    renderFeedEvents(allEvents);
    renderUpcomingEventsWidget();
    renderNotifications();
    renderSearchResults(searchInput?.value.trim() || '');

    const cores = {
      'Rock': 'linear-gradient(135deg,#1e1b4b,#4338ca)',
      'Pop': 'linear-gradient(135deg,#be185d,#db2777)',
      'Sertanejo': 'linear-gradient(135deg,#166534,#15803d)',
      'Eletrônica': 'linear-gradient(135deg,#4c1d95,#6d28d9)',
      'Funk': 'linear-gradient(135deg,#991b1b,#b91c1c)',
      'Pagode': 'linear-gradient(135deg,#854d0e,#a16207)'
    };

    if (grid) {
      grid.innerHTML = eventos.map(evento => {
        const eventId = Number(evento.id_evento) || 0;
        const bgCard = cores[evento.genero_nome] || 'linear-gradient(135deg,#312e81,#4f46e5)';
        const participantes = (evento.total_participantes || 0) > 0 ? `+${evento.total_participantes}` : '0';
        const artistasTxt = (evento.artistas && evento.artistas.length > 0) ? evento.artistas.join(', ') : 'Atrações a confirmar';

        const imagemUrl = getEventVisualUrl(evento, eventId);
        const imgStyle = imagemUrl ? `background-image:url('${imagemUrl}'); background-size:cover; background-position:center;` : `background:${bgCard}`;
        const iconOrImg = imagemUrl ? '' : '<i class="fa-solid fa-sparkles"></i>';
        const imagemParam = imagemUrl ? `'${imagemUrl}'` : 'null';

        // Sanitização segura (evita erro se algum campo vier null)
        const cleanName = (evento.evento_nome || '').replace(/'/g, "\\'");
        const cleanDesc = (evento.descricao || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
        const cleanLoc = (evento.localizacao || '').replace(/'/g, "\\'");
        const cleanCity = (evento.cidade || '').replace(/'/g, "\\'");
        const cleanUF = (evento.estado || '').replace(/'/g, "\\'");
        const cleanArtistas = artistasTxt.replace(/'/g, "\\'");

        return `
          <div class="event-card" data-event-id="${eventId}" onclick="showEventModal(${eventId},'${cleanName}','${evento.data_formatada}','${evento.preco_formatado}','fa-music','${evento.total_participantes || 0}','${cleanDesc}','${cleanLoc}','${cleanArtistas}','${cleanCity}','${cleanUF}', ${imagemParam})">
            <div class="event-card__img" style="${imgStyle}">${iconOrImg}
              <div class="event-card__img-overlay"></div>
              <span class="event-card__tag"><i class="fa-solid fa-thumbtack"></i> ${evento.genero_nome || 'Evento'}</span>
              <span class="event-card__going-count">${participantes} vão</span>
            </div>
            <div class="event-card__body">
              <div class="event-card__title">${evento.evento_nome || 'Sem nome'}</div>
              <div class="event-card__meta"><i class="fa-solid fa-calendar-days"></i> ${evento.data_formatada || ''}</div>
              <div class="event-card__footer">
                <span class="event-card__price">A partir de <strong>${evento.preco_formatado || 'Grátis'}</strong></span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Erro ao carregar eventos. Tente novamente mais tarde.</p>';
    renderUpcomingEventsWidget();
    renderNotifications();
  }
}

function renderFeedEvents(eventos) {
  const feedContainer = document.getElementById('feedEventos');
  if (!feedContainer) return;

  if (!eventos || eventos.length === 0) {
    feedContainer.innerHTML = `
      <div class="post glass empty-state">
        <i class="fa-solid fa-calendar-days"></i>
        <strong>Nenhum evento no feed</strong>
        <span>Assim que organizadores publicarem eventos, eles aparecem aqui em destaque.</span>
      </div>
    `;
    return;
  }

  feedContainer.innerHTML = eventos.map(evento => {
    const eventId = Number(evento.id_evento) || 0;
    const participantes = (evento.total_participantes || 0) > 0 ? `+${evento.total_participantes}` : '0';
    const artistasTxt = (evento.artistas && evento.artistas.length > 0) ? evento.artistas.join(', ') : 'Atrações a confirmar';

    const imagemUrl = getEventVisualUrl(evento, eventId);
    const imagemParam = imagemUrl ? `'${imagemUrl}'` : 'null';

    const cleanName = (evento.evento_nome || '').replace(/'/g, "\\'");
    const cleanDesc = (evento.descricao || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
    const cleanLoc = (evento.localizacao || '').replace(/'/g, "\\'");
    const cleanCity = (evento.cidade || '').replace(/'/g, "\\'");
    const cleanUF = (evento.estado || '').replace(/'/g, "\\'");
    const cleanArtistas = artistasTxt.replace(/'/g, "\\'");

    return `
      <div class="post glass post--event-card">
        <div class="post__header">
          <div class="post__avatar post__avatar--brand">
            <i class="fa-solid fa-bullhorn"></i>
          </div>
          <div>
            <div class="post__name">JoinUp Oficial</div>
            <span class="post__event-tag">${evento.genero_nome || 'Evento'}</span>
          </div>
          <span class="post__time">Postado recentemente</span>
        </div>

        <div class="event-feed-card">
          <img class="event-feed-card__media" src="${escapeHtml(imagemUrl)}" alt="Imagem do evento ${escapeHtml(evento.evento_nome || 'JoinUp')}" loading="lazy">
          <div class="event-feed-card__content">
            <span class="event-feed-card__eyebrow">${escapeHtml(evento.data_formatada || '')} · ${escapeHtml(evento.cidade || 'Cidade')}${evento.estado ? `, ${escapeHtml(evento.estado)}` : ''}</span>
            <strong>${escapeHtml(evento.evento_nome || 'Sem nome')}</strong>
            <p>${escapeHtml(evento.descricao || 'Sem descrição.')}</p>
            <div class="event-feed-card__meta">
              <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(evento.localizacao || 'A definir')}</span>
              <span><i class="fa-solid fa-users"></i> ${participantes} vão</span>
              <span><i class="fa-solid fa-ticket"></i> ${escapeHtml(evento.preco_formatado || 'Grátis')}</span>
            </div>
          </div>
        </div>

        <div class="post__actions">
          <button class="post-action post-action--cta" type="button" onclick="showEventModal(${eventId},'${cleanName}','${evento.data_formatada}','${evento.preco_formatado}','fa-music','${evento.total_participantes || 0}','${cleanDesc}','${cleanLoc}','${cleanArtistas}','${cleanCity}','${cleanUF}', ${imagemParam})">
            <i class="fa-solid fa-ticket"></i> Comprar ingresso
          </button>
        </div>
      </div>
    `;
  }).join('');
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
  const query = this.value.trim();
  searchDropdown.classList.toggle('open', query.length > 0 || document.activeElement === this);
  renderSearchResults(query);
});

function renderSearchResults(query) {
  if (!searchDropdown) return;
  const normalized = String(query || '').trim().toLowerCase();

  if (!normalized) {
    searchDropdown.innerHTML = `
      <div class="search-result">
        <div class="search-result-info">
          <div class="search-result-name">Digite para buscar eventos</div>
        </div>
      </div>
    `;
    return;
  }

  const eventMatches = allEvents.filter(evento => {
    const artists = Array.isArray(evento.artistas) ? evento.artistas.join(' ') : String(evento.artistas || '');
    const haystack = `${evento.evento_nome || ''} ${evento.genero_nome || ''} ${evento.localizacao || ''} ${evento.cidade || ''} ${evento.estado || ''} ${artists}`.toLowerCase();
    return haystack.includes(normalized);
  }).slice(0, 4);

  const postMatches = socialPosts.filter(post => {
    const haystack = `${post.autor_nome || ''} ${post.descricao || ''} ${post.comunidade_nome || ''} ${post.evento_nome || ''}`.toLowerCase();
    return haystack.includes(normalized);
  }).slice(0, 4);

  if (!eventMatches.length && !postMatches.length) {
    searchDropdown.innerHTML = `
      <div class="search-result">
        <div class="search-result-info">
          <div class="search-result-name">Nenhum resultado encontrado</div>
        </div>
      </div>
    `;
    return;
  }

  const eventHtml = eventMatches.length
    ? `<div class="search-divider">Eventos</div>` + eventMatches.map(evento => {
    const subtitle = `${evento.genero_nome ? evento.genero_nome + ' · ' : ''}${evento.cidade || ''}${evento.estado ? ' · ' + evento.estado : ''}`.trim();
    return `
      <div class="search-result" onclick="selectSearchResult(${Number(evento.id_evento)})">
        <div class="search-result-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <div class="search-result-info">
          <div class="search-result-name">${escapeHtml(evento.evento_nome || 'Evento')}</div>
          <div class="search-result-sub">${escapeHtml(subtitle || 'Evento encontrado')}</div>
        </div>
      </div>
    `;
  }).join('')
    : '';

  const postHtml = postMatches.length
    ? `<div class="search-divider">Publicações</div>` + postMatches.map(post => `
      <div class="search-result" onclick="selectSearchPost(${Number(post.id_postagem)})">
        <div class="search-result-icon"><i class="fa-solid fa-comment"></i></div>
        <div class="search-result-info">
          <div class="search-result-name">${escapeHtml(post.autor_nome || 'Participante')}</div>
          <div class="search-result-sub">${normalizeCommunityName(post.comunidade_nome)} · ${escapeHtml(String(post.descricao || '').slice(0, 48))}</div>
        </div>
      </div>
    `).join('')
    : '';

  searchDropdown.innerHTML = eventHtml + postHtml;
}

function selectSearchResult(eventId) {
  if (!eventId) return;
  selectedSearchEventId = eventId;
  searchDropdown.classList.remove('open');
  searchInput.value = '';
  goPage('events');
  setTimeout(() => highlightEventCard(eventId), 250);
}

function highlightEventCard(eventId) {
  const card = document.querySelector(`.event-card[data-event-id="${eventId}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('event-card--highlighted');
  setTimeout(() => card.classList.remove('event-card--highlighted'), 2600);
}

function selectSearchPost(postId) {
  if (!postId) return;
  searchDropdown.classList.remove('open');
  searchInput.value = '';
  goPage('feed');
  setTimeout(() => highlightSocialPost(postId), 250);
}

function highlightSocialPost(postId) {
  const card = document.querySelector(`.social-post[data-post-id="${postId}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('event-card--highlighted');
  setTimeout(() => card.classList.remove('event-card--highlighted'), 2600);
}

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
      showToast('Preencha título e descrição antes de enviar.', 'fa-triangle-exclamation');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      const response = await fetch('../php/create_ticket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: title, descricao: description, tipo: 'participante' })
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
      showToast('Erro de conexão ao enviar ticket.', 'fa-triangle-exclamation');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar ticket';
    }
  });
}

async function loadMySupportTickets() {
  const container = document.getElementById('mySupportTicketsList');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem;">Carregando seus chamados...</p>';

  try {
    const response = await fetch('../php/get_my_support_tickets.php?tipo=participante');
    const result = await response.json();

    if (response.status === 401) {
      window.location.href = 'loginParticipante.html';
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Falha ao carregar chamados.');
    }

    mySupportTickets = Array.isArray(result.tickets) ? result.tickets : [];
    renderMySupportTickets(mySupportTickets);
  } catch (error) {
    console.error('Erro ao carregar chamados:', error);
    container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem;">Não foi possível carregar seus chamados.</p>';
  }
}

function renderMySupportTickets(tickets) {
  const container = document.getElementById('mySupportTicketsList');
  if (!container) return;

  if (!tickets.length) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem;">Você ainda não abriu chamados.</p>';
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
          <button class="btn btn--primary btn--sm" onclick="resolveSupportTicket(${ticket.id_ticket})">Problema resolvido</button>
          <button class="btn btn--ghost btn--sm" onclick="openSupportTicketConversation(${ticket.id_ticket})">Abrir conversa</button>
        </div>`
      : '';

    return `
      <div class="support-ticket-card">
        <div class="support-ticket-card__header">
          <div>
            <div class="support-ticket-card__id">#${ticket.id_ticket}</div>
            <div class="support-ticket-card__title">${escapeHtml(ticket.titulo)}</div>
          </div>
          <span class="ticket__status ${status === 'fechado' ? 'ticket__status--past' : 'ticket__status--active'}">${supportTicketStatusLabel(status)}</span>
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
    tipo: 'participante'
  }, 'Chamado marcado como resolvido.');
}

function openSupportTicketConversation(ticketId) {
  const ticket = mySupportTickets.find(item => Number(item.id_ticket) === Number(ticketId));
  if (!ticket) {
    showToast('Chamado não encontrado.', 'fa-triangle-exclamation');
    return;
  }

  document.getElementById('supportChatTicketInput').value = ticket.id_ticket;
  document.getElementById('supportChatTicketId').textContent = `Ticket #${ticket.id_ticket}`;
  document.getElementById('supportChatTitle').textContent = ticket.titulo || 'Atendimento';
  document.getElementById('supportChatReply').value = '';

  renderSupportChatMessages(ticket);
  openModal('supportTicketChatModal');
  return;

  const messages = document.getElementById('supportChatMessages');
  const supportResponse = ticket.resposta
    ? `<div class="support-chat__message support-chat__message--support">
        <div class="support-chat__author">Suporte${ticket.suporte_nome ? ` - ${escapeHtml(ticket.suporte_nome)}` : ''}</div>
        <p>${escapeHtml(ticket.resposta)}</p>
      </div>`
    : `<div class="support-chat__message support-chat__message--support">
        <div class="support-chat__author">Suporte</div>
        <p>A equipe ainda não enviou uma resposta para este chamado.</p>
      </div>`;
  const lastReturn = ticket.retorno_usuario
    ? `<div class="support-chat__message support-chat__message--user">
        <div class="support-chat__author">Você</div>
        <p>${escapeHtml(ticket.retorno_usuario)}</p>
      </div>`
    : '';

  messages.innerHTML = `
    <div class="support-chat__message support-chat__message--user">
      <div class="support-chat__author">Você</div>
      <p>${escapeHtml(ticket.descricao || 'Sem descrição.')}</p>
    </div>
    ${supportResponse}
    ${lastReturn}
  `;
  messages.scrollTop = messages.scrollHeight;

  openModal('supportTicketChatModal');
}

async function returnSupportTicket(ticketId, retorno) {
  if (!retorno || !retorno.trim()) return;

  return updateSupportTicketFromUser({
    id_ticket: ticketId,
    action: 'retornar',
    retorno_usuario: retorno.trim(),
    tipo: 'participante'
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

const supportTicketChatForm = document.getElementById('supportTicketChatForm');
if (supportTicketChatForm) {
  supportTicketChatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const ticketId = Number(document.getElementById('supportChatTicketInput').value);
    const replyInput = document.getElementById('supportChatReply');
    const retorno = replyInput.value.trim();

    if (!ticketId || !retorno) {
      showToast('Escreva uma mensagem antes de enviar.', 'fa-triangle-exclamation');
      return;
    }

    const sent = await returnSupportTicket(ticketId, retorno);
    if (sent) {
      const messages = document.getElementById('supportChatMessages');
      messages.insertAdjacentHTML('beforeend', `
        <div class="support-chat__message support-chat__message--user">
          <div class="support-chat__author">Você</div>
          <p>${escapeHtml(retorno)}</p>
        </div>
      `);
      messages.scrollTop = messages.scrollHeight;
      replyInput.value = '';
    }
  });
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
      throw new Error(result.error || 'Não foi possível atualizar o chamado.');
    }

    showToast(successMessage);
    loadMySupportTickets();
    return true;
  } catch (error) {
    console.error('Erro ao atualizar chamado:', error);
    showToast(error.message || 'Erro ao atualizar chamado.', 'fa-triangle-exclamation');
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

function escapeJsString(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function showEventModal(eventId, name, date, price, icon, going, description, location, attractions, city, uf, imagemUrl) {
  purchaseState.eventId = Number(eventId) || null;
  purchaseState.ticketTypes = [];

  const modalIcon = String(icon || '').includes('<i') ? icon : `<i class="fa-solid ${icon || 'fa-music'}"></i>`;
  const bannerContent = imagemUrl 
    ? `<img src="${escapeHtml(imagemUrl)}" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0; z-index:0;" />
       <div class="event-modal__title" style="position:relative; z-index:1; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${name}</div>`
    : `<div class="event-modal__icon">${modalIcon}</div>
       <div class="event-modal__title">${name}</div>`;

  document.getElementById('eventModalContent').innerHTML = `
    <!-- Banner do evento -->
    <div class="event-modal__banner" style="position:relative; overflow:hidden;">
      ${bannerContent}
    </div>

    <!-- Informações principais -->
    <div class="event-modal__info-grid">
      <div class="event-modal__info-item">
        <span class="event-modal__label"><i class="fa-solid fa-calendar-days"></i> Data</span>
        <span class="event-modal__value">${date}</span>
      </div>
      <div class="event-modal__info-item">
        <span class="event-modal__label"><i class="fa-solid fa-money-bill-wave"></i> Valor</span>
        <span class="event-modal__value">${price}</span>
      </div>
      <div class="event-modal__info-item">
        <span class="event-modal__label"><i class="fa-solid fa-users"></i> Participantes</span>
        <span class="event-modal__value">+${going}</span>
      </div>
    </div>

    <!-- Seção de detalhes -->
    <div class="event-modal__section">
      <h3 class="event-modal__section-title"><i class="fa-solid fa-location-dot"></i> Local</h3>
      <p class="event-modal__section-content" id="eventLocation">${location} • ${city}, ${uf}</p>
    </div>

    <div class="event-modal__section">
      <h3 class="event-modal__section-title"><i class="fa-solid fa-microphone"></i> Artistas/Atrações</h3>
      <p class="event-modal__section-content" id="eventAttractions">${attractions}</p>
    </div>

    <div class="event-modal__section">
      <h3 class="event-modal__section-title"><i class="fa-solid fa-circle-info"></i> Sobre o Evento</h3>
      <p class="event-modal__section-content" id="eventDescription">${description}</p>
    </div>

    <div class="event-modal__section">
      <h3 class="event-modal__section-title"><i class="fa-solid fa-ticket"></i> Ingressos</h3>
      <div class="event-modal__section-content" id="ticketPurchaseArea">
        Carregando ingressos...
      </div>
    </div>

    <!-- CTA de compra e comunidade -->
    <div class="event-modal__cta-section">
      <div class="event-modal__community-banner">
        <span><i class="fa-solid fa-ticket"></i> Compre para participar da comunidade!</span>
      </div>
      <button id="buyTicketBtn" class="btn btn--primary btn--large" onclick="buyTicket()" disabled>Carregando ingressos...</button>
      <p class="event-modal__footer-text"><i class="fa-solid fa-circle-check"></i> Transação verificada · <i class="fa-solid fa-lock"></i> Pagamento protegido · <i class="fa-solid fa-mobile-screen-button"></i> Ingresso no seu celular</p>
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
    <div class="results-field-wrap" style="gap:10px;">
      <label class="results-field-wrap">
        <span class="results-field-label">Tipo de ingresso</span>
        <select id="ticketTypeSelect" class="results-field">${options}</select>
      </label>
      <label class="results-field-wrap">
        <span class="results-field-label">Quantidade</span>
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
  btn.textContent = `Comprar ingresso - R$ ${total.toFixed(2).replace('.', ',')}`;
  stockHint.textContent = `${quantidadeDisponivel} disponiveis`;
}

async function buyTicket() {
  const select = document.getElementById('ticketTypeSelect');
  const quantityInput = document.getElementById('ticketQuantityInput');
  const btn = document.getElementById('buyTicketBtn');

  if (!select || !quantityInput || !btn || !purchaseState.eventId) {
    showToast('Ingresso indisponível para este evento', 'fa-triangle-exclamation');
    return;
  }

  const idTipo = Number(select.value);
  const quantidade = Math.max(1, Number(quantityInput.value) || 1);
  if (!idTipo || !quantidade) {
    showToast('Ingresso indisponível para este evento', 'fa-triangle-exclamation');
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
      showToast('Ingresso comprado com sucesso', 'fa-circle-check');
      closeModal('eventModal');
      loadEvents();
      loadMyTickets();
      return;
    }

    if (result.message === 'Ingresso indisponível para este evento') {
      showToast('Ingresso indisponível para este evento', 'fa-triangle-exclamation');
      await loadTicketTypesForEvent(purchaseState.eventId);
      return;
    }

    showToast(result.error || result.message || 'Falha ao concluir compra.', 'fa-triangle-exclamation');
  } catch (error) {
    console.error('Erro ao comprar ingresso:', error);
    showToast('Erro ao processar compra.', 'fa-triangle-exclamation');
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

/* =========================================
   PROFILE ACTIONS
   ========================================= */
async function saveProfile() {
  const btn = document.getElementById('btnSalvarPerfil');
  const nome = document.getElementById('editNome').value.trim();
  const email = document.getElementById('editEmail').value.trim();

  if (!nome || !email) {
    showToast('Nome e E-mail são obrigatórios!', 'fa-triangle-exclamation');
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
      showToast('Perfil atualizado com sucesso!', 'fa-sparkles');
      // Recarregar dados para atualizar UI
      loadUserData();
    } else {
      showToast('Erro: ' + result.error, 'fa-triangle-exclamation');
    }
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    showToast('Erro de conexão com o servidor.', 'fa-triangle-exclamation');
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
function iconMarkup(icon = 'fa-circle-check') {
  if (!icon || icon === ' ') return '';
  if (String(icon).includes('<i')) return icon;
  return `<i class="fa-solid ${icon}"></i>`;
}

function showToast(msg, icon = 'fa-circle-check') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  if (toastIcon) toastIcon.innerHTML = iconMarkup(icon);
  document.getElementById('toastMsg').innerHTML = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* =========================================
   COMMUNITY ACTIONS
   ========================================= */
/* =========================================
   COMMUNITY ACTIONS & CHAT POPUP
   ========================================= */
let activeChatCommunityId = null;
let activeChatEventoId = null;
let chatPollingInterval = null;
let replyingToMessageId = null;

async function loadCommunities() {
  const container = document.getElementById('groupsGridContainer');
  if (!container) return;

  try {
    const response = await fetch('../php/comunidades.php?fetch=1');
    const result = await response.json();

    if (result.success) {
      const minhas = result.minhas || [];
      const explorar = result.explorar || [];
      availableCommunities = minhas.filter(c => Number(c.has_ingresso) === 1);
      renderComposerCommunities();
      renderCommunityWidget();
      renderMessagesPreview();
      renderNotifications();
      updateProfileStats();
      updateParticipantOverview();

      let html = '';

      if (minhas.length === 0 && explorar.length === 0) {
        html = `
          <div class="group-card glass empty-state" style="grid-column: 1/-1;">
            <i class="fa-solid fa-users"></i>
            <strong>Nenhuma comunidade encontrada</strong>
            <span>Compre um ingresso para liberar automaticamente a comunidade do evento.</span>
            <button class="btn btn--primary btn--sm" onclick="goPage('events')">Explorar eventos</button>
          </div>
        `;
      } else {
        // Render Minhas Comunidades (Acessíveis porque tem ingresso)
        minhas.forEach(c => {
          const escapedNome = c.nome.replace(/'/g, "\\'").replace(/"/g, '&quot;');
          const isMembro = Number(c.is_membro) === 1;
          const buttonHtml = isMembro
            ? `<button class="btn btn--ghost btn--sm" style="color: var(--text-muted); border-color: rgba(255,255,255,0.08); margin-right: 6px;" onclick="leaveCommunity(${c.id_comunidade}, this)" title="Sair da comunidade">
                 Sair
               </button>
               <button class="btn btn--primary btn--sm" onclick="openCommunityChat(${c.id_comunidade}, ${c.id_evento}, '${escapedNome}')">
                 <i class="fa-solid fa-comments"></i> Acessar
               </button>`
            : `<button class="btn btn--ghost btn--sm" style="color: var(--purple-l); border-color: var(--border-p);" onclick="joinCommunity(${c.id_comunidade}, this)">
                 <i class="fa-solid fa-arrow-right-to-bracket"></i> Entrar
               </button>`;

          html += `
            <div class="group-card glass">
              <div class="group-card__header">
                <div class="group-card__icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                <div>
                  <div class="group-card__name">${escapeHtml(c.nome)}</div>
                </div>
              </div>
              <p class="group-card__desc">${escapeHtml(c.descricao || 'Participe de encontros e converse com a galera!')}</p>
              <div class="group-card__footer">
                <span class="badge" style="font-size:0.75rem; background:rgba(157,78,221,0.2); padding: 4px 8px; border-radius:12px; margin-right:auto; color: var(--purple-l);">
                  <i class="fa-solid fa-users"></i> ${c.total_membros || 0} membros
                </span>
                ${buttonHtml}
              </div>
            </div>
          `;
        });

        // Render Explorar (Bloqueadas porque NÃO tem ingresso)
        explorar.forEach(c => {
          html += `
            <div class="group-card group-card--locked glass">
              <div class="lock-icon-badge"><i class="fa-solid fa-lock"></i></div>
              <div class="group-card__header">
                <div class="group-card__icon" style="filter: grayscale(100%); opacity: 0.5;"><i class="fa-solid fa-guitar"></i></div>
                <div>
                  <div class="group-card__name" style="color: var(--text-muted);">${escapeHtml(c.nome)}</div>
                </div>
              </div>
              <p class="group-card__desc" style="color: var(--text-muted);">${escapeHtml(c.descricao || 'Compre o ingresso para este evento para liberar a comunidade!')}</p>
              <div class="group-card__footer" style="opacity: 0.5;">
                <span class="badge" style="font-size:0.75rem; background:rgba(255,255,255,0.05); padding: 4px 8px; border-radius:12px; margin-right:auto; color: var(--text-muted);">
                  <i class="fa-solid fa-users"></i> ${c.total_membros || 0} membros
                </span>
                <button class="btn btn--ghost btn--sm" disabled style="cursor: not-allowed; border-color: rgba(255,255,255,0.1); color: var(--text-muted);">
                  <i class="fa-solid fa-lock"></i> Bloqueado
                </button>
              </div>
            </div>
          `;
        });

        // Card dashed "Encontrar mais comunidades"
        html += `
          <div class="group-card glass" style="border-style:dashed;opacity:0.7;cursor:pointer;" onclick="goPage('events')">
            <div class="group-card__header">
              <div class="group-card__icon" style="background:rgba(157,78,221,0.1);border:1px dashed var(--border-p);">+</div>
              <div>
                <div class="group-card__name">Encontrar mais comunidades</div>
              </div>
            </div>
            <p class="group-card__desc">Compre um ingresso ou explore eventos para entrar automaticamente nas comunidades.</p>
            <div class="group-card__footer">
              <button class="btn btn--ghost btn--sm">Explorar eventos</button>
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
    } else {
      availableCommunities = [];
      renderComposerCommunities();
      renderCommunityWidget();
      renderMessagesPreview();
      renderNotifications();
      updateProfileStats();
      updateParticipantOverview();
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Erro ao carregar comunidades: ${result.error}</p>`;
    }
  } catch (e) {
    console.error('Erro ao buscar comunidades:', e);
    availableCommunities = [];
    renderComposerCommunities();
    renderCommunityWidget();
    renderMessagesPreview();
    renderNotifications();
    updateProfileStats();
    updateParticipantOverview();
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Erro de rede ao carregar comunidades.</p>';
  }
}

async function joinCommunity(idComunidade, btn) {
  if (!idComunidade || !btn) return;
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';

  try {
    const response = await fetch('../php/comunidades.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'entrar',
        id_comunidade: idComunidade
      })
    });
    const result = await response.json();
    if (result.success) {
      showToast('Você entrou na comunidade!');
      await loadCommunities();
    } else {
      showToast('Erro ao entrar: ' + result.error, 'fa-triangle-exclamation');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  } catch (err) {
    console.error('Erro ao entrar na comunidade:', err);
    showToast('Erro de rede ao entrar na comunidade.', 'fa-triangle-exclamation');
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

async function leaveCommunity(idComunidade, btn) {
  if (!idComunidade || !btn) return;
  if (!confirm('Tem certeza de que deseja sair desta comunidade?')) return;
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saindo...';

  try {
    const response = await fetch('../php/comunidades.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sair',
        id_comunidade: idComunidade
      })
    });
    const result = await response.json();
    if (result.success) {
      showToast('Você saiu da comunidade.');
      await loadCommunities();
    } else {
      showToast('Erro ao sair: ' + result.error, 'fa-triangle-exclamation');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  } catch (err) {
    console.error('Erro ao sair da comunidade:', err);
    showToast('Erro de rede ao sair da comunidade.', 'fa-triangle-exclamation');
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ─── Funções do Chat Popup ──────────────────────────────────────────────────
function openCommunityChat(idComunidade, idEvento, nomeComunidade) {
  activeChatCommunityId = idComunidade;
  activeChatEventoId = idEvento;
  replyingToMessageId = null;

  document.getElementById('chatModalTitle').innerText = nomeComunidade;
  document.getElementById('chatModalSub').innerText = 'Comunidade Oficial do Evento';
  document.getElementById('chatReplyBar').style.display = 'none';
  document.getElementById('chatInput').value = '';
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
    }
  } catch (err) {
    console.error('Erro de rede ao buscar mensagens:', err);
  }
}

function renderChatMessages(mensagens) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const isAtBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 80;

  if (mensagens.length === 0) {
    container.innerHTML = '<p class="chat-empty" style="text-align:center; color:var(--text-muted); padding:40px;">Nenhuma mensagem ainda. Seja o primeiro a enviar.</p>';
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

    const escapedMsgText = (msg.mensagem || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const escapedAuthorName = msg.autor_nome.replace(/'/g, "\\'").replace(/"/g, '&quot;');

    let messageContent = '';
    if (msg.mensagem) {
      messageContent += `<div class="chat-bubble__text">${escapeHtml(msg.mensagem)}</div>`;
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

    let replyPreview = '';
    if (msg.id_resposta_a) {
      let replyText = msg.resposta_texto ? escapeHtml(msg.resposta_texto) : (msg.resposta_imagem ? 'Imagem' : '');
      replyPreview = `
        <div class="chat-bubble__reply-ref">
          <div class="chat-reply-ref__author"><i class="fa-solid fa-reply"></i> ${escapeHtml(msg.resposta_autor_nome)}:</div>
          <div class="chat-reply-ref__text">${replyText}</div>
        </div>
      `;
    }

    html += `
      <div class="${bubbleClass}" data-id="${msg.id_mensagem}">
        <div class="chat-bubble__header">
          <span class="chat-bubble__author">${escapeHtml(msg.autor_nome)}</span>
          ${badgeHtml}
          <span class="chat-bubble__time">${msg.data_envio}</span>
        </div>
        ${replyPreview}
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
      if (result.debug) {
        console.error('Erro de envio de imagem:', result.debug);
      }
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

