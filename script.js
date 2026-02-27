/* ─────────────────────────────────────────────────────────────
   Fennel Heads — script.js
   ───────────────────────────────────────────────────────────── */

/* ── Navbar: scroll behaviour & mobile toggle ── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.textContent = isOpen ? '✕' : '☰';
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close mobile menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.textContent = '☰';
    document.body.style.overflow = '';
  });
});

/* ── Hero image subtle ken burns ── */
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  heroBg.addEventListener('load', () => heroBg.classList.add('loaded'));
  if (heroBg.complete) heroBg.classList.add('loaded');
}

/* ── Smooth reveal on scroll ── */
const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Add fade-in styles via JS so they don't flash before JS loads
const style = document.createElement('style');
style.textContent = `
  .fade-in {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }
  .fade-in.visible {
    opacity: 1;
    transform: none;
  }
`;
document.head.appendChild(style);

// Apply to key elements
const revealEls = document.querySelectorAll(
  '.menu-card, .about-image-wrap, .about-text, .gallery-item, .icecream-banner, .order-text, .order-form'
);
revealEls.forEach((el, i) => {
  el.classList.add('fade-in');
  el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  revealObserver.observe(el);
});

/* ── Set minimum date on order form ── */
const dateInput = document.getElementById('date');
if (dateInput) {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 5); // 5 days minimum notice
  dateInput.min = minDate.toISOString().split('T')[0];
}

/* ── Order form: simple validation & success state ── */
const orderForm   = document.getElementById('order-form');
const formSuccess = document.getElementById('form-success');

if (orderForm) {
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;

    // Clear previous errors
    orderForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    // Validate required fields
    const required = orderForm.querySelectorAll('[required]');
    required.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('error');
        valid = false;
      }
    });

    // Basic email check
    const emailField = document.getElementById('email');
    if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      emailField.classList.add('error');
      valid = false;
    }

    if (!valid) {
      const firstError = orderForm.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Simulate form submission (replace with real backend / Formspree / etc.)
    const submitBtn = orderForm.querySelector('[type="submit"]');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    setTimeout(() => {
      orderForm.querySelectorAll('input, select, textarea').forEach(el => el.value = '');
      submitBtn.style.display = 'none';
      formSuccess.style.display = 'flex';
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1200);
  });
}

/* ── Active nav link highlighting on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navItems.forEach(a => {
        a.style.opacity = a.getAttribute('href') === `#${id}` ? '1' : '0.65';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));
