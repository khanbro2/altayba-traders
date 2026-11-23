/* Dashboard — manage products, prices, categories, orders and shop settings.
   Everything is read from and written to the MySQL database through api/admin.php. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  let data = { settings: NK.defaults().settings, categories: [], products: [] };
  let orders = [];
  let oStatus = 'all';
  let editingId = null;
  let pendingImage = '';

  const cur = () => data.settings.currency || 'SAR';
  // One door to the server: handles sign-out, errors, and folds fresh data back in
  async function adm(action, body, okMsg) {
    const r = await NK.api('admin.php?a=' + action, body);
    if (r.status === 401) { window.nkSessionExpired && window.nkSessionExpired(); return null; }
    if (!r.ok) { toast(r.error === 'network' ? 'Cannot reach the server — check your internet' : (r.error || 'Could not save')); renderAll(); return null; }
    if (r.settings) data.settings = Object.assign(NK.defaults().settings, r.settings);
    if (r.categories) data.categories = r.categories;
    if (r.products) data.products = r.products;
    if (r.orders) orders = r.orders;
    if (okMsg) toast(okMsg);
    renderAll();
    return r;
  }

  /* ---------- Tabs ---------- */
  function go(tab) {
    document.querySelectorAll('.side-nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.id === `tab-${tab}`));
    scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('#sideNav').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });

  /* ---------- Overview ---------- */
  function renderOverview() {
    const ps = data.products;
    const units = ps.reduce((a, p) => a + Number(p.stock || 0), 0);
    const value = ps.reduce((a, p) => a + Number(p.stock || 0) * Number(p.price || 0), 0);
    const avg = ps.length ? ps.reduce((a, p) => a + Number(p.price || 0), 0) / ps.length : 0;
    const live = orders.filter((o) => o.status !== 'cancelled');
    const revenue = live.reduce((a, o) => a + Number(o.total || 0), 0);
    const fresh = orders.filter((o) => o.status === 'new').length;
    $('#stats').innerHTML = [
      ['Sales (all orders)', Math.round(revenue).toLocaleString('en-US'), cur()],
      ['New orders', fresh, ''],
      ['Stock value', Math.round(value).toLocaleString('en-US'), cur()],
      ['Products', ps.length, `avg ${avg.toFixed(0)} ${cur()}`],
    ].map(([l, v, s]) => `<div class="stat"><div class="stat-l">${l}</div><div class="stat-v">${v}<small>${s}</small></div></div>`).join('');

    const byCat = data.categories.map((c) => ({ name: c.name, n: ps.filter((p) => p.categoryId === c.id).reduce((a, p) => a + Number(p.stock || 0), 0) }));
    const max = Math.max(1, ...byCat.map((b) => b.n));
    $('#catBars').innerHTML = byCat.length ? byCat.map((b) => `
      <div class="bar-row"><span>${NK.esc(b.name)}</span><div class="bar-track"><div class="bar-fill" data-w="${(b.n / max) * 100}"></div></div><b>${b.n}</b></div>`).join('')
      : '<p class="muted">No categories yet.</p>';
    requestAnimationFrame(() => document.querySelectorAll('.bar-fill').forEach((el) => { el.style.width = el.dataset.w + '%'; }));

    $('#recentList').innerHTML = orders.length
      ? orders.slice(0, 4).map((o) => `<li class="clickable" data-open-orders><span>${NK.esc(o.id)} · ${NK.esc(o.customer.name)}</span><span class="st st-${o.status}">${STATUS[o.status]}</span></li>`).join('')
      : '<li class="ok">No orders yet — they appear here after checkout.</li>';

    const low = ps.filter((p) => Number(p.stock) <= 10).sort((a, b) => a.stock - b.stock);
    $('#lowList').innerHTML = low.length
      ? low.map((p) => `<li><span>${NK.esc(p.name)}</span><b>${Number(p.stock) <= 0 ? 'Sold out' : `${p.stock} left`}</b></li>`).join('')
      : '<li class="ok">Everything is well stocked ✓</li>';
  }

  /* ---------- Orders ---------- */
  const STATUS = { new: 'New', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
  const fmtDate = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function renderOrders() {
    const fresh = orders.filter((o) => o.status === 'new').length;
    $('#newBadge').hidden = !fresh; $('#newBadge').textContent = fresh;
    const q = $('#oSearch').value.trim().toLowerCase();
    const list = orders.filter((o) => (oStatus === 'all' || o.status === oStatus) &&
      (!q || `${o.id} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(q)));
    $('#oList').innerHTML = list.length ? list.map((o) => {
      const c = o.customer;
      const phone = c.phone.replace(/\D/g, '').replace(/^0/, '966');
      const where = o.delivery === 'pickup' ? 'Pickup from shop' : [c.address, c.district, c.city].filter(Boolean).join(', ');
      const payName = (NK.payLabels[o.payment] || '').split(' (')[0];
      return `<details class="order st-b-${o.status}">
        <summary>
          <span class="o-id">${NK.esc(o.id)}</span>
          <span class="o-who"><b>${NK.esc(c.name)}</b><small>${fmtDate(o.createdAt)} · ${o.items.reduce((a, i) => a + i.qty, 0)} items</small></span>
          <span class="o-pay">${NK.esc(payName)}${o.paid ? ' <em class="paid">Paid</em>' : ''}</span>
          <span class="o-total">${NK.money(o.total, o.currency)}</span>
          <span class="st st-${o.status}">${STATUS[o.status]}</span>
        </summary>
        <div class="o-body">
          <div>
            <h4>Items</h4>
            <ul class="o-items">${o.items.map((i) => `<li><span>${NK.esc(i.name)} <small>${NK.esc(i.unit || '')}</small> × ${i.qty}</span><b>${NK.money(i.price * i.qty, o.currency)}</b></li>`).join('')}
              <li><span>Delivery</span><b>${o.deliveryFee ? NK.money(o.deliveryFee, o.currency) : 'Free'}</b></li>
              ${o.codFee ? `<li><span>COD fee</span><b>${NK.money(o.codFee, o.currency)}</b></li>` : ''}
              <li class="tot"><span>Total</span><b>${NK.money(o.total, o.currency)}</b></li></ul>
          </div>
          <div>
            <h4>Customer</h4>
            <p>${NK.esc(c.name)}<br><a href="tel:${NK.esc(c.phone)}">${NK.esc(c.phone)}</a>${c.email ? `<br>${NK.esc(c.email)}` : ''}</p>
            <p>${NK.esc(where)}</p>
            ${c.notes ? `<p class="o-note">“${NK.esc(c.notes)}”</p>` : ''}
            <div class="o-act">
              <label>Status <select data-status="${o.id}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
              <label class="check"><input type="checkbox" data-paid="${o.id}" ${o.paid ? 'checked' : ''}> Payment received</label>
              <a class="btn small" href="https://wa.me/${phone}?text=${encodeURIComponent(`Assalamu alaikum ${c.name}, about your order ${o.id} from ${data.settings.name}:`)}" target="_blank" rel="noopener">WhatsApp customer</a>
            </div>
          </div>
        </div>
      </details>`;
    }).join('') : `<div class="panel empty-orders"><span class="ar">طلبات</span><p>${orders.length ? 'No orders match this filter.' : 'No orders yet. When a customer checks out, the order shows up here.'}</p></div>`;
  }
  $('#oSearch').addEventListener('input', renderOrders);
  $('#oFilter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    oStatus = b.dataset.st;
    $('#oFilter').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    renderOrders();
  });
  $('#oList').addEventListener('change', (e) => {
    const sid = e.target.dataset.status, pid = e.target.dataset.paid;
    if (sid) {
      // The server returns stock to the shelf on cancel (and takes it again on un-cancel)
      const o = orders.find((x) => x.id === sid); const now = e.target.value; const was = o.status;
      o.status = now;
      adm('order_status', { id: sid, status: now }, now === 'cancelled' ? 'Order cancelled — stock returned' : `Order marked ${STATUS[now].toLowerCase()}`)
        .then((r) => { if (!r) { o.status = was; renderAll(); } });
    }
    if (pid) {
      const o = orders.find((x) => x.id === pid); const paid = e.target.checked;
      o.paid = paid;
      adm('order_paid', { id: pid, paid }, paid ? 'Marked as paid' : 'Marked as unpaid').then((r) => { if (!r) { o.paid = !paid; renderAll(); } });
    }
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-open-orders]')) go('orders'); });

  /* ---------- Products ---------- */
  function catOptions(sel, withAll) {
    return (withAll ? '<option value="all">All categories</option>' : '') +
      data.categories.map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${NK.esc(c.name)}</option>`).join('');
  }
  function thumb(p) {
    return p.image ? `<img src="${NK.esc(p.image)}" alt="" loading="lazy">` : NK.dateArt(p.palette);
  }
  function renderProducts() {
    const f = $('#pFilter'), keep = f.value || 'all';
    f.innerHTML = catOptions(keep, true);
    if (![...f.options].some((o) => o.value === keep)) f.value = 'all';
    const q = $('#pSearch').value.trim().toLowerCase();
    const list = data.products.filter((p) => (f.value === 'all' || p.categoryId === f.value) && (!q || `${p.name} ${p.arabic}`.toLowerCase().includes(q)));
    $('#pRows').innerHTML = list.length ? list.map((p) => {
      const cat = data.categories.find((c) => c.id === p.categoryId);
      return `<tr>
        <td><div class="pcell"><div class="thumb">${thumb(p)}</div><div><b>${NK.esc(p.name)}</b><span class="ar">${NK.esc(p.arabic || '')}</span></div></div></td>
        <td><span class="tag">${cat ? NK.esc(cat.name) : '—'}</span></td>
        <td><input class="price-in" type="number" min="0" step="0.5" value="${NK.esc(p.price)}" data-price="${p.id}" aria-label="Price of ${NK.esc(p.name)}"> <small>${NK.esc(cur())}</small></td>
        <td><span class="stock-pill ${Number(p.stock) <= 10 ? 'low' : ''}">${NK.esc(p.stock)}</span></td>
        <td><div class="row-act"><button data-edit="${p.id}">Edit</button><button class="del" data-del="${p.id}">Delete</button></div></td>
      </tr>`;
    }).join('') : '<tr class="empty-row"><td colspan="5">No products here yet.</td></tr>';
  }
  $('#pSearch').addEventListener('input', renderProducts);
  $('#pFilter').addEventListener('change', renderProducts);
  $('#pRows').addEventListener('change', (e) => {
    const id = e.target.dataset.price; if (!id) return;
    const v = Number(e.target.value);
    if (!(v >= 0)) { e.target.value = data.products.find((p) => p.id === id).price; return; }
    adm('set_price', { id, price: v }, 'Price updated');
  });
  $('#pRows').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) openEditor(ed.dataset.edit);
    if (del) {
      const b = del;
      if (b.dataset.armed) {
        adm('delete_product', { id: b.dataset.del }, 'Product deleted');
      } else {
        b.dataset.armed = '1'; b.textContent = 'Sure?';
        setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Delete'; } }, 2500);
      }
    }
  });

  /* ---------- Editor modal ---------- */
  const form = $('#pForm');
  $('#pPal').innerHTML = Object.entries(NK.palettes).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

  function updatePreview() {
    const img = pendingImage || form.image.value.trim();
    $('#pPreview').innerHTML = img ? `<img src="${NK.esc(img)}" alt="Preview">` : NK.dateArt(form.palette.value);
    const im = $('#pPreview img');
    if (im) im.onerror = () => { $('#pPreview').innerHTML = NK.dateArt(form.palette.value); };
  }
  function openEditor(id) {
    if (!data.categories.length) { toast('Add a category first'); go('categories'); return; }
    editingId = id || null;
    const p = id ? data.products.find((x) => x.id === id) : { name: '', arabic: '', categoryId: data.categories[0].id, unit: '1 kg', price: '', oldPrice: '', stock: '', badge: '', palette: 'ajwa', image: '', desc: '' };
    $('#pFormTitle').textContent = id ? `Edit ${p.name}` : 'New product';
    $('#pCat').innerHTML = catOptions(p.categoryId);
    ['name', 'arabic', 'urdu', 'unit', 'price', 'stock', 'badge', 'desc', 'descUr', 'descAr'].forEach((k) => { form[k].value = p[k] ?? ''; });
    form.oldPrice.value = Number(p.oldPrice) > 0 ? p.oldPrice : '';
    form.palette.value = p.palette || 'ajwa';
    pendingImage = p.image && p.image.startsWith('data:') ? p.image : '';
    form.image.value = pendingImage ? '' : (p.image || '');
    form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
    updatePreview();
    $('#modal').classList.add('open'); $('#modal').setAttribute('aria-hidden', 'false');
    setTimeout(() => form.name.focus(), 50);
  }
  function closeEditor() { $('#modal').classList.remove('open'); $('#modal').setAttribute('aria-hidden', 'true'); }

  $('#newProduct').addEventListener('click', () => openEditor());
  document.querySelector('[data-new]').addEventListener('click', () => { go('products'); openEditor(); });
  $('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeEditor(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeEditor(); });
  form.palette.addEventListener('change', updatePreview);
  form.image.addEventListener('input', () => { pendingImage = ''; updatePreview(); });
  $('#pClearImg').addEventListener('click', () => { pendingImage = ''; form.image.value = ''; updatePreview(); });

  // Uploaded photos are shrunk to ~900px in the browser, then saved as a file on the server
  $('#pFile').addEventListener('change', (e) => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        pendingImage = c.toDataURL('image/jpeg', .82);
        form.image.value = '';
        updatePreview();
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = form.querySelector('.primary');
    if (saveBtn.disabled) return;
    let ok = true;
    ['name', 'price', 'stock'].forEach((k) => {
      const bad = k === 'name' ? !form[k].value.trim() : !(form[k].value !== '' && Number(form[k].value) >= 0);
      form[k].classList.toggle('invalid', bad); if (bad) ok = false;
    });
    if (!ok) { toast('Please fill name, price and stock'); return; }
    const p = {
      id: editingId || NK.uid('p'),
      name: form.name.value.trim(),
      arabic: form.arabic.value.trim(),
      categoryId: form.categoryId.value,
      unit: form.unit.value.trim() || '1 kg',
      price: Number(form.price.value),
      oldPrice: Number(form.oldPrice.value) || 0,
      stock: Math.floor(Number(form.stock.value)),
      badge: form.badge.value.trim(),
      palette: form.palette.value,
      image: pendingImage || form.image.value.trim(),
      desc: form.desc.value.trim(),
      urdu: form.urdu.value.trim(),
      descUr: form.descUr.value.trim(),
      descAr: form.descAr.value.trim(),
    };
    saveBtn.disabled = true;
    const r = await adm('save_product', { product: p, isNew: !editingId }, editingId ? 'Product saved' : 'Product added to the store');
    saveBtn.disabled = false;
    if (!r) return;
    closeEditor();
    const rb = saveBtn.getBoundingClientRect();
    window.fairyBurst && window.fairyBurst(rb.left + rb.width / 2, rb.top);
  });

  /* ---------- Categories ---------- */
  function renderCategories() {
    $('#catGrid').innerHTML = data.categories.map((c) => {
      const n = data.products.filter((p) => p.categoryId === c.id).length;
      return `<div class="cat-card">
        <div class="ico">✦</div>
        <input value="${NK.esc(c.name)}" data-rename="${c.id}" data-field="name" maxlength="40" aria-label="Category name (English)">
        <input class="cat-tr" dir="rtl" value="${NK.esc(c.nameUr || '')}" data-rename="${c.id}" data-field="nameUr" maxlength="40" placeholder="اردو نام" aria-label="Category name (Urdu)">
        <input class="cat-tr" dir="rtl" value="${NK.esc(c.nameAr || '')}" data-rename="${c.id}" data-field="nameAr" maxlength="40" placeholder="الاسم بالعربية" aria-label="Category name (Arabic)">
        <p>${n} product${n === 1 ? '' : 's'}</p>
        <button class="btn small danger" data-delcat="${c.id}">Delete</button>
      </div>`;
    }).join('') || '<p class="muted">No categories yet — add your first one above.</p>';
  }
  $('#catForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#catName').value.trim(); if (!name) return;
    if (data.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) { toast('That category already exists'); return; }
    adm('add_category', { name }, `“${name}” added`).then((r) => { if (r) $('#catName').value = ''; });
  });
  $('#catGrid').addEventListener('change', (e) => {
    const id = e.target.dataset.rename; if (!id) return;
    const field = e.target.dataset.field || 'name';
    const v = e.target.value.trim();
    const c = data.categories.find((x) => x.id === id);
    if (field === 'name' && !v) { e.target.value = c.name; return; }
    adm('update_category', { id, field, value: v }, 'Category saved');
  });
  $('#catGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-delcat]'); if (!b) return;
    const id = b.dataset.delcat;
    const n = data.products.filter((p) => p.categoryId === id).length;
    if (n) { toast(`Move or delete its ${n} product${n === 1 ? '' : 's'} first`); return; }
    if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Sure?'; return; }
    adm('delete_category', { id }, 'Category deleted');
  });

  /* ---------- Settings ---------- */
  function renderSettings() {
    const f = $('#setForm');
    Object.keys(data.settings).forEach((k) => {
      const el = f[k]; if (!el) return;
      if (el.type === 'checkbox') el.checked = !!data.settings[k]; else el.value = data.settings[k];
    });
    document.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = data.settings[el.dataset.bind] || el.textContent; });
  }
  $('#setForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const s = {};
    ['name', 'arabic', 'tagline', 'whatsapp', 'currency', 'address', 'bankName', 'accountTitle', 'iban', 'stcNumber'].forEach((k) => { s[k] = f[k].value.trim(); });
    ['deliveryFee', 'freeOver', 'codFee'].forEach((k) => { s[k] = Math.max(0, Number(f[k].value) || 0); });
    ['pickup', 'payCod', 'payBank', 'payStc', 'payLink'].forEach((k) => { s[k] = f[k].checked; });
    adm('save_settings', { settings: s }, 'Settings saved');
  });
  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `altayba-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    file.text().then((t) => {
      const d = JSON.parse(t);
      if (!Array.isArray(d.products) || !Array.isArray(d.categories)) throw new Error('bad');
      return adm('import', { settings: d.settings || {}, categories: d.categories, products: d.products }, 'Backup restored');
    }).catch(() => toast('That file is not an Altayba Traders backup'));
  });

  let tt;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2200); }
  window.nkToast = toast;

  function renderAll() { renderOrders(); renderOverview(); renderProducts(); renderCategories(); renderSettings(); }

  // Load everything once the server confirms the sign-in, then check for new orders every 30 seconds
  let poll = null;
  document.addEventListener('nk-auth', async () => {
    await adm('bootstrap');
    clearInterval(poll);
    poll = setInterval(async () => {
      if (document.hidden || $('#modal').classList.contains('open')) return;
      const r = await NK.api('admin.php?a=orders');
      if (r.status === 401) { window.nkSessionExpired && window.nkSessionExpired(); return; }
      if (!r.ok) return;
      const known = new Set(orders.map((o) => o.id));
      const fresh = r.orders.filter((o) => !known.has(o.id)).length;
      orders = r.orders; data.products = r.products;
      renderAll();
      if (fresh) toast(fresh === 1 ? 'New order received ✦' : `${fresh} new orders received ✦`);
    }, 30000);
  });
  document.addEventListener('nk-signout', () => { clearInterval(poll); orders = []; data.products = []; data.categories = []; renderAll(); });
  renderAll();
})();
