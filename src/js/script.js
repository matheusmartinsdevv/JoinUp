/* ============================================================
   JoinUp — Script de interações
   ============================================================ */

/* ── Header scroll effect ─────────────────────────────────── */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Burger menu ──────────────────────────────────────────── */
const burger = document.getElementById('burger');
const nav    = document.getElementById('nav');

burger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

nav.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ── Fade-in on scroll (IntersectionObserver) ─────────────── */
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => fadeObserver.observe(el));

/* ── How-it-works tabs ────────────────────────────────────── */
const tabs  = document.querySelectorAll('.how__tab');
const panels = document.querySelectorAll('.how__panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove('how__tab--active'));
    tab.classList.add('how__tab--active');

    panels.forEach(panel => {
      const isTarget = panel.id === `tab-${target}`;
      panel.classList.toggle('how__panel--hidden', !isTarget);
      if (isTarget) {
        // Re-trigger fade-in for steps inside newly visible panel
        panel.querySelectorAll('.fade-in').forEach(el => {
          el.classList.remove('visible');
          setTimeout(() => el.classList.add('visible'), 50);
        });
      }
    });
  });
});

/* ── Search bar interactions ──────────────────────────────── */
const searchBtn = document.querySelector('.search-bar__btn');
const searchInput = document.querySelector('.search-field__input');

searchBtn?.addEventListener('click', () => {
  const query = searchInput?.value.trim();
  if (query) {
    // Placeholder: would redirect to results page
    showToast(`Buscando por "${query}"…`);
  } else {
    searchInput?.focus();
  }
});

document.querySelectorAll('.search-bar__tags .tag').forEach(tag => {
  tag.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = tag.textContent.replace(/^[^\w]+/, '').trim();
      searchInput.focus();
    }
  });
});

/* ── CTA Form ─────────────────────────────────────────────── */
document.getElementById('ctaForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.cta__submit');
  btn.textContent = '✓ Você está dentro do rolê!';
  btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
  btn.disabled = true;
  showToast('Bem-vindo(a) ao JoinUp! 💜');
});

/* ── Feed action buttons ──────────────────────────────────── */
document.querySelectorAll('.feed-action').forEach(btn => {
  btn.addEventListener('click', function () {
    if (this.classList.contains('feed-action--cta')) {
      showToast('Redirecionando para compra segura… 🔒');
      return;
    }
    // Like button animation
    if (this.textContent.startsWith('❤️')) {
      this.style.color = '#f43f5e';
      this.style.borderColor = 'rgba(244,63,94,0.4)';
    }
  });
});

/* ── Live notification dismiss ────────────────────────────── */
const liveNotif = document.getElementById('liveNotif');
liveNotif?.addEventListener('click', () => {
  liveNotif.style.opacity = '0';
  liveNotif.style.transform = 'translateX(-120%)';
  setTimeout(() => liveNotif.remove(), 400);
});

// Rotate live notification messages
const liveMessages = [
  { name: 'Bruna M.', action: 'acabou de postar no', event: 'Festival Neon SP' },
  { name: 'Rafael C.', action: 'entrou no grupo do', event: 'Rock in Rio' },
  { name: 'Isabela T.', action: 'vendeu ingresso no', event: 'Lollapalooza' },
  { name: 'Pedro S.', action: 'está no', event: 'Ultra Music Festival' },
];
let msgIndex = 0;

setInterval(() => {
  if (!document.getElementById('liveNotif')) return;
  msgIndex = (msgIndex + 1) % liveMessages.length;
  const msg = liveMessages[msgIndex];
  const textEl = liveNotif?.querySelector('.live-notif__text');
  if (textEl) {
    textEl.innerHTML = `<strong>${msg.name}</strong> ${msg.action} <span class="text-accent">${msg.event}</span>`;
  }
}, 5000);

/* ── Smooth scroll for anchor links ──────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── Toast notification helper ────────────────────────────── */
function showToast(message) {
  const existing = document.querySelector('.toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    right: 32px;
    background: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(168,85,247,0.9));
    backdrop-filter: blur(20px);
    border: 1px solid rgba(168,85,247,0.4);
    color: white;
    padding: 14px 24px;
    border-radius: 99px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    z-index: 999;
    box-shadow: 0 0 30px rgba(168,85,247,0.4);
    animation: slideInRight 0.4s cubic-bezier(0.4,0,0.2,1) both;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = '0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/* ── Parallax orbs (desktop + throttled) ─────────────────── */
const canUseParallax = window.matchMedia('(min-width: 1025px) and (prefers-reduced-motion: no-preference)').matches;
if (canUseParallax) {
  const orbs = document.querySelectorAll('.orb');
  let rafId = null;

  const updateParallax = () => {
    const scrollY = window.scrollY;
    orbs.forEach((orb, i) => {
      const speed = (i % 2 === 0) ? 0.05 : -0.03;
      orb.style.transform = `translateY(${scrollY * speed}px)`;
    });
    rafId = null;
  };

  window.addEventListener('scroll', () => {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(updateParallax);
  }, { passive: true });
}
