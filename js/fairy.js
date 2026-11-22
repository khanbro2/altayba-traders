/* Cursor: a little Ajwa date, leaving gold dust behind it.
   The tip of the date is the click point, just like a normal arrow cursor. */
(() => {
  const fine = window.matchMedia('(pointer: fine)').matches;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine) return;

  document.documentElement.classList.add('fairy-on');

  const SZ = 72;               // drawn size in px
  const VB = 100;              // svg viewBox size
  const TIP = { x: 33, y: 38 }; // date tip inside the viewBox = hotspot

  const el = document.createElement('div');
  el.className = 'fairy';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
  <svg viewBox="0 0 ${VB} ${VB}" width="${SZ}" height="${SZ}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="cdBody" cx=".35" cy=".3" r=".85">
        <stop offset="0" stop-color="#4d2b22"/>
        <stop offset=".45" stop-color="#24110c"/>
        <stop offset="1" stop-color="#0a0403"/>
      </radialGradient>
      <linearGradient id="cdRim" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stop-color="#9a6150" stop-opacity=".65"/>
        <stop offset=".22" stop-color="#9a6150" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="cdGlow">
        <stop offset="0" stop-color="#ffd98a" stop-opacity=".5"/>
        <stop offset="1" stop-color="#ffd98a" stop-opacity="0"/>
      </radialGradient>
      <filter id="cdSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
    </defs>

    <circle cx="52" cy="50" r="42" fill="url(#cdGlow)" class="c-glow"/>

    <!-- Ajwa date: plump, near-black, finely crinkled; tip points up-left -->
    <g transform="rotate(-40 48 56)">
      <path d="M48 33 C59 33 63.5 44 63.5 56 C63.5 69 57.5 79 48 79 C38.5 79 32.5 69 32.5 56 C32.5 44 37 33 48 33Z" fill="url(#cdBody)"/>
      <path d="M48 33 C59 33 63.5 44 63.5 56 C63.5 69 57.5 79 48 79 C38.5 79 32.5 69 32.5 56 C32.5 44 37 33 48 33Z" fill="url(#cdRim)"/>
      <!-- fine crinkle network (dark grooves) -->
      <g fill="none" stroke="#000" stroke-linecap="round" opacity=".42">
        <path d="M35 46 Q39 43.5 43 46.5 Q47 49 51 45.5 Q55 43 60 46" stroke-width="1"/>
        <path d="M34 53 Q38 50 42 53.5 Q46 56 50 52.5 Q55 50 62 53" stroke-width="1.1"/>
        <path d="M34 60 Q38.5 57.5 43 60.5 Q47 63 51.5 59.5 Q56 57 62.5 60" stroke-width="1.1"/>
        <path d="M35 67 Q39 64.5 43.5 67.5 Q48 70 52 66.5 Q56 64.5 61 67" stroke-width="1"/>
        <path d="M38 73.5 Q42 71.5 46 74 Q50 76 54 73 Q57 71.5 59 73" stroke-width=".9"/>
        <path d="M40 39.5 Q44 37.5 48 40 Q52 42 56 39" stroke-width=".9"/>
        <path d="M44 47 L42.5 52 M53 50 L54.5 55.5 M40 56 L39 60 M47 61 L46 66 M55 63 L56 67.5" stroke-width=".7"/>
      </g>
      <!-- light catching the ridge between grooves -->
      <g fill="none" stroke="#8a5a47" stroke-linecap="round" opacity=".45">
        <path d="M36 48.5 Q39.5 46 43 48.5" stroke-width=".7"/>
        <path d="M35 55.5 Q39 53 42.5 56" stroke-width=".7"/>
        <path d="M35.5 62.5 Q39.5 60 43.5 63" stroke-width=".7"/>
        <path d="M37 69.5 Q40.5 67 44 69.5" stroke-width=".6"/>
      </g>
      <!-- soft, matte sheen (Ajwa is not glassy) -->
      <ellipse cx="40.5" cy="49" rx="3" ry="10" fill="#c99a82" opacity=".22" filter="url(#cdSoft)"/>
      <ellipse cx="40" cy="45" rx=".9" ry="3.2" fill="#f3dccd" opacity=".45"/>
      <!-- pale calyx cap at the tip -->
      <path d="M43 35 Q48 26 53 35 Q48 38 43 35Z" fill="#cfae7e"/>
      <path d="M45.3 34 Q48 30 50.7 34" fill="none" stroke="#7d5a36" stroke-width=".8"/>
    </g>

    <!-- twinkle -->
    <path d="M80 72 l1.6 4.2 4.2 1.6 -4.2 1.6 -1.6 4.2 -1.6 -4.2 -4.2 -1.6 4.2 -1.6Z" fill="#ffe7a8" class="c-twinkle"/>
  </svg>`;
  document.body.appendChild(el);

  const cvs = document.createElement('canvas');
  cvs.className = 'fairy-dust';
  cvs.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cvs);
  const ctx = cvs.getContext('2d');
  let W = 0, H = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cvs.width = W * dpr; cvs.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  const HX = TIP.x * SZ / VB, HY = TIP.y * SZ / VB;
  let mx = W / 2, my = H / 2, px = mx, py = my, tilt = 0, seen = false;
  const parts = [];
  const colors = ['#ffd98a', '#f2c14e', '#fff3d1', '#e9a23b', '#f7e2b0'];

  function spawn(x, y, n, burst) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = burst ? 1.5 + Math.random() * 3.5 : Math.random() * .5;
      parts.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (burst ? 1 : 0),
        life: 1, decay: burst ? .018 + Math.random() * .02 : .022 + Math.random() * .025,
        r: burst ? 1.5 + Math.random() * 2.5 : .7 + Math.random() * 1.6,
        c: colors[(Math.random() * colors.length) | 0],
        star: Math.random() < (burst ? .5 : .25),
      });
    }
    if (parts.length > 400) parts.splice(0, parts.length - 400);
  }

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!seen) { px = mx; py = my; seen = true; el.classList.add('show'); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => el.classList.remove('show'));
  document.addEventListener('mouseenter', () => { if (seen) el.classList.add('show'); });
  window.addEventListener('mousedown', (e) => {
    el.classList.add('tap');
    if (!calm) spawn(e.clientX, e.clientY, 26, true);
  });
  window.addEventListener('mouseup', () => el.classList.remove('tap'));
  document.addEventListener('mouseover', (e) => {
    const hot = e.target.closest('a, button, [role="button"], input, select, textarea, label, .chip, .dcard, summary');
    el.classList.toggle('hover', !!hot);
  });

  function drawStar(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * .35 : r * 1.6;
      const a = i * Math.PI / 4;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }

  function tick() {
    // Position follows the mouse exactly (so clicks land where you expect);
    // only the lean is smoothed, which gives the flying feel.
    const vx = mx - px, vy = my - py;
    px = mx; py = my;
    const target = calm ? 0 : Math.max(-16, Math.min(16, vx * 1.4));
    tilt += (target - tilt) * .15;
    const bob = calm ? 0 : Math.sin(performance.now() / 300) * 1.2;
    el.style.transform = `translate3d(${mx - HX}px, ${my - HY + bob}px, 0)`;
    el.firstElementChild.style.rotate = `${tilt}deg`;

    if (!calm && seen) {
      const speed = Math.hypot(vx, vy);
      // dust trails from the back of the date, not from the tip
      const tx = mx + 22 * SZ / VB, ty = my + 24 * SZ / VB;
      if (speed > 1) spawn(tx + (Math.random() - .5) * 8, ty + (Math.random() - .5) * 8, Math.min(3, 1 + (speed / 10) | 0), false);
      else if (Math.random() < .08) spawn(tx, ty, 1, false);
    }

    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += .035; p.vx *= .98;
      p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.c;
      ctx.shadowColor = p.c; ctx.shadowBlur = 8;
      if (p.star) drawStar(p.x, p.y, p.r * p.life + .4);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life + .3, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Other scripts can ask for a burst (e.g. "added to basket")
  window.fairyBurst = (x, y) => { if (!calm) spawn(x, y, 34, true); };
})();
