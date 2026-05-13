/* ============================================================
   Navigation
   ============================================================ */
const nav       = document.getElementById('nav');
const hamburger = document.querySelector('.nav__hamburger');
const mobileMenu = document.getElementById('mobileMenu');

// Add .scrolled class when user scrolls past 20px (triggers frosted glass style)
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Mobile menu toggle
hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

/* ============================================================
   Hero — smooth lerp glow + parallax content drift
   ============================================================ */
const heroSection = document.querySelector('.hero');
const heroGlow    = document.getElementById('heroGlow');
const heroContent = document.querySelector('.hero__content');

// Skip all animation if user prefers reduced motion
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (heroSection && heroGlow && !reduceMotion) {
  // Current rendered position (starts at hero centre)
  let gX = heroSection.offsetWidth  / 2;
  let gY = heroSection.offsetHeight / 2;
  // Desired target position
  let tX = gX, tY = gY;
  // Whether the cursor is inside the hero
  let inside = false;

  // rAF loop: smoothly lerps glow toward the cursor at ~7% per frame (~60fps)
  function tick() {
    if (inside) {
      gX += (tX - gX) * 0.07;
      gY += (tY - gY) * 0.07;
      heroGlow.style.left = gX + 'px';
      heroGlow.style.top  = gY + 'px';
    }
    requestAnimationFrame(tick);
  }
  tick();

  // Shared handler for mouse and touch
  function onPointerMove(clientX, clientY) {
    const r = heroSection.getBoundingClientRect();
    tX = clientX - r.left;
    tY = clientY - r.top;
    inside = true;

    // Subtle parallax: text drifts slightly toward the cursor (max ±10px / ±7px)
    if (heroContent) {
      const nx = tX / r.width  - 0.5; // –0.5 → +0.5
      const ny = tY / r.height - 0.5;
      heroContent.style.transform = `translate(${nx * 10}px, ${ny * 7}px)`;
    }
  }

  heroSection.addEventListener('mousemove', e => {
    onPointerMove(e.clientX, e.clientY);
  }, { passive: true });

  // Touch support — single finger drag across hero
  heroSection.addEventListener('touchmove', e => {
    onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // Smoothly return everything to centre when cursor leaves
  heroSection.addEventListener('mouseleave', () => {
    inside = false;
    if (heroContent) heroContent.style.transform = '';
    // Drift glow back to centre
    const r = heroSection.getBoundingClientRect();
    tX = r.width  / 2;
    tY = r.height / 2;
    inside = true; // keep lerping toward centre, then it'll settle
    setTimeout(() => { inside = false; }, 800);
  });
}

/* ============================================================
   Smooth scroll — offset for sticky nav height
   ============================================================ */
const NAV_H = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
) || 68;

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const id     = anchor.getAttribute('href');
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - NAV_H;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ============================================================
   Scroll-triggered reveal animations
   Uses IntersectionObserver — fires each element once.
   ============================================================ */
const revealOpts = { threshold: 0.12, rootMargin: '0px 0px -60px 0px' };

const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    obs.unobserve(entry.target);
  });
}, revealOpts);

document.querySelectorAll('.reveal, .stagger').forEach(el => {
  revealObserver.observe(el);
});

/* ============================================================
   Stat counter animation
   Counts up from 0 to data-target when stats scroll into view.
   ============================================================ */
function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  if (isNaN(target)) return;

  const DURATION = 1400;
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / DURATION, 1);
    // Ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

const statsEl = document.querySelector('.about__stats');
if (statsEl) {
  const statsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.stat__number[data-target]').forEach(animateCount);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  statsObserver.observe(statsEl);
}
