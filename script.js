/* Haven Estates — interactions
   Fixed header, section navigation, search, gallery, counters, reveals. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('#site-header');
  const toggle = $('#menu-toggle');
  const menu = $('#mobile-nav');

  /* ---------- Mobile menu (compact dropdown on the right) ---------- */
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    const symbol = $('.menu-symbol', toggle);
    const label = $('.menu-text', toggle);
    if (symbol) symbol.textContent = open ? '×' : '☰';
    if (label) label.textContent = open ? 'Close' : 'Menu';
    if (header) header.classList.toggle('menu-open', open);
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(menu.hidden));
    document.addEventListener('click', event => {
      if (!menu.hidden && !event.target.closest('.mobile-menu-wrapper')) setMenu(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setMenu(false); });
  }

  /* ---------- Section navigation ----------
     Every nav link scrolls to the top of its own section. Sections are as tall
     as the screen and carry their own top padding, so the fixed header never
     covers a heading. History updates are optional: if the browser refuses
     them (sandboxed frames, file previews) scrolling still works. */
  function goTo(hash, record = true) {
    if (!hash || hash === '#') return false;
    let id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (error) { /* keep raw id */ }
    const target = document.getElementById(id);
    if (!target) return false;

    const isSection = target.tagName === 'SECTION';
    const clearance = isSection ? 0 : (header ? header.offsetHeight : 0) + 16;
    const top = id === 'top' ? 0 : Math.max(0, window.pageYOffset + target.getBoundingClientRect().top - clearance);
    try {
      window.scrollTo({ top, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } catch (error) {
      window.scrollTo(0, top);
    }
    if (record) { try { history.pushState(null, '', hash); } catch (error) { /* optional */ } }
    try {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    } catch (error) { /* optional */ }
    return true;
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (goTo(link.getAttribute('href'))) {
      event.preventDefault();
      setMenu(false);
    }
  });
  window.addEventListener('popstate', () => { if (location.hash) goTo(location.hash, false); });

  /* ---------- Header state + current section highlight ---------- */
  const navLinks = $$('.showcase-nav a, .showcase-mobile-nav a');
  const sections = $$('main > section[id]');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
      const line = window.innerHeight * 0.4;
      let current = null;
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) current = section.id;
      });
      navLinks.forEach(link => {
        if (link.getAttribute('href') === '#' + current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- Search: filters the Buy or Rent section and jumps to it ---------- */
  const form = $('#property-search');
  const budgetSelect = $('#price');
  const budgets = {
    Buy: ['Any budget', 'Under $300,000', '$300,000–$500,000', '$500,000–$750,000', '$750,000+'],
    Rent: ['Any budget', 'Under $2,500 / month', '$2,500–$3,500 / month', '$3,500+ / month']
  };
  function fillBudget(kind) {
    if (!budgetSelect) return;
    budgetSelect.innerHTML = '';
    budgets[kind].forEach(label => {
      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      budgetSelect.appendChild(option);
    });
  }
  function inRange(amount, label) {
    switch (label) {
      case 'Under $300,000': return amount < 300000;
      case '$300,000–$500,000': return amount >= 300000 && amount <= 500000;
      case '$500,000–$750,000': return amount > 500000 && amount <= 750000;
      case '$750,000+': return amount > 750000;
      case 'Under $2,500 / month': return amount < 2500;
      case '$2,500–$3,500 / month': return amount >= 2500 && amount <= 3500;
      case '$3,500+ / month': return amount > 3500;
      default: return true;
    }
  }
  function showAll(kind) {
    $$('#' + kind + '-cards .listing-card').forEach(card => { card.hidden = false; });
    const feedback = $('#' + kind + '-feedback');
    if (feedback) feedback.textContent = '';
  }
  if (form) {
    $$('input[name="listing"]', form).forEach(input => {
      input.addEventListener('change', () => fillBudget(input.value === 'Rent' ? 'Rent' : 'Buy'));
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = new FormData(form);
      const kind = values.get('listing') === 'Rent' ? 'rent' : 'buy';
      const other = kind === 'rent' ? 'buy' : 'rent';
      const type = values.get('type');
      const price = values.get('price');
      const place = values.get('location');

      showAll(other);
      let matches = 0;
      $$('#' + kind + '-cards .listing-card').forEach(card => {
        const ok = (type === 'Any type' || card.dataset.type === type)
          && (place === 'Any location' || card.dataset.location === place)
          && inRange(Number(card.dataset.price), price);
        card.hidden = !ok;
        if (ok) matches++;
      });

      const feedback = $('#' + kind + '-feedback');
      if (feedback) {
        feedback.textContent = '';
        const message = document.createElement('span');
        message.textContent = matches
          ? matches + ' sample ' + (matches === 1 ? 'home matches' : 'homes match') + ' your search.'
          : 'No sample homes match. Try another location, type or budget.';
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.textContent = 'Show all';
        reset.addEventListener('click', () => { showAll(kind); });
        feedback.append(message, reset);
      }
      goTo('#' + kind);
    });
  }

  /* ---------- Gallery ---------- */
  const mainImage = $('#spotlight-image');
  $$('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      if (mainImage) {
        mainImage.style.transition = 'opacity .25s ease';
        mainImage.style.opacity = '0.15';
        mainImage.onload = () => { mainImage.style.opacity = '1'; };
        mainImage.src = thumb.dataset.img;
        mainImage.alt = thumb.dataset.alt;
        window.setTimeout(() => { mainImage.style.opacity = '1'; }, 400);
      }
      $$('.gallery-thumb').forEach(other => {
        const active = other === thumb;
        other.classList.toggle('active', active);
        other.setAttribute('aria-pressed', String(active));
      });
    });
  });

  const favorite = $('#spotlight-save');
  if (favorite) {
    favorite.addEventListener('click', () => {
      const saved = favorite.getAttribute('aria-pressed') !== 'true';
      favorite.setAttribute('aria-pressed', String(saved));
      favorite.setAttribute('aria-label', saved ? 'Remove showcase property from saved' : 'Save showcase property');
      favorite.textContent = saved ? '♥' : '♡';
    });
  }

  /* ---------- Enquiry form ---------- */
  $$('[data-interest]').forEach(link => link.addEventListener('click', () => {
    const select = $('#interest');
    if (!select) return;
    const match = Array.from(select.options).find(option => option.value === link.dataset.interest);
    if (match) select.value = match.value;
  }));

  const enquiry = $('#enquiry-form');
  if (enquiry) {
    enquiry.addEventListener('submit', event => {
      event.preventDefault();
      if (!enquiry.reportValidity()) return;
      const data = new FormData(enquiry);
      const subject = encodeURIComponent('Haven Estates enquiry: ' + data.get('interest'));
      const body = encodeURIComponent(
        'Name: ' + data.get('name') + '\n' +
        'Email: ' + data.get('email') + '\n' +
        'Phone: ' + (data.get('phone') || 'Not provided') + '\n' +
        'Interested in: ' + data.get('interest') + '\n\n' +
        data.get('message') + '\n\nDesign demo: replace the recipient with your agency inbox.'
      );
      const note = $('#form-message');
      if (note) note.textContent = 'Your email app should open with a prepared message. This demo does not send messages or store your details.';
      window.location.href = 'mailto:hello@example.com?subject=' + subject + '&body=' + body;
    });
  }

  const year = $('#copyright-year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Count-up statistics ---------- */
  const counters = $$('.count-value[data-target]');
  const pad = (el, value) => String(value).padStart(Number(el.dataset.pad || 1), '0');
  let counted = false;
  function runCounters() {
    if (counted) return;
    counted = true;
    if (reduceMotion) { counters.forEach(el => { el.textContent = pad(el, el.dataset.target); }); return; }
    const duration = 1600;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    (function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      counters.forEach(el => { el.textContent = pad(el, Math.round(Number(el.dataset.target) * ease(progress))); });
      if (progress < 1) window.requestAnimationFrame(frame);
    })(start);
  }
  const glance = $('#glance');
  if (glance && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { runCounters(); counterObserver.disconnect(); }
    }, { threshold: 0.2 });
    counterObserver.observe(glance);
  } else {
    runCounters();
  }

  /* ---------- Reveal on scroll (content is visible without JS) ---------- */
  const revealItems = $$('.reveal-on-scroll');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    root.classList.add('js-motion');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
    window.setTimeout(() => {
      revealItems.forEach(item => {
        if (item.getBoundingClientRect().top < window.innerHeight * 1.1) item.classList.add('is-visible');
      });
    }, 3500);
  }
})();
