/* ─────────────────────────────────────────────────────────────
   Fennel Heads — script.js
   ───────────────────────────────────────────────────────────── */

/* ── Navbar: scroll behaviour & mobile toggle ── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

// On inner pages the navbar is always solid; on the home hero it fades in on scroll
const isInnerPage = document.body.hasAttribute('data-page');

const updateNav = () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60 || isInnerPage);
};

updateNav(); // set correct state immediately on page load
window.addEventListener('scroll', updateNav, { passive: true });

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

/* ── Order form: validation + Formspree submission ── */
const orderForm   = document.getElementById('order-form');
const formSuccess = document.getElementById('form-success');
const formError   = document.getElementById('form-error');

if (orderForm) {
  // Mirror the customer's email into the hidden _replyto field so Arry
  // can hit Reply directly from his inbox.
  const emailField   = document.getElementById('email');
  const replytoField = document.getElementById('replyto-mirror');
  if (emailField && replytoField) {
    emailField.addEventListener('input', () => {
      replytoField.value = emailField.value;
    });
  }

  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let valid = true;

    // Clear previous errors
    orderForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    if (formError) formError.hidden = true;

    // Validate required fields
    orderForm.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('error');
        valid = false;
      }
    });

    // Basic email check
    if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      emailField.classList.add('error');
      valid = false;
    }

    if (!valid) {
      const firstError = orderForm.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const submitBtn = orderForm.querySelector('[type="submit"]');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    const endpoint = orderForm.dataset.formspree;

    try {
      const response = await fetch(endpoint, {
        method:  'POST',
        body:    new FormData(orderForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        orderForm.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(el => el.value = '');
        submitBtn.style.display = 'none';
        formSuccess.style.display = 'flex';
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error('Server returned ' + response.status);
      }
    } catch {
      submitBtn.textContent = 'Send Order Request';
      submitBtn.disabled = false;
      if (formError) {
        formError.hidden = false;
        formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

/* ── Order form: live price calculator ── */
(function () {
  const CAKE_PRICES = {
    'Lavender Honey Cake':           { '6': 48, '8': 68,  '10': 90 },
    'Dark Chocolate Espresso Torte': { '6': 54, '8': 74,  '10': 98 },
    'Strawberry Matcha Layer Cake':  { '6': 52, '8': 72,  '10': 96 },
    'Lemon Elderflower Cake':        { '6': 50, '8': 70,  '10': 94 },
  };
  const ICE_CREAM_PRICE = 18;
  const SIZE_LABELS = {
    '6':  '6″ (serves 8–10)',
    '8':  '8″ (serves 14–18)',
    '10': '10″ (serves 22–26)',
  };

  const cakeEl     = document.getElementById('cake');
  const sizeEl     = document.getElementById('size');
  const iceEl      = document.getElementById('icecream');
  const totalBox   = document.getElementById('order-total');
  const totalHidden = document.getElementById('total-hidden');
  if (!cakeEl || !sizeEl || !iceEl || !totalBox) return;

  const lblCake    = document.getElementById('total-cake-label');
  const priceCake  = document.getElementById('total-cake-price');
  const iceRow     = document.getElementById('total-ice-row');
  const grandEl    = document.getElementById('total-grand');

  function updateSizeLabels() {
    const prices = CAKE_PRICES[cakeEl.value];
    Array.from(sizeEl.options).forEach(opt => {
      const key = opt.dataset.key;
      opt.textContent = (prices && key in prices)
        ? `${SIZE_LABELS[key]} — $${prices[key]}`
        : SIZE_LABELS[key] || opt.textContent;
    });
  }

  function updateTotal() {
    const cake    = cakeEl.value;
    const prices  = CAKE_PRICES[cake];
    const sizeKey = sizeEl.options[sizeEl.selectedIndex]?.dataset?.key;
    const hasIce  = iceEl.value !== 'none';

    if (!prices || !sizeKey) {
      totalBox.hidden = true;
      if (totalHidden) totalHidden.value = '';
      return;
    }

    const cakePrice = prices[sizeKey];
    const grand     = cakePrice + (hasIce ? ICE_CREAM_PRICE : 0);

    totalBox.hidden         = false;
    lblCake.textContent     = `${cake} (${SIZE_LABELS[sizeKey].split(' ')[0]})`;
    priceCake.textContent   = `$${cakePrice}`;
    iceRow.hidden           = !hasIce;
    grandEl.textContent     = `$${grand}`;
    if (totalHidden) totalHidden.value = `$${grand}`;
  }

  cakeEl.addEventListener('change', () => { updateSizeLabels(); updateTotal(); });
  sizeEl.addEventListener('change', updateTotal);
  iceEl.addEventListener('change', updateTotal);

  updateSizeLabels();
  updateTotal();
})();

/* ── Active nav link highlighting (per-page) ── */
const currentPage = document.body.dataset.page;
if (currentPage) {
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === currentPage) a.classList.add('active');
  });
}
