/* Storefront */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let data = NK.load();
  let cart = NK.loadCart();
  let activeCat = 'all';
  let query = '';

  const cur = () => data.settings.currency || 'SAR';
  const catName = (id) => { const c = data.categories.find((x) => x.id === id); return c ? I18N.cat(c) : ''; };
  const photo = (p, cls = '') => p.image
    ? `<img src="${NK.esc(p.image)}" alt="${NK.esc(I18N.pName(p))}" loading="lazy" class="${cls}" data-palette="${NK.esc(p.palette)}" onerror="nkImgFail(this)">`
    : `<div class="art">${NK.dateArt(p.palette)}</div>`;
  // Broken photo link → fall back to the drawn date
  window.nkImgFail = (img) => {
    const d = document.createElement('div');
    d.className = 'art'; d.innerHTML = NK.dateArt(img.dataset.palette);
    img.replaceWith(d);
  };

  /* ---------- Settings bindings ---------- */
  function bindSettings() {
    document.querySelectorAll('[data-bind]').forEach((el) => {
      const k = el.dataset.bind;
      const v = data.settings[k];
      if (v) el.textContent = I18N.setting(k, v);
    });
    const wa = `https://wa.me/${String(data.settings.whatsapp).replace(/\D/g, '')}`;
    $('#footWa').href = wa;
    document.title = `${data.settings.name} — ${I18N.t('title.store')}`;
  }

  /* ---------- Marquee ---------- */
  function renderMarquee() {
    const items = data.products.map((p) => `<span>${NK.esc(I18N.pName(p))}${I18N.lang === 'ar' ? '' : ` <i class="ar">${NK.esc(p.arabic || '')}</i>`}</span>`).join('');
    $('#marquee').innerHTML = items + items;
  }

  /* ---------- Chips ---------- */
  function renderChips() {
    const counts = {};
    data.products.forEach((p) => { counts[p.categoryId] = (counts[p.categoryId] || 0) + 1; });
    const all = [{ id: 'all', name: I18N.t('shop.all') }, ...data.categories];
    if (!all.some((c) => c.id === activeCat)) activeCat = 'all';
    $('#chips').innerHTML = all.map((c) => `
      <button class="chip ${c.id === activeCat ? 'active' : ''}" role="tab" aria-selected="${c.id === activeCat}" data-cat="${c.id}">
        ${NK.esc(c.id === 'all' ? c.name : I18N.cat(c))}<small>${c.id === 'all' ? data.products.length : (counts[c.id] || 0)}</small>
      </button>`).join('');
  }

  /* ---------- Cards ---------- */
  function renderGrid() {
    const q = query.trim().toLowerCase();
    const list = data.products.filter((p) =>
      (activeCat === 'all' || p.categoryId === activeCat) &&
      (!q || `${p.name} ${p.arabic} ${p.urdu || ''} ${p.desc} ${p.descUr || ''} ${p.descAr || ''} ${catName(p.categoryId)}`.toLowerCase().includes(q)));

    $('#empty').hidden = list.length > 0;
    $('#grid').innerHTML = list.map((p, i) => {
      const out = Number(p.stock) <= 0;
      const low = !out && Number(p.stock) <= 10;
      return `
      <div class="dcard-wrap enter" style="animation-delay:${Math.min(i, 8) * 70}ms">
        <article class="dcard" data-id="${p.id}">
          <div class="dcard-plate"></div>
          <div class="dcard-inner">
            <div class="dcard-media">
              <div class="dcard-arch">${photo(p)}</div>
              ${p.badge ? `<span class="dcard-badge">${NK.esc(I18N.badge(p.badge))}</span>` : ''}
              <div class="dcard-price">
                ${Number(p.oldPrice) > Number(p.price) ? `<s>${NK.esc(p.oldPrice)}</s>` : ''}
                <b>${NK.esc(p.price)}</b><small>${NK.esc(I18N.cur(cur()))}</small>
              </div>
            </div>
            <div class="dcard-text">
              <p class="dcard-ar ${I18N.lang === 'ar' ? 'latin' : 'ar'}">${NK.esc(I18N.pAlt(p))}</p>
              <h3 class="dcard-name">${NK.esc(I18N.pName(p))}</h3>
              <p class="dcard-desc">${NK.esc(I18N.pDesc(p))}</p>
            </div>
            <div class="dcard-row">
              <span class="dcard-unit ${low || out ? 'low' : ''}">${out ? I18N.t('card.soldout') : low ? I18N.t('card.left', { n: p.stock }) : NK.esc(I18N.unit(p.unit))}</span>
              <button class="add-btn" data-add="${p.id}" ${out ? 'disabled' : ''}>${I18N.t('card.add')}</button>
            </div>
          </div>
        </article>
      </div>`;
    }).join('');
  }

  /* 3D tilt — the card leans toward the pointer, layers separate in depth */
  function tilt(e) {
    const card = e.target.closest('.dcard');
    if (!card || calm) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.classList.add('live');
    card.style.setProperty('--ry', `${(px - .5) * 22}deg`);
    card.style.setProperty('--rx', `${(.5 - py) * 18}deg`);
    card.style.setProperty('--gx', `${px * 100}%`);
    card.style.setProperty('--gy', `${py * 100}%`);
  }
  function untilt(e) {
    const card = e.target.closest('.dcard');
    if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
    card.classList.remove('live');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  }

  /* ---------- Cart ---------- */
  function cartLines() {
    return Object.entries(cart)
      .map(([id, qty]) => ({ p: data.products.find((x) => x.id === id), qty }))
      .filter((l) => l.p && l.qty > 0);
  }
  function renderCart() {
    const lines = cartLines();
    // drop items that were deleted in the dashboard
    const clean = {}; lines.forEach((l) => { clean[l.p.id] = l.qty; }); cart = clean; NK.saveCart(cart);

    const count = lines.reduce((a, l) => a + l.qty, 0);
    const total = lines.reduce((a, l) => a + l.qty * Number(l.p.price), 0);
    $('#cartCount').textContent = count;
    $('#cartTotal').textContent = NK.money(total, cur());

    $('#cartList').innerHTML = lines.length ? lines.map(({ p, qty }) => `
      <div class="citem">
        ${p.image ? `<img src="${NK.esc(p.image)}" alt="">` : `<div class="art">${NK.dateArt(p.palette)}</div>`}
        <div><h4>${NK.esc(I18N.pName(p))}</h4><p>${NK.esc(I18N.unit(p.unit))} · ${NK.money(p.price, cur())}</p></div>
        <div class="qty">
          <button data-dec="${p.id}" aria-label="${I18N.t('co.less')}">−</button><span>${qty}</span><button data-inc="${p.id}" aria-label="${I18N.t('co.more')}">+</button>
        </div>
      </div>`).join('')
      : `<div class="cart-empty"><span class="ar">تمر</span>${I18N.t('cart.empty')}</div>`;

    const msg = [`Assalamu alaikum! I'd like to order from ${data.settings.name}:`, '']
      .concat(lines.map((l) => `• ${l.p.name} (${l.p.unit || '1 kg'}) × ${l.qty} = ${NK.money(l.qty * l.p.price, cur())}`))
      .concat(['', `Total: ${NK.money(total, cur())}`]).join('\n');
    const wa = $('#waOrder');
    wa.href = `https://wa.me/${String(data.settings.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    [wa, $('#checkout')].forEach((a) => { a.style.pointerEvents = lines.length ? '' : 'none'; a.style.opacity = lines.length ? '' : '.45'; });

    const s = data.settings;
    const methods = [s.payCod && 'pay.cod', s.payBank && 'pay.bank', s.payStc && 'pay.stc', s.payLink && 'pay.link'].filter(Boolean).map((k) => I18N.t(k));
    $('#payLine').textContent = methods.length > 1 ? I18N.t('cart.payMany', { m: I18N.list(methods) }) : I18N.t('cart.payOne', { m: methods[0] || I18N.t('pay.cod') });

    // Free-delivery progress
    const free = Number(data.settings.freeOver) || 0;
    const meter = $('#shipMeter');
    meter.hidden = !free || !lines.length;
    if (free && lines.length) {
      const left = free - total;
      $('#shipText').innerHTML = left > 0
        ? I18N.t('cart.shipLeft', { amt: NK.money(left, cur()) })
        : I18N.t('cart.shipFree');
      $('#shipFill').style.width = `${Math.min(100, (total / free) * 100)}%`;
      meter.classList.toggle('done', left <= 0);
    }
  }
  function add(id, btn) {
    const p = data.products.find((x) => x.id === id);
    if (!p) return;
    const have = cart[id] || 0;
    if (Number(p.stock) > 0 && have >= Number(p.stock)) { toast(I18N.t('toast.stock', { n: p.stock, name: I18N.pName(p) })); return; }
    cart[id] = have + 1;
    NK.saveCart(cart);
    renderCart();
    const c = $('#cartCount'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    if (btn) {
      btn.classList.add('added'); btn.textContent = I18N.t('card.added');
      setTimeout(() => { btn.classList.remove('added'); btn.textContent = I18N.t('card.add'); }, 1200);
      const r = btn.getBoundingClientRect();
      window.fairyBurst && window.fairyBurst(r.left + r.width / 2, r.top + r.height / 2);
    }
    toast(I18N.t('toast.added', { name: I18N.pName(p) }));
  }
  function openCart(open) {
    $('#drawer').classList.toggle('open', open);
    $('#scrim').classList.toggle('open', open);
    $('#drawer').setAttribute('aria-hidden', String(!open));
  }

  let tt;
  function toast(t) {
    const el = $('#toast'); el.textContent = t; el.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- Hero gold dust ---------- */
  function heroDust() {
    const c = $('#heroDust'); if (!c || calm) return;
    const ctx = c.getContext('2d');
    let w, h; const dpr = Math.min(devicePixelRatio || 1, 2);
    const motes = [];
    function size() { w = c.offsetWidth; h = c.offsetHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    for (let i = 0; i < 70; i++) motes.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + .4, s: Math.random() * .35 + .1, p: Math.random() * 6.28, d: Math.random() * .6 - .3 });
    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(c);
    (function loop(t) {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const m of motes) {
          m.y -= m.s; m.x += Math.sin(t / 1600 + m.p) * .3 + m.d * .2;
          if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
          const a = .35 + Math.sin(t / 500 + m.p) * .35;
          ctx.globalAlpha = Math.max(0, a);
          ctx.fillStyle = '#f4cd7c'; ctx.shadowColor = '#f4cd7c'; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.28); ctx.fill();
        }
      }
      requestAnimationFrame(loop);
    })(0);
  }

  /* ---------- Scroll effects ---------- */
  function scrollFx() {
    const nav = $('#nav'), hero = $('#heroImg');
    const onScroll = () => {
      const y = scrollY;
      nav.classList.toggle('solid', y > 60);
      if (!calm && y < innerHeight * 1.2) hero.style.translate = `0 ${y * .3}px`;
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    const io = new IntersectionObserver((ens) => ens.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: .15 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }

  function renderAll() { bindSettings(); renderMarquee(); renderChips(); renderGrid(); renderCart(); }

  /* ---------- Events ---------- */
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    activeCat = b.dataset.cat; renderChips(); renderGrid();
  });
  $('#search').addEventListener('input', (e) => { query = e.target.value; renderGrid(); });
  $('#grid').addEventListener('mousemove', tilt);
  $('#grid').addEventListener('mouseout', untilt);
  $('#grid').addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b) add(b.dataset.add, b); });
  $('#cartList').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (inc) add(inc.dataset.inc);
    if (dec) { const id = dec.dataset.dec; cart[id] = (cart[id] || 1) - 1; if (cart[id] <= 0) delete cart[id]; NK.saveCart(cart); renderCart(); }
  });
  $('#cartBtn').addEventListener('click', () => openCart(true));
  $('#closeCart').addEventListener('click', () => openCart(false));
  $('#scrim').addEventListener('click', () => openCart(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') openCart(false); });

  // Dashboard open in another tab? Pick up its changes live.
  addEventListener('storage', (e) => {
    if (e.key === NK.KEY) { data = NK.load(); renderAll(); toast(I18N.t('toast.updated')); }
  });

  I18N.mountSwitchers();
  I18N.apply();
  document.addEventListener('langchange', () => {
    renderAll();
    // headings were re-written; let them show straight away
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  });

  renderAll();
  scrollFx();
  heroDust();
})();
