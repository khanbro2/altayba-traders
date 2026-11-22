/* Checkout: details → delivery → payment → order saved + sent on WhatsApp */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#coForm');
  let data = NK.load();
  let cart = NK.loadCart();
  const S = () => data.settings;
  const cur = () => S().currency || 'SAR';
  const waNum = () => String(S().whatsapp || '').replace(/\D/g, '');

  function bindSettings() {
    document.querySelectorAll('[data-bind]').forEach((el) => { const k = el.dataset.bind; const v = S()[k]; if (v) el.textContent = I18N.setting(k, v); });
    document.title = `${S().name} — ${I18N.t('title.checkout')}`;
  }

  function lines() {
    return Object.entries(cart)
      .map(([id, qty]) => { const p = data.products.find((x) => x.id === id); return p && qty > 0 ? { ...p, qty } : null; })
      .filter(Boolean);
  }
  const deliveryMethod = () => (form.delivery.value || 'delivery');
  const payMethod = () => (form.pay && form.pay.value) || '';

  /* ---------- Payment options from settings ---------- */
  const ico = {
    cod: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 9v.01M18 15v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    bank: '<svg viewBox="0 0 24 24"><path d="M3 9 12 4l9 5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    stc: '<svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 18.5h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9.5 9.5c1-1.4 4-1.4 5 0M10.8 11.6c.6-.6 1.8-.6 2.4 0" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    link: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 9.5h19M6 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  };
  function payOptions() {
    const s = S();
    const opts = [];
    const t = I18N.t;
    const codSub = Number(s.codFee) > 0 ? t('pay.cod.fee', { amt: NK.money(s.codFee, cur()) }) : t('pay.cod.sub');
    if (s.payCod) opts.push(['cod', t('pay.cod'), codSub]);
    if (s.payBank) opts.push(['bank', t('pay.bank'), s.bankName || t('pay.bank.sub')]);
    if (s.payStc) opts.push(['stc', t('pay.stc'), t('pay.stc.sub')]);
    if (s.payLink) opts.push(['link', t('pay.link'), t('pay.link.sub')]);
    if (!opts.length) opts.push(['cod', t('pay.cod'), codSub]);
    const keep = payMethod();
    $('#payOpts').innerHTML = opts.map(([v, title, sub], i) => `
      <label class="opt"><input type="radio" name="pay" value="${v}" ${(keep ? v === keep : i === 0) ? 'checked' : ''}>
        <span class="opt-ico" aria-hidden="true">${ico[v]}</span>
        <span class="opt-t"><b>${title}</b></span><span class="opt-p">${NK.esc(sub)}</span></label>`).join('');
    if (!form.querySelector('input[name=pay]:checked')) { const f = form.querySelector('input[name=pay]'); if (f) f.checked = true; }
  }
  const copyRow = (label, val) => `<div class="copy"><span>${label ? `${label}: ` : ''}<bdi>${NK.esc(val)}</bdi></span><button type="button" data-copy="${NK.esc(val)}">${I18N.t('pay.copy')}</button></div>`;
  function payInstructions(method, total, orderNo) {
    const s = S();
    const t = I18N.t;
    const amt = NK.money(total, cur());
    switch (method) {
      case 'bank': return `<p>${t('pay.i.bank', { amt })}</p>${copyRow(t('pay.l.bank'), s.bankName)}${copyRow(t('pay.l.name'), s.accountTitle)}${copyRow('IBAN', s.iban)}<p>${orderNo ? t('pay.i.bankAfterNo', { no: orderNo }) : t('pay.i.bankAfter')}</p>`;
      case 'stc': return `<p>${t('pay.i.stc', { amt })}</p>${copyRow('', s.stcNumber)}<p>${t('pay.i.stcAfter')}</p>`;
      case 'link': return `<p>${t('pay.i.link', { amt })}</p>`;
      default: return `<p>${t(deliveryMethod() === 'pickup' ? 'pay.i.codPickup' : 'pay.i.cod', { amt })}</p>`;
    }
  }

  /* ---------- Render summary ---------- */
  function render() {
    const ls = lines();
    if (!ls.length) { $('#coView').hidden = true; $('#emptyView').hidden = false; return; }
    const t = NK.totals(ls, S(), deliveryMethod(), payMethod());

    $('#sumItems').innerHTML = ls.map((l) => `
      <div class="si">
        <div class="si-img">${l.image ? `<img src="${NK.esc(l.image)}" alt="">` : NK.dateArt(l.palette)}</div>
        <div><h4>${NK.esc(I18N.pName(l))}</h4>
          <div class="qty"><button type="button" data-dec="${l.id}" aria-label="${I18N.t('co.less')}">−</button><span>${l.qty}</span><button type="button" data-inc="${l.id}" aria-label="${I18N.t('co.more')}">+</button></div>
        </div>
        <span class="si-p">${NK.money(l.price * l.qty, cur())}</span>
      </div>`).join('');

    $('#sSub').textContent = NK.money(t.subtotal, cur());
    const sd = $('#sDel');
    sd.textContent = t.delivery ? NK.money(t.delivery, cur()) : I18N.t('co.free');
    sd.className = t.delivery ? '' : 'free';
    $('#sCodRow').hidden = !t.codFee;
    $('#sCod').textContent = NK.money(t.codFee, cur());
    $('#sTotal').textContent = NK.money(t.total, cur());

    const free = Number(S().freeOver) || 0;
    $('#delFee').textContent = t.free ? I18N.t('co.free') : NK.money(S().deliveryFee, cur());
    $('#delNote').textContent = free && !t.free ? I18N.t('co.home.noteFree', { amt: NK.money(free, cur()) }) : I18N.t('co.home.note');
    $('#pickupOpt').hidden = !S().pickup;
    $('#addressBlock').classList.toggle('hide', deliveryMethod() === 'pickup');
    $('#payInfo').innerHTML = payInstructions(payMethod(), t.total);
  }

  /* ---------- Validation ---------- */
  const phoneOk = (v) => { const d = v.replace(/[^\d]/g, ''); return d.length >= 9 && d.length <= 15; };
  const emailOk = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  function check(name) {
    const el = form[name]; if (!el) return true;
    const v = el.value.trim();
    let ok = true;
    if (name === 'name') ok = v.length >= 2;
    if (name === 'phone') ok = phoneOk(v);
    if (name === 'email') ok = emailOk(v);
    if (name === 'city' || name === 'address') ok = deliveryMethod() === 'pickup' || v.length >= (name === 'address' ? 5 : 1);
    el.closest('.f').classList.toggle('bad', !ok);
    return ok;
  }
  ['name', 'phone', 'email', 'city', 'address'].forEach((n) => form[n].addEventListener('blur', () => check(n)));
  form.addEventListener('input', (e) => { const f = e.target.closest('.f.bad'); if (f) check(e.target.name); });

  /* ---------- Events ---------- */
  form.addEventListener('change', (e) => { if (e.target.name === 'delivery' || e.target.name === 'pay') render(); });
  $('#sumItems').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (inc) {
      const p = data.products.find((x) => x.id === inc.dataset.inc);
      if (Number(cart[p.id]) >= Number(p.stock)) { toast(I18N.t('toast.stock', { n: p.stock, name: I18N.pName(p) })); return; }
      cart[p.id] = (cart[p.id] || 0) + 1;
    }
    if (dec) { const id = dec.dataset.dec; cart[id] = (cart[id] || 1) - 1; if (cart[id] <= 0) delete cart[id]; }
    if (inc || dec) { NK.saveCart(cart); render(); }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    const done = () => { b.textContent = I18N.t('pay.copied'); setTimeout(() => { b.textContent = I18N.t('pay.copy'); }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, () => toast(I18N.t('toast.copyFail')));
    else toast(I18N.t('toast.copyFail'));
  });

  /* ---------- Place order ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const okAll = ['name', 'phone', 'email', 'city', 'address'].map(check).every(Boolean);
    if (!okAll) { const bad = $('.f.bad'); bad && bad.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast(I18N.t('toast.fix')); return; }

    // Re-read stock right now in case the dashboard changed it
    data = NK.load();
    const ls = lines();
    if (!ls.length) { render(); return; }
    const short = ls.find((l) => Number(l.qty) > Number(l.stock));
    if (short) {
      if (Number(short.stock) <= 0) delete cart[short.id]; else cart[short.id] = Number(short.stock);
      NK.saveCart(cart); render();
      toast(Number(short.stock) <= 0 ? I18N.t('toast.soldout', { name: I18N.pName(short) }) : I18N.t('toast.fewLeft', { n: short.stock, name: I18N.pName(short) }));
      return;
    }

    const btn = $('#placeBtn'); btn.classList.add('busy');
    const t = NK.totals(ls, S(), deliveryMethod(), payMethod());
    const d = new Date();
    const no = `NK-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = {
      id: no, createdAt: d.toISOString(), status: 'new', currency: cur(),
      customer: {
        name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(),
        city: deliveryMethod() === 'pickup' ? '' : form.city.value, district: form.district.value.trim(),
        address: deliveryMethod() === 'pickup' ? '' : form.address.value.trim(), notes: form.notes.value.trim(),
      },
      delivery: deliveryMethod(), payment: payMethod() || 'cod', paid: false,
      items: ls.map((l) => ({ id: l.id, name: l.name, unit: l.unit, price: Number(l.price), qty: l.qty, image: l.image, palette: l.palette })),
      subtotal: t.subtotal, deliveryFee: t.delivery, codFee: t.codFee, total: t.total,
    };

    // Reserve stock, save order, empty the basket
    ls.forEach((l) => { const p = data.products.find((x) => x.id === l.id); p.stock = Math.max(0, Number(p.stock) - l.qty); });
    const orders = NK.loadOrders(); orders.unshift(order);
    if (!NK.saveOrders(orders) || !NK.save(data)) { btn.classList.remove('busy'); toast(I18N.t('toast.saveFail')); return; }
    NK.saveCart({});
    setTimeout(() => showDone(order), 500);
  });

  function waMessage(o) {
    const L = [
      `Assalamu alaikum! New order *${o.id}*`, '',
      ...o.items.map((i) => `• ${i.name} (${i.unit || '1 kg'}) × ${i.qty} = ${NK.money(i.price * i.qty, o.currency)}`), '',
      `Subtotal: ${NK.money(o.subtotal, o.currency)}`,
      `Delivery: ${o.deliveryFee ? NK.money(o.deliveryFee, o.currency) : 'Free'}`,
      ...(o.codFee ? [`COD fee: ${NK.money(o.codFee, o.currency)}`] : []),
      `*Total: ${NK.money(o.total, o.currency)}*`, '',
      `Payment: ${NK.payLabels[o.payment]}`,
      `Name: ${o.customer.name}`, `Phone: ${o.customer.phone}`,
      o.delivery === 'pickup' ? 'Pickup from shop' : `Address: ${[o.customer.address, o.customer.district, o.customer.city].filter(Boolean).join(', ')}`,
      ...(o.customer.notes ? [`Note: ${o.customer.notes}`] : []),
    ];
    return L.join('\n');
  }

  let placed = null;
  function showDone(o, quiet) {
    placed = o;
    $('#coView').hidden = true;
    $('#doneView').hidden = false;
    $('#stepDone').classList.add('on');
    scrollTo({ top: 0 });
    $('#dNo').textContent = o.id;
    $('#dPay').innerHTML = `<h3>${I18N.t('pay.' + o.payment)}</h3>${payInstructions(o.payment, o.total, o.id)}`;
    $('#dWa').href = `https://wa.me/${waNum()}?text=${encodeURIComponent(waMessage(o))}`;
    const t = I18N.t;
    $('#dSummary').innerHTML = `<h3>${t('done.summary')}</h3><ul class="done-lines">
      ${o.items.map((i) => { const p = data.products.find((x) => x.id === i.id) || i; return `<li><span>${NK.esc(I18N.pName(p))} × ${i.qty}</span><span>${NK.money(i.price * i.qty, o.currency)}</span></li>`; }).join('')}
      <li><span>${t('co.delivery')}</span><span>${o.deliveryFee ? NK.money(o.deliveryFee, o.currency) : t('co.free')}</span></li>
      ${o.codFee ? `<li><span>${t('co.codFee')}</span><span>${NK.money(o.codFee, o.currency)}</span></li>` : ''}
      <li><span>${t('co.total')}</span><span>${NK.money(o.total, o.currency)}</span></li></ul>`;
    if (!quiet) celebrate();
  }

  function celebrate() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const pals = ['ajwa', 'sukkari', 'medjool', 'mabroom', 'barhi'];
    for (let i = 0; i < 26; i++) {
      const el = document.createElement('div');
      el.className = 'fall';
      el.innerHTML = NK.dateArt(pals[i % pals.length], 'single');
      el.style.left = `${Math.random() * 100}vw`;
      el.style.width = `${14 + Math.random() * 14}px`;
      el.style.setProperty('--r', `${(Math.random() - .5) * 720}deg`);
      el.style.animationDuration = `${2.4 + Math.random() * 2}s`;
      el.style.animationDelay = `${Math.random() * .8}s`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5500);
    }
    const r = $('.done-seal').getBoundingClientRect();
    setTimeout(() => window.fairyBurst && window.fairyBurst(r.left + r.width / 2, r.top + r.height / 2), 900);
  }

  let tt;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2600); }

  I18N.mountSwitchers();
  I18N.apply();
  bindSettings();
  document.addEventListener('langchange', () => {
    bindSettings();
    if (placed) { showDone(placed, true); return; }
    payOptions(); render();
  });

  payOptions();
  render();
})();
