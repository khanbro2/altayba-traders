/* Admin login for the dashboard.
   Static site, no server: this keeps casual visitors out of the dashboard UI.
   The password is never stored in plain text — only a SHA-256 hash. */
(() => {
  const SALT = 'altayba-admin|';
  const CRED_KEY = 'nakhla_admin_v1';          // {user, hash} after a password change
  const SESS_KEY = 'nakhla_admin_session';     // session (tab) or remembered (7 days)
  const LOCK_KEY = 'nakhla_admin_lock';
  const DEFAULT = { user: 'admin', hash: '5578eff4a82f8ae3a4d3f7ed21fca579cd8712ae8b0341846afd57c8bd5f18b8' };
  const REMEMBER_MS = 7 * 24 * 3600 * 1000;

  const safe = (fn, fb) => { try { return fn(); } catch { return fb; } };
  const cred = () => safe(() => JSON.parse(localStorage.getItem(CRED_KEY)), null) || DEFAULT;
  const hash = async (user, pass) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + user.trim().toLowerCase() + '|' + pass));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  const readSession = () => safe(() => JSON.parse(sessionStorage.getItem(SESS_KEY) || localStorage.getItem(SESS_KEY)), null);
  const valid = () => {
    const s = readSession(), c = cred();
    return !!s && s.hash === c.hash && s.user === c.user && (!s.exp || s.exp > Date.now());
  };
  const startSession = (remember) => {
    const c = cred();
    const s = JSON.stringify({ user: c.user, hash: c.hash, exp: remember ? Date.now() + REMEMBER_MS : 0 });
    safe(() => (remember ? localStorage : sessionStorage).setItem(SESS_KEY, s));
  };
  const endSession = () => safe(() => { sessionStorage.removeItem(SESS_KEY); localStorage.removeItem(SESS_KEY); });

  // Decide before the page paints, so the dashboard never flashes
  const root = document.documentElement;
  if (!valid()) root.classList.add('locked');

  function buildGate() {
    const g = document.createElement('div');
    g.className = 'gate';
    g.innerHTML = `
      <div class="gate-bg" aria-hidden="true"></div>
      <form class="gate-card" id="gateForm" novalidate>
        <div class="gate-arch" aria-hidden="true"><span class="ar">الطيبة</span></div>
        <p class="gate-kicker">Admin only</p>
        <h1 class="gate-title">Welcome back</h1>
        <p class="gate-sub">Sign in to manage products, prices and orders.</p>
        <label class="gate-f"><span>Username</span><input name="user" autocomplete="username" required autocapitalize="off" spellcheck="false"></label>
        <label class="gate-f"><span>Password</span>
          <span class="gate-pw"><input name="pass" type="password" autocomplete="current-password" required>
          <button type="button" class="gate-eye" aria-label="Show password">Show</button></span></label>
        <label class="gate-check"><input type="checkbox" name="remember"> Keep me signed in for 7 days</label>
        <p class="gate-err" role="alert" aria-live="assertive"></p>
        <button class="gate-btn">Sign in <i aria-hidden="true">→</i></button>
        <a class="gate-back" href="index.html">← Back to the shop</a>
      </form>`;
    document.body.prepend(g);

    const f = g.querySelector('form'), err = g.querySelector('.gate-err'), btn = g.querySelector('.gate-btn');
    const eye = g.querySelector('.gate-eye');
    eye.addEventListener('click', () => {
      const show = f.pass.type === 'password';
      f.pass.type = show ? 'text' : 'password';
      eye.textContent = show ? 'Hide' : 'Show';
      eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });

    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lock = safe(() => JSON.parse(sessionStorage.getItem(LOCK_KEY)), null) || { n: 0, until: 0 };
      if (lock.until > Date.now()) {
        err.textContent = `Too many tries. Wait ${Math.ceil((lock.until - Date.now()) / 1000)} seconds.`;
        return;
      }
      const user = f.user.value.trim(), pass = f.pass.value;
      if (!user || !pass) { err.textContent = 'Enter your username and password.'; return; }
      btn.disabled = true;
      const c = cred();
      const ok = user.toLowerCase() === c.user && (await hash(user, pass)) === c.hash;
      btn.disabled = false;
      if (!ok) {
        lock.n += 1;
        if (lock.n >= 5) { lock.until = Date.now() + 30000; lock.n = 0; }
        safe(() => sessionStorage.setItem(LOCK_KEY, JSON.stringify(lock)));
        err.textContent = lock.until > Date.now() ? 'Too many tries. Wait 30 seconds.' : 'Wrong username or password.';
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        f.pass.select();
        return;
      }
      safe(() => sessionStorage.removeItem(LOCK_KEY));
      startSession(f.remember.checked);
      f.reset(); err.textContent = '';
      g.classList.add('leaving');
      setTimeout(() => { root.classList.remove('locked'); g.classList.remove('leaving'); }, 450);
    });
    if (root.classList.contains('locked')) setTimeout(() => f.user.focus(), 60);
  }

  function buildLogout() {
    const side = document.querySelector('.side-store');
    if (!side) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'side-logout';
    b.textContent = 'Sign out';
    b.addEventListener('click', () => {
      endSession();
      root.classList.add('locked');
      document.querySelector('#gateForm input[name=user]')?.focus();
    });
    side.after(b);
  }

  function buildPasswordPanel() {
    const tab = document.getElementById('tab-settings');
    if (!tab) return;
    const p = document.createElement('form');
    p.className = 'panel form';
    p.id = 'pwForm';
    p.noValidate = true;
    p.innerHTML = `
      <h2>Admin login</h2>
      <p class="muted">Change the username and password used to open this dashboard.</p>
      <div class="row2">
        <label>Username<input name="user" autocomplete="username" required autocapitalize="off" spellcheck="false"></label>
        <label>Current password<input name="old" type="password" autocomplete="current-password" required></label>
      </div>
      <div class="row2">
        <label><span>New password <small>(at least 8 characters)</small></span><input name="pass" type="password" autocomplete="new-password" minlength="8" required></label>
        <label>Repeat new password<input name="pass2" type="password" autocomplete="new-password" required></label>
      </div>
      <div class="actions left"><button class="btn primary">Update login</button></div>`;
    tab.appendChild(p);
    p.user.value = cred().user;

    p.addEventListener('submit', async (e) => {
      e.preventDefault();
      const say = (m) => (window.nkToast ? window.nkToast(m) : alert(m));
      const c = cred();
      const user = p.user.value.trim().toLowerCase();
      if ((await hash(c.user, p.old.value)) !== c.hash) return say('Current password is wrong');
      if (!/^[a-z0-9._-]{3,30}$/.test(user)) return say('Username: 3–30 letters, numbers, dot, dash');
      if (p.pass.value.length < 8) return say('New password needs at least 8 characters');
      if (p.pass.value !== p.pass2.value) return say('The two new passwords do not match');
      const next = { user, hash: await hash(user, p.pass.value) };
      safe(() => localStorage.setItem(CRED_KEY, JSON.stringify(next)));
      const remembered = !!safe(() => localStorage.getItem(SESS_KEY), null);
      endSession(); startSession(remembered);
      p.old.value = p.pass.value = p.pass2.value = '';
      say('Login updated');
    });
  }

  // Another tab signed out or changed the password → lock this one too
  addEventListener('storage', (e) => {
    if ((e.key === SESS_KEY || e.key === CRED_KEY) && !valid()) root.classList.add('locked');
  });

  document.addEventListener('DOMContentLoaded', () => { buildGate(); buildLogout(); buildPasswordPanel(); });
})();
