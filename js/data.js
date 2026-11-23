/* Nakhla — shared data layer (store + dashboard both read/write this) */
const NK = (() => {
  const KEY = 'nakhla_store_v1';
  const CART_KEY = 'nakhla_cart_v1';
  const ORD_KEY = 'nakhla_orders_v1';

  // Colour recipes for the hand-drawn SVG dates: [deep, body, highlight, cap]
  const palettes = {
    ajwa:    { label: 'Ajwa (near-black)',   c: ['#1a0d09', '#3b2018', '#7d5444', '#b89a72'] },
    sukkari: { label: 'Sukkari (golden)',    c: ['#8a4f17', '#c98a35', '#f2cf86', '#e8d6a8'] },
    medjool: { label: 'Medjool (amber)',     c: ['#4a1d0c', '#7e3b1d', '#c47a4a', '#d2b07c'] },
    safawi:  { label: 'Safawi (deep brown)', c: ['#1c100c', '#36201a', '#6b4535', '#a8865f'] },
    mabroom: { label: 'Mabroom (ruby)',      c: ['#4f1a10', '#86331f', '#c8694f', '#d8b382'] },
    khudri:  { label: 'Khudri (chestnut)',   c: ['#3e2213', '#6d4024', '#ad7b51', '#cfb084'] },
    sagai:   { label: 'Sagai (two-tone)',    c: ['#5a2c12', '#9a5a26', '#e3b76a', '#efdcae'], twoTone: true },
    barhi:   { label: 'Barhi (honey)',       c: ['#7a4a12', '#b8862e', '#f0d27a', '#eadcb0'] },
  };

  const defaults = () => ({
    settings: {
      name: 'Altayba Traders',
      arabic: 'الطيبة',
      tagline: 'Dates of Al-Madinah Al-Munawwarah',
      whatsapp: '966500000000',
      currency: 'SAR',
      address: 'Quba Road, Al-Madinah Al-Munawwarah',
      // delivery
      deliveryFee: 25,
      freeOver: 250,
      pickup: true,
      // payment methods
      payCod: true, codFee: 0,
      payBank: false, bankName: 'Al Rajhi Bank', accountTitle: 'Altayba Traders', iban: 'SA00 0000 0000 0000 0000 0000',
      payStc: false, stcNumber: '0500000000',
      payLink: false,
      catalogVersion: 2, // bump to replace saved products/categories with the default catalog
      payVersion: 2, // bump to re-apply payment defaults to saved shops
    },
    categories: [
      { id: 'c-madinah', name: 'Madinah Special', nameUr: 'مدینہ اسپیشل', nameAr: 'مميزات المدينة' },
      { id: 'c-premium', name: 'Premium Reserve', nameUr: 'پریمیم ریزرو', nameAr: 'المختارات الفاخرة' },
      { id: 'c-soft',    name: 'Soft & Fresh', nameUr: 'نرم اور تازہ', nameAr: 'طرية وطازجة' },
    ],
    products: [
      { id: 'p4', name: 'Safawi', arabic: 'صفاوي', urdu: 'صفاوی', descUr: 'لمبی، تقریباً سیاہ اور نرم، ہلکے شیرے کے ذائقے کے ساتھ۔', descAr: 'طويلة شبه سوداء وطريّة المضغ، بلمسة دبس هادئة.', categoryId: 'c-madinah', price: 55, oldPrice: 62, unit: '1 kg', stock: 52, palette: 'safawi', badge: '', image: 'images/safawi.jpg', desc: 'Long, almost black and softly chewy, with a quiet molasses finish.' },
      { id: 'p9', name: 'Amber', arabic: 'عنبرة', urdu: 'عنبر', descUr: 'بڑی، بھری ہوئی اور چمکدار کہربائی — مدینہ کی شاندار کھجوروں میں سے ایک، شہد جیسی نرم مٹھاس کے ساتھ۔', descAr: 'كبيرة ممتلئة بلون كهرماني لامع — من أفخم تمور المدينة، بقضمة عسلية طريّة.', categoryId: 'c-premium', price: 85, oldPrice: 0, unit: '1 kg', stock: 28, palette: 'medjool', badge: 'Best seller', image: 'images/amber.jpg', desc: 'Big, plump and glossy amber — one of the grandest dates of Madinah, with a honeyed, buttery bite.' },
      { id: 'p3', name: 'Medjool', arabic: 'مجدول', urdu: 'مجدول', descUr: 'بڑی، گودے والی اور ٹافی جیسی۔ مہمانوں کے آنے پر پیش کرنے والی کھجور۔', descAr: 'كبيرة لحمية بطعم التوفي. التمرة التي تقدّمها حين يحلّ الضيوف.', categoryId: 'c-premium', price: 72, oldPrice: 0, unit: '1 kg', stock: 30, palette: 'medjool', badge: '', image: 'images/medjool.jpg', desc: 'Large, fleshy and toffee-like. The one you serve when guests arrive.' },
      { id: 'p2', name: 'Sukkari', arabic: 'سكري', urdu: 'سکری', descUr: 'سنہری، جھریوں والی اور کیریمل جیسی میٹھی۔ دانت لگتے ہی براؤن شوگر کی طرح گھل جاتی ہے۔', descAr: 'ذهبية متجعدة بحلاوة الكراميل. تتفتت كالسكر البني من أول قضمة.', categoryId: 'c-soft', price: 48, oldPrice: 0, unit: '1 kg', stock: 75, palette: 'sukkari', badge: 'Melts in mouth', image: 'images/sukkari.jpg', desc: 'Golden, crinkled and caramel-sweet. Crumbles like brown sugar at the first bite.' },
      { id: 'p10', name: 'Rabia Al-Madinah', arabic: 'ربيعة المدينة', urdu: 'ربیعہ مدینہ', descUr: 'گہری سرخی مائل بھوری اور نرم چبانے والی، ہلکی میٹھی — مدینہ کی روزمرہ کی پسندیدہ کھجور۔', descAr: 'بنية مائلة إلى الحمرة، طرية المضغ وحلاوتها معتدلة — مفضّلة أهل المدينة كل يوم.', categoryId: 'c-madinah', price: 38, oldPrice: 0, unit: '1 kg', stock: 90, palette: 'khudri', badge: 'Everyday', image: 'images/rabia.jpg', desc: 'Deep reddish-brown and gently chewy, mildly sweet — a Madinah favourite for every day.' },
      { id: 'p5', name: 'Mabroom', arabic: 'مبروم', urdu: 'مبروم', descUr: 'پتلی اور یاقوتی بھوری، مضبوط چھلکا اور دیر تک رہنے والی مٹھاس۔', descAr: 'نحيلة بلون بني ياقوتي، قشرتها متماسكة وحلاوتها طويلة الأمد.', categoryId: 'c-premium', price: 68, oldPrice: 0, unit: '1 kg', stock: 24, palette: 'mabroom', badge: 'Limited', image: 'images/mabroom.jpg', desc: 'Slender and ruby-brown, firm skin and a long, slow sweetness.' },
      { id: 'p11', name: 'Mashrooq', arabic: 'مشروق', urdu: 'مشروق', descUr: 'نرم، شہد جیسی بھوری اور ہلکی میٹھی، باریک چھلکے کے ساتھ — مدینہ کے باغوں کی پرانی پہچان۔', descAr: 'طريّة بلون عسلي وحلاوة خفيفة وقشرة رقيقة — من كلاسيكيات مزارع المدينة.', categoryId: 'c-soft', price: 40, oldPrice: 0, unit: '1 kg', stock: 60, palette: 'safawi', badge: '', image: 'images/mashrooq.jpg', desc: 'Soft, honey-brown and lightly sweet, with a tender skin — a classic from the farms of Madinah.' },
      { id: 'p1', name: 'Ajwa Al-Madinah', arabic: 'عجوة المدينة', urdu: 'عجوہ مدینہ', descUr: 'نرم، گہری سیاہ اور ہلکی پھلدار — مدینہ کی پہچان، قبا کے قریب باغوں سے چنی گئی۔', descAr: 'طريّة داكنة بنكهة فاكهية لطيفة — تمرة المدينة، تُقطف من البساتين القريبة من قباء.', categoryId: 'c-madinah', price: 95, oldPrice: 110, unit: '1 kg', stock: 40, palette: 'ajwa', badge: 'Most loved', image: 'images/ajwa.jpg', desc: 'Soft, dark and gently fruity — the date of Madinah, picked from the orchards near Quba.' },
      { id: 'p7', name: 'Sagai Al-Madinah', arabic: 'صقعي المدينة', urdu: 'صقعی مدینہ', descUr: 'دو رنگی: کرکری سنہری نوک اور نرم کہربائی جسم۔ ذائقے کے شوقین کے لیے۔', descAr: 'بلونين: طرف ذهبي مقرمش وجسم كهرماني طري. لعشّاق القوام.', categoryId: 'c-madinah', price: 58, oldPrice: 0, unit: '1 kg', stock: 35, palette: 'sagai', badge: '', image: 'images/sagai.jpg', desc: 'Two-tone: crisp golden tip, soft amber body. A texture lover’s date.' },
    ],
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.products) && Array.isArray(d.categories)) {
          const hadVersion = d.settings && d.settings.payVersion;
          if (!d.settings || d.settings.catalogVersion !== 2) {
            const fresh = defaults();
            d.products = fresh.products; d.categories = fresh.categories;
            d.settings = Object.assign(d.settings || {}, { catalogVersion: 2 });
          }
          d.settings = Object.assign(defaults().settings, d.settings || {});
          const def = defaults();
          d.products.forEach((p) => {
            const src = def.products.find((x) => x.id === p.id);
            if (src) ['urdu', 'descUr', 'descAr'].forEach((k) => { if (p[k] === undefined) p[k] = src[k]; });
          });
          d.categories.forEach((c) => {
            const src = def.categories.find((x) => x.id === c.id);
            if (src) ['nameUr', 'nameAr'].forEach((k) => { if (c[k] === undefined) c[k] = src[k]; });
          });
          if (hadVersion !== 2) Object.assign(d.settings, { payCod: true, payBank: false, payStc: false, payLink: false, payVersion: 2 });
          // brand rename: shops still on the old demo name get the client's name
          if (d.settings.name === 'Nakhla') Object.assign(d.settings, { name: 'Altayba Traders', arabic: 'الطيبة' });
          return d;
        }
      }
    } catch (e) { /* storage blocked — fall back to defaults */ }
    return defaults();
  }

  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; }
    catch (e) { return false; }
  }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} return defaults(); }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} }

  /* ---------- Orders (own key, so store & dashboard never overwrite each other) ---------- */
  function loadOrders() {
    try { const o = JSON.parse(localStorage.getItem(ORD_KEY)); return Array.isArray(o) ? o : []; } catch (e) { return []; }
  }
  function saveOrders(o) {
    try { localStorage.setItem(ORD_KEY, JSON.stringify(o)); return true; } catch (e) { return false; }
  }

  const payLabels = {
    cod: 'Cash on Delivery',
    bank: 'Bank Transfer',
    stc: 'STC Pay',
    link: 'Card / Mada / Apple Pay (payment link)',
  };

  // One place for the maths so basket, checkout and dashboard always agree.
  function totals(lines, settings, deliveryMethod = 'delivery', payMethod = 'cod') {
    const subtotal = lines.reduce((a, l) => a + Number(l.price) * l.qty, 0);
    const free = Number(settings.freeOver) > 0 && subtotal >= Number(settings.freeOver);
    const delivery = deliveryMethod === 'pickup' || !lines.length || free ? 0 : Number(settings.deliveryFee || 0);
    const codFee = payMethod === 'cod' && lines.length ? Number(settings.codFee || 0) : 0;
    return { subtotal, delivery, codFee, total: subtotal + delivery + codFee, free };
  }

  const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const money = (n, cur) => `${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${typeof I18N !== 'undefined' ? I18N.cur(cur) : cur}`;

  /* ---------- Hand-drawn SVG date ---------- */
  let gid = 0;
  function oneDate(pal, x, y, rot, scale, uidp) {
    const [deep, body, hi, cap] = pal.c;
    const g = uidp;
    return `
    <g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">
      <path d="M0 -58 C20 -58 31 -26 30 8 C29 40 17 58 0 58 C-17 58 -29 40 -30 8 C-31 -26 -20 -58 0 -58Z" fill="url(#${g}b)"/>
      <path d="M0 -58 C20 -58 31 -26 30 8 C29 40 17 58 0 58 C-17 58 -29 40 -30 8 C-31 -26 -20 -58 0 -58Z" fill="url(#${g}s)"/>
      <g fill="none" stroke="${deep}" stroke-linecap="round" opacity=".55">
        <path d="M-14 -36 C-8 -30 -16 -18 -9 -10" stroke-width="1.6"/>
        <path d="M12 -30 C6 -20 15 -8 8 4" stroke-width="1.4"/>
        <path d="M-18 4 C-11 12 -19 22 -12 32" stroke-width="1.5"/>
        <path d="M16 14 C10 22 18 32 9 42" stroke-width="1.3"/>
        <path d="M-2 -46 C3 -40 -4 -30 1 -22" stroke-width="1.1"/>
      </g>
      <ellipse cx="-10" cy="-22" rx="6" ry="20" fill="#fff" opacity=".28" transform="rotate(12 -10 -22)" filter="url(#${g}f)"/>
      <path d="M-9 -55 Q0 -68 9 -55 Q0 -50 -9 -55Z" fill="${cap}"/>
      <path d="M-6 -56 Q0 -62 6 -56" fill="none" stroke="${deep}" stroke-width="1" opacity=".5"/>
    </g>`;
  }

  function dateArt(paletteKey, mode = 'cluster') {
    const pal = palettes[paletteKey] || palettes.ajwa;
    const [deep, body, hi] = pal.c;
    const g = 'nkd' + (++gid);
    const bodyStops = pal.twoTone
      ? `<stop offset="0" stop-color="${hi}"/><stop offset=".38" stop-color="${hi}"/><stop offset=".5" stop-color="${body}"/><stop offset="1" stop-color="${deep}"/>`
      : `<stop offset="0" stop-color="${hi}"/><stop offset=".45" stop-color="${body}"/><stop offset="1" stop-color="${deep}"/>`;
    const defs = `
      <defs>
        <linearGradient id="${g}b" x1=".2" y1="0" x2=".7" y2="1">${bodyStops}</linearGradient>
        <radialGradient id="${g}s" cx=".3" cy=".3" r=".9">
          <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
        </radialGradient>
        <filter id="${g}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
        <radialGradient id="${g}sh"><stop offset="0" stop-color="#1a0d06" stop-opacity=".45"/><stop offset="1" stop-color="#1a0d06" stop-opacity="0"/></radialGradient>
      </defs>`;
    if (mode === 'single') {
      return `<svg viewBox="-40 -75 80 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${oneDate(pal, 0, 0, 0, 1, g)}</svg>`;
    }
    return `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}
      <ellipse cx="120" cy="182" rx="92" ry="12" fill="url(#${g}sh)"/>
      ${oneDate(pal, 66, 112, -28, .92, g)}
      ${oneDate(pal, 176, 116, 30, .88, g)}
      ${oneDate(pal, 122, 98, 6, 1.18, g)}
    </svg>`;
  }

  return { KEY, ORD_KEY, CART_KEY, palettes, loadOrders, saveOrders, payLabels, totals, defaults, load, save, reset, loadCart, saveCart, uid, esc, money, dateArt };
})();
