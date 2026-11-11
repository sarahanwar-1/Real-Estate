/* ==========================================================================
   Fernhill Realty: script.js
   Needs listings.js (the homes) and art.js (the pictures) to load first.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- settings you may want to change ---------- */
  const CONFIG = {
    phone: '(555) 010-0172',
    // Where tour and valuation requests are sent. Any service that accepts a JSON POST works
    // (Formspree, Getform, a Google Apps Script web app, your own server). Empty means demo mode.
    endpoint: '',
    firstBatch: 9,          // homes shown before "Show more"
    moreBatch: 6,
    estimate: { down: 0.2, rate: 0.055, years: 30 }   // used for "Est. per month" on the cards
  };

  const FH = window.FH, ART = window.FHArt;
  if (!FH || !ART) return;
  const { HOODS, AGENTS, LISTINGS } = FH;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const hoodById = {}; HOODS.forEach(h => { hoodById[h.id] = h; });
  const agentById = {}; AGENTS.forEach(a => { agentById[a.id] = a; });
  const listingById = {}; LISTINGS.forEach(l => { listingById[l.id] = l; });
  const CAT = { House: 'house', Bungalow: 'house', Cottage: 'house', Cabin: 'house', Townhouse: 'town', Duplex: 'town', 'Row house': 'town', Condo: 'condo', 'Loft condo': 'condo', Loft: 'condo' };
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* ---------- small helpers ---------- */
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const short = n => n >= 1e6 ? '$' + (Math.round(n / 1e5) / 10).toString().replace(/\.0$/, '') + 'M' : n >= 1e4 ? '$' + Math.round(n / 1000) + 'K' : money(n);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const pmt = (principal, ratePct, years) => {
    const r = ratePct / 100 / 12, n = years * 12;
    return r === 0 ? principal / n : principal * r / (1 - Math.pow(1 + r, -n));
  };
  const estMonthly = l => {
    if (l.status !== 'sale') return 0;
    const e = CONFIG.estimate;
    return pmt(l.price * (1 - e.down), e.rate * 100, e.years) + (l.tax || 0) / 12 + (l.hoa || 0);
  };
  const isNew = l => l.daysOn <= 5;
  const agoText = d => d <= 1 ? 'Listed today' : d < 14 ? 'Listed ' + d + ' days ago' : 'Listed ' + Math.round(d / 7) + ' weeks ago';
  const openText = o => 'Open ' + DOW[o.dow] + ' ' + o.from.replace(':00', '') + ' to ' + o.to.replace(':00', '');
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  const artCache = {};
  function artSrc(l, variant) {
    const key = l.id + ':' + (variant || 'front');
    if (artCache[key]) return artCache[key];
    let src;
    if (l.photos && l.photos[variant === 'dusk' ? 1 : variant === 'street' ? 2 : 0]) src = l.photos[variant === 'dusk' ? 1 : variant === 'street' ? 2 : 0];
    else if (!variant && l.photo) src = l.photo;
    else if (variant === 'dusk') src = ART.artUri(l.art, { time: 'dusk', seedShift: 2 });
    else if (variant === 'street') src = ART.artUri(l.art, { time: 'mist', seedShift: 5 });
    else src = ART.artUri(l.art);
    artCache[key] = src;
    return src;
  }
  const hasPhoto = l => !!(l.photo || l.photos);
  const altFor = l => (hasPhoto(l) ? '' : 'Illustration of ') + l.type.toLowerCase() + ' at ' + l.address;

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const themeBtn = $('.theme-toggle');
  function syncThemeBtn() {
    if (!themeBtn) return;
    const dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeBtn();
    });
  }
  syncThemeBtn();

  /* ---------- saved homes ---------- */
  const saved = new Set();
  try { JSON.parse(localStorage.getItem('fh-saved') || '[]').forEach(id => { if (listingById[id]) saved.add(id); }); } catch (e) {}
  function persistSaved() { try { localStorage.setItem('fh-saved', JSON.stringify(Array.from(saved))); } catch (e) {} }
  const savedBtn = $('#saved-open'), savedCount = $('#saved-count');
  function renderSavedCount(bump) {
    const n = saved.size;
    if (savedCount) { savedCount.textContent = n; savedCount.dataset.n = n; }
    if (savedBtn) {
      savedBtn.setAttribute('aria-label', 'Saved homes: ' + n);
      if (bump) { savedBtn.classList.remove('is-bump'); void savedBtn.offsetWidth; savedBtn.classList.add('is-bump'); }
    }
    const fn = $('#f-saved-n'); if (fn) fn.textContent = n;
  }
  function toggleSaved(id) {
    const l = listingById[id]; if (!l) return false;
    const on = !saved.has(id);
    if (on) saved.add(id); else saved.delete(id);
    persistSaved();
    renderSavedCount(on);
    $$('[data-heart="' + id + '"]').forEach(b => {
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + l.address + (on ? ' from saved homes' : ''));
      if (on) { b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); }
    });
    $$('.pin[data-id="' + id + '"]').forEach(p => p.classList.toggle('is-saved', on));
    syncDialogSave();
    if (state.savedOnly && !on) { render(); }
    toast(on ? 'Saved ' + l.address : 'Removed from saved homes');
    return on;
  }

  /* ---------- header, menu, active link ---------- */
  const header = $('#site-header');
  const heroBg = $('#hero-bg');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header) header.classList.toggle('is-solid', y > 24);
      if (heroBg && y < 1000 && !reduceMotion) heroBg.style.setProperty('--py', String(y));
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const nav = $('#main-nav'), menuBtn = $('.menu-toggle');
  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (header && open) header.classList.add('is-solid'); else onScroll();
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', e => { if (!e.target.closest('.header-inner')) setMenu(false); });
  }

  const navLinks = $$('.main-nav a[href^="#"]');
  function markCurrent(id) {
    navLinks.forEach(a => {
      const href = a.getAttribute('href').slice(1);
      let on = href === id;
      if (id === 'homes' && a.dataset.mode) on = a.dataset.mode === state.mode;
      a.classList.toggle('is-current', on);
    });
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) markCurrent(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['homes', 'neighborhoods', 'value', 'mortgage', 'agents'].forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- state ---------- */
  const state = { mode: 'sale', hood: 'any', type: 'any', maxPrice: 0, beds: 0, sort: 'new', quick: '', q: '', savedOnly: false, view: 'grid', shown: CONFIG.firstBatch };
  const QUICK = {
    open: l => !!l.open,
    new: l => l.daysOn <= 7,
    drop: l => !!l.was,
    pet: l => l.features.some(f => /pet friendly/i.test(f)),
    water: l => l.hood === 'harbour-point'
  };
  const PRICE = {
    sale: [[0, 'Any price'], [400000, 'Up to $400K'], [550000, 'Up to $550K'], [700000, 'Up to $700K'], [900000, 'Up to $900K'], [1200000, 'Up to $1.2M']],
    rent: [[0, 'Any rent'], [2400, 'Up to $2,400 a month'], [2800, 'Up to $2,800 a month'], [3200, 'Up to $3,200 a month']]
  };
  function fillPrice(sel, mode, keep) {
    if (!sel) return;
    const cur = keep ? sel.value : '0';
    sel.innerHTML = PRICE[mode].map(p => '<option value="' + p[0] + '">' + p[1] + '</option>').join('');
    sel.value = PRICE[mode].some(p => String(p[0]) === cur) ? cur : '0';
  }

  /* ---------- hero scene ---------- */
  if (heroBg) heroBg.insertAdjacentHTML('afterbegin', ART.heroScene());
  const hero = $('.hero');
  if (hero && heroBg && finePointer && !reduceMotion) {
    let tx = 0, cx = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.07;
      heroBg.style.setProperty('--mx', cx.toFixed(3));
      raf = Math.abs(tx - cx) > 0.003 ? requestAnimationFrame(tick) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener('pointerleave', () => { tx = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }

  const saleN = LISTINGS.filter(l => l.status === 'sale').length, rentN = LISTINGS.length - saleN;
  const statEl = $('#hero-stat');
  function heroStat(a, b) { if (statEl) statEl.textContent = a + ' homes for sale and ' + b + ' for rent'; }
  if (statEl) {
    if (reduceMotion) heroStat(saleN, rentN);
    else {
      const t0 = performance.now();
      const step = t => { const p = clamp((t - t0 - 500) / 900, 0, 1), e = 1 - Math.pow(1 - p, 3); heroStat(Math.round(saleN * e), Math.round(rentN * e)); if (p < 1) requestAnimationFrame(step); };
      heroStat(0, 0); requestAnimationFrame(step);
    }
  }

  /* ---------- hero search ---------- */
  const heroForm = $('#hero-search');
  let heroTab = 'sale';
  const sFind = $('#search-find'), sSell = $('#search-sell'), sQuick = $('#hero-quick');
  const sPrice = $('#s-price'), fPrice = $('#f-price');
  fillPrice(sPrice, 'sale'); fillPrice(fPrice, 'sale');
  const places = $('#s-places');
  if (places) places.innerHTML = HOODS.map(h => '<option value="' + esc(h.name) + '">').join('') + LISTINGS.map(l => '<option value="' + esc(l.address) + '">').join('');

  function setHeroTab(tab) {
    heroTab = tab;
    $$('.search-tab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
    const sell = tab === 'sell';
    if (sFind) sFind.hidden = sell;
    if (sSell) sSell.hidden = !sell;
    if (sQuick) sQuick.hidden = sell;
    if (!sell) {
      fillPrice(sPrice, tab);
      const lbl = $('#s-price-label'); if (lbl) lbl.textContent = tab === 'rent' ? 'Monthly rent' : 'Price';
    }
  }
  $$('.search-tab').forEach(b => b.addEventListener('click', () => setHeroTab(b.dataset.tab)));

  function scrollToId(id) {
    const el = document.getElementById(id); if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  if (heroForm) {
    heroForm.addEventListener('submit', e => {
      e.preventDefault();
      if (heroTab === 'sell') {
        const a = $('#s-address'), v = $('#v-address');
        if (a && v && a.value.trim()) v.value = a.value.trim();
        scrollToId('value');
        setTimeout(() => { const t = $('#v-sqft'); if (t) t.focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
        return;
      }
      setMode(heroTab, true);
      state.q = $('#s-where').value.trim();
      state.type = $('#s-type').value;
      state.maxPrice = Number($('#s-price').value) || 0;
      state.beds = Number($('#s-beds').value) || 0;
      state.hood = 'any';
      const m = HOODS.find(h => h.name.toLowerCase() === state.q.toLowerCase());
      if (m) { state.hood = m.id; state.q = ''; }
      state.savedOnly = false;
      state.shown = CONFIG.firstBatch;
      syncControls(); render();
      scrollToId('homes');
    });
  }

  /* ---------- filter controls ---------- */
  const fHood = $('#f-hood');
  if (fHood) fHood.innerHTML = '<option value="any">All neighbourhoods</option>' + HOODS.map(h => '<option value="' + h.id + '">' + esc(h.name) + '</option>').join('');
  const vHood = $('#v-hood');
  if (vHood) vHood.innerHTML = HOODS.map(h => '<option value="' + h.id + '">' + esc(h.name) + '</option>').join('');

  function setMode(mode, silent) {
    if (state.mode !== mode) { state.maxPrice = 0; }
    state.mode = mode;
    state.savedOnly = false;
    fillPrice(fPrice, mode);
    const lbl = $('#f-price-label'); if (lbl) lbl.textContent = mode === 'rent' ? 'Monthly rent' : 'Price';
    if (!silent) { state.shown = CONFIG.firstBatch; syncControls(); render(); }
  }

  function syncControls() {
    $$('#filters .seg-btn[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(!state.savedOnly && b.dataset.mode === state.mode)));
    if (fHood) fHood.value = state.hood;
    $('#f-type').value = state.type;
    if (fPrice) { fillPrice(fPrice, state.mode, false); fPrice.value = String(state.maxPrice); if (fPrice.value !== String(state.maxPrice)) fPrice.value = '0'; }
    $('#f-beds').value = String(state.beds);
    $('#f-sort').value = state.sort;
    $$('.qchip[data-quick]').forEach(b => b.setAttribute('aria-pressed', String(state.quick === b.dataset.quick)));
    const sv = $('#f-saved'); if (sv) sv.setAttribute('aria-pressed', String(state.savedOnly));
    const clear = $('#f-clear');
    if (clear) clear.hidden = !(state.hood !== 'any' || state.type !== 'any' || state.maxPrice || state.beds || state.quick || state.q || state.savedOnly);
    $$('#results-bar .seg-btn, .view-toggle .seg-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
    markCurrent('homes');
  }

  function clearFilters() {
    state.hood = 'any'; state.type = 'any'; state.maxPrice = 0; state.beds = 0; state.quick = ''; state.q = ''; state.savedOnly = false; state.shown = CONFIG.firstBatch;
    syncControls(); render();
  }

  function bindFilters() {
    $$('#filters .seg-btn[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('change', () => { fn(el.value); state.shown = CONFIG.firstBatch; state.savedOnly = state.savedOnly && false; syncControls(); render(); }); };
    on('#f-hood', v => { state.hood = v; });
    on('#f-type', v => { state.type = v; });
    on('#f-price', v => { state.maxPrice = Number(v) || 0; });
    on('#f-beds', v => { state.beds = Number(v) || 0; });
    const sort = $('#f-sort'); if (sort) sort.addEventListener('change', () => { state.sort = sort.value; render(); });
    $$('.qchip[data-quick]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.quick;
      state.quick = state.quick === k ? '' : k;
      state.savedOnly = false;
      if (state.quick) {
        // if nothing matches in this mode but something does in the other, switch for them
        const here = LISTINGS.filter(l => l.status === state.mode && QUICK[k](l)).length;
        const other = LISTINGS.filter(l => l.status !== state.mode && QUICK[k](l)).length;
        if (!here && other) setMode(state.mode === 'sale' ? 'rent' : 'sale', true);
      }
      state.shown = CONFIG.firstBatch;
      syncControls(); render();
      if (b.closest('#hero-quick')) scrollToId('homes');
    }));
    const sv = $('#f-saved'); if (sv) sv.addEventListener('click', () => { state.savedOnly = !state.savedOnly; state.shown = CONFIG.firstBatch; syncControls(); render(); });
    const clear = $('#f-clear'); if (clear) clear.addEventListener('click', clearFilters);
    const eclear = $('#empty-clear'); if (eclear) eclear.addEventListener('click', clearFilters);
    $$('.view-toggle .seg-btn').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
    const more = $('#more'); if (more) more.addEventListener('click', () => { state.shown += CONFIG.moreBatch; render(true); });
    if (savedBtn) savedBtn.addEventListener('click', () => {
      if (!saved.size) { toast('Tap the heart on any home to save it.'); return; }
      state.savedOnly = true; state.shown = CONFIG.firstBatch; syncControls(); render(); scrollToId('homes');
    });
  }

  /* ---------- results ---------- */
  const listEl = $('#list'), resultsEl = $('#results'), countEl = $('#result-count'), emptyEl = $('#empty'), moreWrap = $('#more-wrap'), moreBtn = $('#more');
  let current = [];

  function matches(l) {
    if (!state.q) return true;
    const hay = (l.address + ' ' + hoodById[l.hood].name + ' ' + l.type).toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(t => hay.indexOf(t) !== -1);
  }
  function filtered() {
    const list = LISTINGS.filter(l => {
      if (state.savedOnly) { if (!saved.has(l.id)) return false; }
      else {
        if (l.status !== state.mode) return false;
        if (state.maxPrice && l.price > state.maxPrice) return false;
      }
      if (state.hood !== 'any' && l.hood !== state.hood) return false;
      if (state.type !== 'any' && CAT[l.type] !== state.type) return false;
      if (state.beds && l.beds < state.beds) return false;
      if (state.quick && !QUICK[state.quick](l)) return false;
      return matches(l);
    });
    const s = state.sort;
    list.sort((a, b) => s === 'low' ? a.price - b.price : s === 'high' ? b.price - a.price : s === 'size' ? b.sqft - a.sqft : a.daysOn - b.daysOn);
    return list;
  }

  function cardHTML(l, i) {
    const hood = hoodById[l.hood], agent = agentById[l.agent], isSaved = saved.has(l.id), rent = l.status === 'rent';
    const badges = [];
    if (isNew(l)) badges.push('<span class="badge badge-new">New</span>');
    if (l.open) badges.push('<span class="badge badge-open">' + esc(openText(l.open)) + '</span>');
    if (l.was) badges.push('<span class="badge badge-drop">Price drop</span>');
    if (rent && l.features.some(f => /pet friendly/i.test(f))) badges.push('<span class="badge">Pet friendly</span>');
    const est = estMonthly(l);
    return '<article class="home" data-id="' + l.id + '" style="--i:' + i + '">' +
      '<div class="home-media"><img src="' + artSrc(l) + '" alt="' + esc(altFor(l)) + '" width="640" height="480" loading="lazy" decoding="async">' +
      '<div class="badges">' + badges.join('') + '</div>' +
      '<button class="heart" type="button" data-heart="' + l.id + '" aria-pressed="' + isSaved + '" aria-label="' + (isSaved ? 'Remove ' + esc(l.address) + ' from saved homes' : 'Save ' + esc(l.address)) + '"><svg class="ico" aria-hidden="true"><use href="#i-heart"/></svg></button></div>' +
      '<div class="home-body">' +
      '<div class="price-row"><span class="price">' + money(l.price) + (rent ? '<small> /mo</small>' : '') + '</span>' + (l.was ? '<s class="was">' + money(l.was) + '</s>' : '') + '</div>' +
      (est ? '<p class="est">Est. ' + money(est) + '/mo with 20% down</p>' : '<p class="est">' + esc(l.parking) + '</p>') +
      '<h3 class="addr"><a class="home-link" href="#home-' + l.id + '" data-open="' + l.id + '">' + esc(l.address) + '</a></h3>' +
      '<p class="hood-tag">' + esc(hood.name) + ' &middot; ' + esc(l.type) + '</p>' +
      '<ul class="facts"><li><svg class="ico" aria-hidden="true"><use href="#i-bed"/></svg>' + l.beds + ' <span class="sr-only">bedrooms</span><span aria-hidden="true">bd</span></li><li><svg class="ico" aria-hidden="true"><use href="#i-bath"/></svg>' + l.baths + ' <span class="sr-only">bathrooms</span><span aria-hidden="true">ba</span></li><li><svg class="ico" aria-hidden="true"><use href="#i-area"/></svg>' + l.sqft.toLocaleString('en-US') + ' <span class="sr-only">square feet</span><span aria-hidden="true">sqft</span></li></ul>' +
      '<div class="home-foot"><img src="' + ART.uri(ART.avatar(agent.name, agent.tone)) + '" alt="" width="26" height="26"><span>' + esc(agent.name) + ' &middot; ' + agoText(l.daysOn) + '</span></div>' +
      '</div></article>';
  }

  let freshTimer;
  function render(append) {
    current = filtered();
    const total = current.length;
    const visible = state.view === 'map' ? current : current.slice(0, state.shown);
    const was = listEl ? listEl.children.length : 0;
    if (listEl) {
      listEl.innerHTML = visible.map(cardHTML).join('');
      if (!reduceMotion) {
        listEl.classList.remove('is-fresh'); void listEl.offsetWidth;
        if (!append) listEl.classList.add('is-fresh');
        clearTimeout(freshTimer); freshTimer = setTimeout(() => listEl.classList.remove('is-fresh'), 1600);
      }
    }
    if (emptyEl) emptyEl.hidden = total > 0;
    if (resultsEl) resultsEl.hidden = total === 0;
    // count line
    const noun = state.savedOnly ? (total === 1 ? 'saved home' : 'saved homes') : state.mode === 'rent' ? (total === 1 ? 'home for rent' : 'homes for rent') : (total === 1 ? 'home for sale' : 'homes for sale');
    let txt = total + ' ' + noun;
    if (state.hood !== 'any') txt += ' in ' + hoodById[state.hood].name;
    if (state.q) txt += ' matching “' + state.q + '”';
    if (countEl) countEl.textContent = txt;
    // more
    const remaining = total - visible.length;
    if (moreWrap) moreWrap.hidden = remaining <= 0 || state.view === 'map';
    if (moreBtn) moreBtn.textContent = 'Show ' + Math.min(CONFIG.moreBatch, Math.max(remaining, 0)) + ' more homes';
    renderPins();
    syncControls();
    if (append && listEl && was) { const first = listEl.children[was]; if (first) first.querySelector('.home-link').focus({ preventScroll: true }); }
  }

  function setView(v) {
    state.view = v;
    if (resultsEl) resultsEl.dataset.view = v;
    hideMapCard();
    render();
    if (v === 'map') requestAnimationFrame(layoutMap);
  }

  /* ---------- map ---------- */
  const mapEl = $('#map'), pinsEl = $('#map-pins'), mapCard = $('#map-card');
  let mapSvg = null, activePin = '', scroller = null, stage = null;
  const WORLD = { x: -250, y: -180, w: 1500, h: 1120 };
  if (mapEl) {
    // the drawing sits in a stage inside a scroller, so a phone can swipe sideways across a bigger map
    scroller = document.createElement('div'); scroller.className = 'map-scroll';
    stage = document.createElement('div'); stage.className = 'map-stage';
    stage.insertAdjacentHTML('afterbegin', ART.mapBase());
    mapSvg = stage.querySelector('svg');
    stage.appendChild(pinsEl); stage.appendChild(mapCard);
    scroller.appendChild(stage); mapEl.insertBefore(scroller, mapEl.firstChild);
  }
  let mapScale = 1, mapOx = 0, mapOy = 0, stageW = 0;
  function layoutMap() {
    if (!scroller || !mapSvg) return;
    const w = scroller.clientWidth, h = scroller.clientHeight;
    if (!w || !h) return;
    let sw = w;
    mapScale = Math.min(w / 1000, h / 760) * 0.96;
    if (w < 520) { mapScale = h / 760 * 0.98; sw = Math.max(w, Math.round(1000 * mapScale + 48)); }
    stageW = sw; stage.style.width = sw + 'px';
    mapOx = (sw - 1000 * mapScale) / 2; mapOy = (h - 760 * mapScale) / 2;
    mapSvg.setAttribute('viewBox', WORLD.x + ' ' + WORLD.y + ' ' + WORLD.w + ' ' + WORLD.h);
    mapSvg.setAttribute('preserveAspectRatio', 'none');
    mapSvg.style.cssText = 'position:absolute;left:' + (mapOx + WORLD.x * mapScale) + 'px;top:' + (mapOy + WORLD.y * mapScale) + 'px;width:' + (WORLD.w * mapScale) + 'px;height:' + (WORLD.h * mapScale) + 'px;max-width:none';
    $$('.pin', pinsEl).forEach(p => placePin(p));
    if (activePin && !mapCard.hidden) placeMapCard(activePin, scroller.scrollLeft);
  }
  function placePin(p) {
    const l = listingById[p.dataset.id];
    p.style.setProperty('--x', (mapOx + l.x * mapScale) + 'px');
    p.style.setProperty('--y', (mapOy + l.y * mapScale) + 'px');
  }
  function renderPins() {
    if (!pinsEl) return;
    pinsEl.innerHTML = current.map((l, i) =>
      '<button class="pin' + (saved.has(l.id) ? ' is-saved' : '') + (activePin === l.id ? ' is-active' : '') + '" type="button" data-id="' + l.id + '" style="--i:' + i + '" aria-label="' + esc(l.address + ', ' + money(l.price) + (l.status === 'rent' ? ' a month' : '')) + '">' + short(l.price) + '</button>').join('');
    layoutMap();
    if (activePin && !current.some(l => l.id === activePin)) hideMapCard();
  }
  function placeMapCard(id, sl) {
    const l = listingById[id], w = scroller.clientWidth, h = scroller.clientHeight;
    const px = mapOx + l.x * mapScale, py = mapOy + l.y * mapScale;
    const cw = w < 520 ? w - 24 : Math.min(270, w - 24);
    mapCard.style.width = cw + 'px';
    const ch = mapCard.offsetHeight || 300;
    let left = clamp(px - cw / 2, sl + 12, sl + w - cw - 12), top = py - ch - 26;
    if (top < 12) top = Math.min(py + 28, h - ch - 12);
    mapCard.style.left = left + 'px'; mapCard.style.top = Math.max(12, top) + 'px';
  }
  function showMapCard(id) {
    const l = listingById[id]; if (!l || !mapCard) return;
    activePin = id;
    $$('.pin', pinsEl).forEach(p => p.classList.toggle('is-active', p.dataset.id === id));
    $$('.home').forEach(c => c.classList.toggle('is-active', c.dataset.id === id));
    const rent = l.status === 'rent';
    mapCard.innerHTML = '<button class="mc-close" type="button" aria-label="Close preview"><svg class="ico" aria-hidden="true"><use href="#i-close"/></svg></button>' +
      '<img src="' + artSrc(l) + '" alt="" width="640" height="400">' +
      '<div class="mc-body"><p class="price">' + money(l.price) + (rent ? '<small> /mo</small>' : '') + '</p><p class="mc-addr">' + esc(l.address) + '</p>' +
      '<p class="mc-facts">' + l.beds + ' bd &middot; ' + l.baths + ' ba &middot; ' + l.sqft.toLocaleString('en-US') + ' sqft</p>' +
      '<button class="btn btn-dark btn-sm" type="button" data-open="' + l.id + '">View details</button></div>';
    mapCard.hidden = false;
    const w = scroller.clientWidth, px = mapOx + l.x * mapScale;
    const sl = clamp(px - w / 2, 0, Math.max(0, stageW - w));
    if (stageW > w) scroller.scrollTo({ left: sl, behavior: reduceMotion ? 'auto' : 'smooth' });
    placeMapCard(id, stageW > w ? sl : 0);
  }
  function hideMapCard() {
    activePin = '';
    if (mapCard) mapCard.hidden = true;
    $$('.pin.is-active', pinsEl || document).forEach(p => p.classList.remove('is-active'));
    $$('.home.is-active').forEach(c => c.classList.remove('is-active'));
  }
  if (pinsEl) {
    pinsEl.addEventListener('click', e => {
      const p = e.target.closest('.pin'); if (!p) return;
      if (activePin === p.dataset.id && !mapCard.hidden) { hideMapCard(); return; }
      showMapCard(p.dataset.id);
      const card = $('.home[data-id="' + p.dataset.id + '"]');
      if (card && finePointer && window.matchMedia('(min-width: 1101px)').matches) card.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    pinsEl.addEventListener('mouseover', e => {
      const p = e.target.closest('.pin'); if (!p) return;
      $$('.home').forEach(c => c.classList.toggle('is-active', c.dataset.id === p.dataset.id));
    });
    pinsEl.addEventListener('mouseleave', () => { if (!activePin) $$('.home.is-active').forEach(c => c.classList.remove('is-active')); });
  }
  if (mapCard) mapCard.addEventListener('click', e => { if (e.target.closest('.mc-close')) hideMapCard(); });
  if (mapEl) mapEl.addEventListener('click', e => { if (e.target === mapEl || e.target === scroller || e.target === stage || e.target.closest('svg')) hideMapCard(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mapCard && !mapCard.hidden && !$('#home-dialog').open) hideMapCard(); });
  if (mapEl && 'ResizeObserver' in window) new ResizeObserver(() => layoutMap()).observe(mapEl);
  window.addEventListener('resize', () => layoutMap());

  // cards: heart, open, hover link with the map
  if (listEl) {
    listEl.addEventListener('click', e => {
      const heart = e.target.closest('.heart');
      if (heart) { e.preventDefault(); toggleSaved(heart.dataset.heart); return; }
      const link = e.target.closest('[data-open]');
      if (link) { e.preventDefault(); openHome(link.dataset.open, link.closest('.home') ? link.closest('.home').querySelector('.home-link') : null); }
    });
    listEl.addEventListener('mouseover', e => {
      if (state.view !== 'map') return;
      const c = e.target.closest('.home'); if (!c) return;
      $$('.pin', pinsEl).forEach(p => p.classList.toggle('is-active', p.dataset.id === c.dataset.id));
    });
    listEl.addEventListener('mouseleave', () => { if (state.view === 'map' && !activePin) $$('.pin.is-active', pinsEl).forEach(p => p.classList.remove('is-active')); });
  }
  if (mapCard) mapCard.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openHome(b.dataset.open, b); });

  /* ---------- neighbourhoods ---------- */
  const hoodsEl = $('#hoods');
  function renderHoods() {
    if (!hoodsEl) return;
    hoodsEl.innerHTML = HOODS.map(h => {
      const sale = LISTINGS.filter(l => l.hood === h.id && l.status === 'sale'), all = LISTINGS.filter(l => l.hood === h.id);
      const avg = sale.length ? sale.reduce((s, l) => s + l.price, 0) / sale.length : 0;
      const dots = [1, 2, 3, 4, 5].map(i => '<i' + (i <= h.walk ? ' class="on"' : '') + '></i>').join('');
      return '<button class="hood reveal" type="button" data-hood="' + h.id + '" aria-label="' + esc(h.name + ': ' + plural(all.length, 'home', 'homes') + '. See homes') + '">' +
        '<img src="' + ART.artUri(h.art) + '" alt="" width="640" height="480" loading="lazy" decoding="async">' +
        '<h3>' + esc(h.name) + '</h3><p>' + esc(h.blurb) + '</p>' +
        '<span class="hood-stats"><span class="hood-stat">' + plural(all.length, 'home', 'homes') + '</span>' +
        (avg ? '<span class="hood-stat">Avg. ' + short(avg) + '</span>' : '') +
        '<span class="hood-stat">Walkability <span class="walk" aria-label="' + h.walk + ' out of 5">' + dots + '</span></span>' +
        '<span class="hood-stat go">See homes</span></span></button>';
    }).join('');
    hoodsEl.addEventListener('click', e => { const b = e.target.closest('[data-hood]'); if (b) goHood(b.dataset.hood); });
    const fh = $('#foot-hoods');
    if (fh) {
      fh.insertAdjacentHTML('beforeend', HOODS.map(h => '<button type="button" data-hood="' + h.id + '">' + esc(h.name) + '</button>').join(''));
      fh.addEventListener('click', e => { const b = e.target.closest('[data-hood]'); if (b) goHood(b.dataset.hood); });
    }
  }
  function goHood(id) {
    const hasSale = LISTINGS.some(l => l.hood === id && l.status === 'sale');
    state.hood = id; state.q = ''; state.type = 'any'; state.beds = 0; state.quick = ''; state.maxPrice = 0; state.savedOnly = false; state.shown = CONFIG.firstBatch;
    setMode(hasSale ? 'sale' : 'rent', true);
    syncControls(); render(); scrollToId('homes');
  }

  /* ---------- how it works ---------- */
  const STEPS = {
    buy: [
      ['Tell us what matters', 'Share your budget, your commute and the rooms you need. We set up alerts so new homes reach you first.'],
      ['Tour the homes', 'See homes in person or by video, on days that suit you. Bring your list and ask us anything.'],
      ['Make an offer', 'We compare recent nearby sales, explain what a fair price looks like and negotiate for you.'],
      ['Close and move in', 'We guide you through the inspection, financing and paperwork until you have the keys.']
    ],
    sell: [
      ['Get a free valuation', 'An agent visits, looks at recent nearby sales and gives you a clear price range with no pressure.'],
      ['Get it ready', 'We share simple prep tips and book a photographer so your home looks its best online.'],
      ['List and show', 'Your home goes live online, with open houses and tours. We review every offer with you.'],
      ['Close the sale', 'We handle conditions, paperwork and handover so you can focus on your move.']
    ]
  };
  const stepsEl = $('#steps');
  function renderSteps(kind, swap) {
    if (!stepsEl) return;
    stepsEl.innerHTML = STEPS[kind].map(s => '<li class="step"><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p></li>').join('');
    stepsEl.classList.remove('is-swap');
    if (swap) { void stepsEl.offsetWidth; stepsEl.classList.add('is-swap'); }
    $$('[data-steps]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.steps === kind)));
  }
  $$('[data-steps]').forEach(b => b.addEventListener('click', () => renderSteps(b.dataset.steps, true)));

  /* ---------- agents ---------- */
  const agentsEl = $('#agents-grid');
  if (agentsEl) {
    agentsEl.innerHTML = AGENTS.map(a =>
      '<article class="agent reveal"><div class="agent-photo">' + ART.avatar(a.name, a.tone) + '</div><h3>' + esc(a.name) + '</h3><p class="role">' + esc(a.role) + '</p><p class="areas">' + esc(a.areas) + '</p>' +
      '<div class="agent-links"><a href="tel:' + a.phone.replace(/[^\d+]/g, '') + '" aria-label="Call ' + esc(a.name) + '"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call</a>' +
      '<a href="mailto:' + a.email + '" aria-label="Email ' + esc(a.name) + '"><svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg>Email</a></div></article>').join('');
  }

  /* ---------- sending forms ---------- */
  async function send(payload) {
    if (!CONFIG.endpoint) return { ok: true, demo: true };
    try {
      const r = await fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      return { ok: r.ok, demo: false };
    } catch (e) { return { ok: false, demo: false }; }
  }
  const DEMO_NOTE = ' This is a demo, so nothing was actually sent.';
  function showError(box, msg, field) {
    if (!box) return;
    box.textContent = msg; box.hidden = false;
    if (field) { field.classList.add('is-invalid'); field.focus(); }
  }
  function clearErrors(form, box) { $$('.is-invalid', form).forEach(f => f.classList.remove('is-invalid')); if (box) box.hidden = true; }

  /* ---------- home details dialog ---------- */
  const dlg = $('#home-dialog');
  let openId = '', lastFocus = null, tour = { kind: 'person', date: '', time: '' };
  const TIMES = ['9:30 AM', '11:00 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'];

  function tourDates() {
    const out = [], d = new Date();
    for (let i = 1; i <= 7; i++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      out.push({ iso: x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), dow: DOW[x.getDay()], md: x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), long: x.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) });
    }
    return out;
  }
  let dates = tourDates();

  function pressOne(container, btn) { $$('button', container).forEach(b => b.setAttribute('aria-pressed', String(b === btn))); }

  function fillDialog(l) {
    const hood = hoodById[l.hood], agent = agentById[l.agent], rent = l.status === 'rent';
    const views = [['front', 'Front view'], ['dusk', 'Evening'], ['street', 'From the street']];
    $('#hd-hood').textContent = hood.name + ' · ' + l.type;
    $('#hd-title').textContent = l.address;
    $('#hd-price').textContent = money(l.price) + (rent ? ' /mo' : '');
    const was = $('#hd-was'); was.textContent = l.was ? money(l.was) : ''; was.hidden = !l.was;
    const est = estMonthly(l); $('#hd-est').textContent = est ? 'Est. ' + money(est) + '/mo with 20% down' : '';
    const badges = [];
    if (isNew(l)) badges.push('<span class="badge badge-new">New</span>');
    if (l.open) badges.push('<span class="badge badge-open">' + esc(openText(l.open)) + '</span>');
    if (l.was) badges.push('<span class="badge badge-drop">Price drop</span>');
    $('#hd-badges').innerHTML = badges.join('');
    const img = $('#hd-img'); img.src = artSrc(l); img.alt = altFor(l) + ', front view';
    $('#hd-thumbs').innerHTML = views.map((v, i) => '<button class="hd-thumb" type="button" data-view="' + v[0] + '" aria-pressed="' + (i === 0) + '" aria-label="' + v[1] + '"><img src="' + artSrc(l, i === 0 ? '' : v[0]) + '" alt="" width="150" height="112"></button>').join('');
    $('#hd-facts').innerHTML =
      '<li><svg class="ico" aria-hidden="true"><use href="#i-bed"/></svg><strong>' + l.beds + '</strong><span>Bedrooms</span></li>' +
      '<li><svg class="ico" aria-hidden="true"><use href="#i-bath"/></svg><strong>' + l.baths + '</strong><span>Bathrooms</span></li>' +
      '<li><svg class="ico" aria-hidden="true"><use href="#i-area"/></svg><strong>' + l.sqft.toLocaleString('en-US') + '</strong><span>Square feet</span></li>' +
      '<li><svg class="ico" aria-hidden="true"><use href="#i-cal"/></svg><strong>' + l.year + '</strong><span>Year built</span></li>';
    $('#hd-desc').textContent = l.desc;
    $('#hd-features').innerHTML = l.features.map(f => '<li><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>' + esc(f) + '</li>').join('');
    const rows = [['Home type', l.type], ['Neighbourhood', hood.name]];
    if (l.lot) rows.push(['Lot size', l.lot]);
    rows.push(['Parking', l.parking]);
    if (l.tax) rows.push(['Property tax', money(l.tax) + ' a year']);
    if (l.hoa) rows.push(['Condo fee', money(l.hoa) + ' a month']);
    rows.push(['Listed', agoText(l.daysOn).replace('Listed ', '')], ['Listing agent', agent.name]);
    $('#hd-details').innerHTML = rows.map(r => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('');
    syncDialogSave();
    $('#hd-calc').hidden = rent;
    // tour form
    dates = tourDates();
    tour = { kind: 'person', date: '', time: '' };
    pressOne($('#tour-form .seg'), $('#tour-form .seg-btn[data-tour="person"]'));
    $('#t-dates').innerHTML = dates.map(d => '<button class="chip" type="button" data-date="' + d.iso + '" aria-pressed="false"><span>' + d.dow + '</span><small>' + d.md + '</small></button>').join('');
    $('#t-times').innerHTML = TIMES.map(t => '<button class="chip chip-time" type="button" data-time="' + t + '" aria-pressed="false">' + t + '</button>').join('');
    const note = $('#t-open-note');
    if (note) note.remove();
    if (l.open) $('#t-times').insertAdjacentHTML('afterend', '<p class="tour-label" id="t-open-note" style="margin:10px 0 0;font-weight:500">Open house ' + esc(DOW[l.open.dow]) + ' ' + esc(l.open.from) + ' to ' + esc(l.open.to) + '. No booking needed.</p>');
    $('#tour-form').hidden = false; $('#tour-confirm').hidden = true;
    clearErrors($('#tour-form'), $('#t-error'));
    $('#t-submit').textContent = rent ? 'Request viewing' : 'Request tour';
    $('#tour-form h3').textContent = rent ? 'Request a viewing' : 'Request a tour';
    const f = $('#tour-form'); f.reset();
    $('.hd-info').scrollTop = 0; const hd = $('#hd'); if (hd) hd.scrollTop = 0;
  }
  function syncDialogSave() {
    const b = $('#hd-save'); if (!b || !openId) return;
    const on = saved.has(openId);
    b.setAttribute('aria-pressed', String(on));
    $('span', b).textContent = on ? 'Saved' : 'Save';
  }

  function openHome(id, from) {
    const l = listingById[id]; if (!l || !dlg) return;
    lastFocus = from || document.activeElement;
    openId = id;
    fillDialog(l);
    if (!dlg.open) { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
    document.body.classList.add('is-locked');
    try { history.replaceState(null, '', '#home-' + id); } catch (e) {}
  }
  function closeHome() { if (dlg && dlg.open) dlg.close(); }
  if (dlg) {
    dlg.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
      openId = '';
      try { if (/^#home-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      if (lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) closeHome(); });
    $('#hd-close').addEventListener('click', closeHome);
    $('#hd-thumbs').addEventListener('click', e => {
      const b = e.target.closest('.hd-thumb'); if (!b) return;
      const l = listingById[openId]; if (!l) return;
      const v = b.dataset.view, img = $('#hd-img');
      img.src = artSrc(l, v === 'front' ? '' : v); img.classList.remove('is-swap'); void img.offsetWidth; img.classList.add('is-swap');
      img.alt = altFor(l) + ', ' + b.getAttribute('aria-label').toLowerCase();
      pressOne($('#hd-thumbs'), b);
    });
    $('#hd-save').addEventListener('click', () => { if (openId) toggleSaved(openId); });
    $('#hd-share').addEventListener('click', () => {
      const url = location.href.split('#')[0] + '#home-' + openId;
      const done = () => toast('Link copied');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => toast('Copy the link: ' + url));
      else toast('Copy the link: ' + url);
    });
    $('#hd-calc').addEventListener('click', () => {
      const l = listingById[openId]; if (!l) return;
      useInCalculator(l); closeHome(); scrollToId('mortgage');
      toast('Calculator set to ' + money(l.price));
    });
    $('#hd-map').addEventListener('click', () => {
      const id = openId; closeHome();
      const l = listingById[id]; if (!l) return;
      if (state.mode !== l.status && !state.savedOnly) setMode(l.status, true);
      state.hood = 'any'; state.q = ''; state.type = 'any'; state.beds = 0; state.quick = ''; state.maxPrice = 0;
      setView('map');
      scrollToId('homes');
      setTimeout(() => { layoutMap(); showMapCard(id); }, reduceMotion ? 30 : 650);
    });
    // tour form
    $('#tour-form .seg').addEventListener('click', e => { const b = e.target.closest('[data-tour]'); if (!b) return; tour.kind = b.dataset.tour; pressOne(e.currentTarget, b); });
    $('#t-dates').addEventListener('click', e => { const b = e.target.closest('[data-date]'); if (!b) return; tour.date = b.dataset.date; pressOne($('#t-dates'), b); });
    $('#t-times').addEventListener('click', e => { const b = e.target.closest('[data-time]'); if (!b) return; tour.time = b.dataset.time; pressOne($('#t-times'), b); });
    $('#tour-form').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.currentTarget, err = $('#t-error'), l = listingById[openId]; if (!l) return;
      clearErrors(f, err);
      const name = $('#t-name').value.trim(), email = $('#t-email').value.trim(), phone = $('#t-phone').value.trim();
      if (!tour.date) return showError(err, 'Pick a day for your ' + (l.status === 'rent' ? 'viewing' : 'tour') + '.', $('#t-dates button'));
      if (!tour.time) return showError(err, 'Pick a time.', $('#t-times button'));
      if (!name) return showError(err, 'Add your name so we know who to expect.', $('#t-name'));
      if (!emailOk(email)) return showError(err, 'Add an email address we can reach you on.', $('#t-email'));
      const btn = $('#t-submit'); btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending';
      const d = dates.find(x => x.iso === tour.date), agent = agentById[l.agent];
      const res = await send({ type: 'tour', listing: l.id, address: l.address, kind: tour.kind, date: tour.date, time: tour.time, name, email, phone, note: $('#t-note').value.trim(), agent: agent.id });
      btn.disabled = false; btn.textContent = label;
      if (!res.ok) return showError(err, 'We could not send your request. Please call us on ' + CONFIG.phone + '.');
      f.hidden = true;
      const box = $('#tour-confirm'); box.hidden = false;
      $('#tour-confirm-text').textContent = 'Thanks, ' + name.split(' ')[0] + '. We have your request for ' + (tour.kind === 'video' ? 'a video ' : 'an in-person ') + (l.status === 'rent' ? 'viewing' : 'tour') + ' of ' + l.address + ' on ' + d.long + ' at ' + tour.time + '. ' + agent.name + ' will confirm by email within one business day.' + (res.demo ? DEMO_NOTE : '');
      box.focus();
    });
    $('#tour-again').addEventListener('click', () => { const l = listingById[openId]; if (l) fillDialog(l); $('#tour-form').scrollIntoView({ block: 'center' }); });
  }

  /* open from the address bar: #home-<id> */
  function openFromHash() {
    const m = /^#home-([a-z0-9-]+)$/.exec(location.hash);
    if (m && listingById[m[1]] && !(dlg && dlg.open)) openHome(m[1], null);
  }
  window.addEventListener('hashchange', openFromHash);

  /* nav and button links that choose sale or rent */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-mode]');
    if (a) { setMode(a.dataset.mode); }
  });

  /* ---------- valuation ---------- */
  const valForm = $('#val-form'), valRes = $('#val-result');
  if (valForm) {
    valForm.insertAdjacentHTML('afterbegin', '<p class="form-error" id="v-error" role="alert" hidden></p>');
    valForm.addEventListener('submit', e => {
      e.preventDefault();
      const err = $('#v-error'); clearErrors(valForm, err);
      const sqft = Number($('#v-sqft').value), beds = Number($('#v-beds').value), baths = Number($('#v-baths').value), cond = Number($('#v-cond').value), hood = hoodById[$('#v-hood').value];
      if (!(sqft >= 300 && sqft <= 9000)) return showError(err, 'Enter a size between 300 and 9,000 square feet.', $('#v-sqft'));
      const base = sqft * hood.perSqft * cond * (1 + 0.025 * (beds - 3)) * (1 + 0.02 * (baths - 2));
      const lo = Math.round(base * 0.94 / 1000) * 1000, hi = Math.round(base * 1.06 / 1000) * 1000;
      $('#val-range').textContent = money(lo) + ' to ' + money(hi);
      valRes.hidden = false;
      const fill = $('#val-fill'); fill.style.width = '0%'; void fill.offsetWidth; fill.style.width = '100%';
      $('#lead-form').hidden = false; $('#lead-confirm').hidden = true;
      valRes.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
  const leadForm = $('#lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', async e => {
      e.preventDefault();
      const err = $('#l-error'); clearErrors(leadForm, err);
      const name = $('#l-name').value.trim(), email = $('#l-email').value.trim();
      if (!name) return showError(err, 'Add your name.', $('#l-name'));
      if (!emailOk(email)) return showError(err, 'Add an email address we can reach you on.', $('#l-email'));
      const btn = $('button[type="submit"]', leadForm); btn.disabled = true;
      const res = await send({ type: 'valuation', name, email, address: $('#v-address').value.trim(), hood: $('#v-hood').value, beds: $('#v-beds').value, baths: $('#v-baths').value, sqft: $('#v-sqft').value, condition: $('#v-cond').selectedOptions[0].text, estimate: $('#val-range').textContent });
      btn.disabled = false;
      if (!res.ok) return showError(err, 'We could not send your request. Please call us on ' + CONFIG.phone + '.');
      leadForm.hidden = true;
      const box = $('#lead-confirm'); box.hidden = false;
      $('#lead-confirm-text').textContent = 'Thanks, ' + name.split(' ')[0] + '. An agent will contact you within one business day to arrange a visit and send a full valuation.' + (res.demo ? DEMO_NOTE : '');
      box.focus();
    });
  }

  /* ---------- newsletter ---------- */
  const newsForm = $('#news-form');
  if (newsForm) {
    newsForm.addEventListener('submit', async e => {
      e.preventDefault();
      const input = $('#n-email'), msg = $('#news-msg');
      if (!emailOk(input.value.trim())) { msg.textContent = 'Enter a valid email address.'; input.focus(); return; }
      const res = await send({ type: 'newsletter', email: input.value.trim() });
      msg.textContent = res.ok ? 'Thanks, you are on the list.' + (res.demo ? ' (Demo: nothing was saved.)' : '') : 'Could not sign you up. Please try again.';
      if (res.ok) newsForm.reset();
    });
  }

  /* ---------- mortgage calculator ---------- */
  const C = { price: $('#c-price'), down: $('#c-down'), rate: $('#c-rate'), term: $('#c-term'), tax: $('#c-tax'), ins: $('#c-ins'), hoa: $('#c-hoa') };
  let taxTouched = false, exactPrice = null;
  function setPct(el) { const p = (Number(el.value) - Number(el.min)) / (Number(el.max) - Number(el.min)) * 100; el.style.setProperty('--pct', p + '%'); }
  function calc() {
    if (!C.price) return;
    const price = exactPrice !== null ? exactPrice : Number(C.price.value), downPct = Number(C.down.value), rate = Number(C.rate.value), years = Number(C.term.value);
    if (!taxTouched) C.tax.value = String(Math.round(price * 0.0074 / 100) * 100);
    const tax = Math.max(0, Number(C.tax.value) || 0), ins = Math.max(0, Number(C.ins.value) || 0), hoa = Math.max(0, Number(C.hoa.value) || 0);
    const down = price * downPct / 100, loan = price - down;
    const pi = pmt(loan, rate, years), taxM = tax / 12, oth = ins + hoa, total = pi + taxM + oth;
    $('#c-price-out').textContent = money(price);
    $('#c-down-out').textContent = downPct + '% · ' + money(down);
    $('#c-rate-out').textContent = rate.toFixed(2) + '%';
    $('#c-total').textContent = money(total);
    $('#c-pi').textContent = money(pi); $('#c-taxm').textContent = money(taxM); $('#c-oth').textContent = money(oth);
    $('#c-loan').textContent = money(loan); $('#c-int').textContent = money(pi * years * 12 - loan);
    const a = pi / total * 100, b = taxM / total * 100, c = oth / total * 100;
    const set = (cls, len, off) => { const r = $('.' + cls); if (r) { r.style.strokeDasharray = Math.max(len - 0.6, 0) + ' ' + (100 - Math.max(len - 0.6, 0)); r.style.strokeDashoffset = String(-off); } };
    set('ring-pi', a, 0); set('ring-tax', b, a); set('ring-oth', c, a + b);
    [C.price, C.down, C.rate].forEach(setPct);
  }
  function useInCalculator(l) {
    if (!C.price) return;
    C.price.value = String(clamp(l.price, Number(C.price.min), Number(C.price.max)));
    exactPrice = clamp(l.price, Number(C.price.min), Number(C.price.max));
    taxTouched = !!l.tax; if (l.tax) C.tax.value = String(l.tax);
    C.hoa.value = String(l.hoa || 0);
    calc();
  }
  if (C.price) {
    [C.price, C.down, C.rate, C.term, C.ins, C.hoa].forEach(el => el.addEventListener('input', () => { if (el === C.price) exactPrice = null; calc(); }));
    C.tax.addEventListener('input', () => { taxTouched = true; calc(); });
  }

  /* ---------- pointer glow and tilt on cards ---------- */
  if (finePointer && !reduceMotion) {
    let pending = null, raf = 0;
    const apply = () => {
      raf = 0; if (!pending) return;
      const { el, e } = pending, r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--sx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--sy', (py * 100).toFixed(1) + '%');
      el.style.setProperty('--rx', ((0.5 - py) * 3.6).toFixed(2) + 'deg'); el.style.setProperty('--ry', ((px - 0.5) * 4.6).toFixed(2) + 'deg');
    };
    document.addEventListener('pointermove', e => {
      const el = e.target.closest && e.target.closest('.home, .hood, .agent');
      if (!el) return;
      pending = { el, e };
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      const el = e.target.closest && e.target.closest('.home, .hood, .agent');
      if (el && !el.contains(e.relatedTarget)) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }
    });
  }

  /* ---------- scroll reveals ---------- */
  function revealSetup() {
    const sel = '.section-head, .filters, .quick-bar, .results-bar, .step, .val-card, .band-copy, .calc-form, .calc-out, .faq, .cta-inner, .foot-brand, .foot-col, .foot-news';
    $$(sel).forEach((el, i) => { if (!el.classList.contains('reveal')) el.classList.add('reveal'); });
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach(e => e.classList.add('is-in')); return; }
    const seen = new Map();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target, sib = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal')).indexOf(el) : 0;
        el.style.setProperty('--d', Math.min(sib, 6) * 0.07 + 's');
        el.classList.add('is-in'); io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(e => io.observe(e));
    // new elements added later (steps) reveal at once
  }

  /* ---------- start ---------- */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  bindFilters();
  renderHoods();
  renderSteps('buy', false);
  renderSavedCount(false);
  calc();
  syncControls();
  render();
  revealSetup();
  // steps are re-rendered on toggle; keep them visible
  if (stepsEl) new MutationObserver(() => $$('.step', stepsEl).forEach(s => s.classList.add('is-in'))).observe(stepsEl, { childList: true });
  openFromHash();
  if (window.location.hash === '#homes') scrollToId('homes');
})();
