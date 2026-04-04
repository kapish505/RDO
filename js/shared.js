/* ============================================
   shared.js - Shared UI utilities
   Toast, Animations, Navbar, Particles
   ============================================ */

// ── Toast Notifications ──────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
    warning: '⚠'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="dismissToast(this.parentElement)">×</button>
  `;

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.classList.add('toast-exit');
  setTimeout(() => toast.remove(), 300);
}

// ── Navbar Scroll Behavior ───────────────────
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // Mobile menu toggle
  const menuBtn = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.navbar-links');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });
  }

  // Set active link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ── Scroll Reveal Animations ─────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -60px 0px'
  });

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
    observer.observe(el);
  });
}

// ── Animated Particle Background ─────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x     = Math.random() * canvas.width;
      this.y     = Math.random() * canvas.height;
      this.size  = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.pulse = Math.random() * Math.PI * 2;
      // Color: purple or cyan
      this.color = Math.random() > 0.5
        ? `rgba(185, 159, 255, ${this.opacity})`
        : `rgba(129, 236, 255, ${this.opacity * 0.5})`;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += 0.02;

      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.reset();
      }
    }

    draw() {
      const pulsedOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.pulse));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${pulsedOpacity})`);
      ctx.fill();
    }
  }

  function init() {
    particles = Array.from({ length: 80 }, () => new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const alpha = (1 - dist / 100) * 0.08;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(185, 159, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    animationId = requestAnimationFrame(animate);
  }

  resize();
  init();
  animate();

  window.addEventListener('resize', () => {
    resize();
    init();
  });

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });
}

// ── Ripple Effect on buttons ─────────────────
function initRippleEffects() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.add('ripple-container');
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height);

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
      `;

      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ── Copy to Clipboard ────────────────────────
async function copyToClipboard(text, feedbackEl) {
  try {
    await navigator.clipboard.writeText(text);
    if (feedbackEl) {
      const original = feedbackEl.textContent;
      feedbackEl.textContent = '✓';
      setTimeout(() => { feedbackEl.textContent = original; }, 2000);
    }
    showToast('Copied to clipboard!', 'success', 2000);
    return true;
  } catch {
    showToast('Failed to copy.', 'error');
    return false;
  }
}

// ── Format / Utils ───────────────────────────
function formatAddress(addr) {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTxHash(hash) {
  if (!hash) return '—';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function getExplorerUrl(hash, type = 'tx') {
  return `https://sepolia.etherscan.io/${type}/${hash}`;
}

function getExplorerLink(hash, label, type = 'tx') {
  return `<a href="${getExplorerUrl(hash, type)}" target="_blank" rel="noopener" class="text-tertiary" style="font-size:.85rem">${label || formatTxHash(hash)} ↗</a>`;
}

// ── Loading State Manager ────────────────────
class LoadingState {
  constructor(btn, originalContent) {
    this.btn = btn;
    this.originalContent = originalContent || btn.innerHTML;
  }

  start(text = 'Loading...') {
    this.btn.innerHTML = `<div class="spinner"></div> ${text}`;
    this.btn.disabled = true;
    this.btn.classList.add('btn-loading');
  }

  end() {
    this.btn.innerHTML = this.originalContent;
    this.btn.disabled = false;
    this.btn.classList.remove('btn-loading');
  }
}

// ── Number Animation (counter) ───────────────
function animateNumber(el, target, duration = 1000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    const current = Math.floor(eased * (target - start) + start);

    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ── Modal ────────────────────────────────────
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ── Initialize Common UI ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initParticles();

  // Delay ripple init so buttons are rendered
  setTimeout(initRippleEffects, 100);

  // Create toast container if not present
  if (!document.getElementById('toast-container')) {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    document.body.appendChild(tc);
  }

  // Page fade-in
  document.body.classList.add('page-enter');
});
