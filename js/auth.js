/* Admin login for the dashboard — checked by the server (api/admin.php, PHP session + bcrypt).
   The dashboard stays hidden until the server says this browser is signed in. */
(() => {
  const root = document.documentElement;
  root.classList.add('locked');

  async function call(action, body) {
    const opt = { credentials: 'same-origin', cache: 'no-store', headers: {} };
    if (body !== undefined) {
      opt.method = 'POST';
      opt.headers['Content-Type'] = 'application/json';
      opt.headers['X-Requested-With'] = 'altayba';
      opt.body = JSON.stringify(body);
    }
    try {
      const r = await fetch('api/admin.php?a=' + action, opt);
      const j = await r.json();
      j.status = r.status;
      return j;
    } catch (e) { return { ok: false, error: 'Cannot reach the server. Check your internet.' }; }
  }
  window.nkAdmin = { call };

  let signedIn = false;
  function unlock(user) {
    signedIn = true;
    root.classList.remove('locked');
    document.dispatchEvent(new CustomEvent('nk-auth', { detail: { user } }));
  }
  function lock() {
    signedIn = false;
    root.classList.add('locked');
    document.dispatchEvent(new CustomEvent('nk-signout'));
    setTimeout(() => document.querySelector('#gateForm input[name=user]')?.focus(), 60);
  }
  // dashboard.js calls this when any request comes back 401 (session expired)
  window.nkSessionExpired = () => { if (signedIn) { lock(); } };

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
      const user = f.user.value.trim(), pass = f.pass.value;
      if (!user || !pass) { err.textContent = 'Enter your username and password.'; return; }
      btn.disabled = true; err.textContent = '';
      const r = await call('login', { user, pass, remember: f.remember.checked });
      btn.disabled = false;
      if (!r.ok) {
        err.textContent = r.error || 'Wrong username or password.';
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        f.pass.select();
        return;
      }
      f.reset();
      g.classList.add('leaving');
      setTimeout(() => { g.classList.remove('leaving'); unlock(r.user); }, 450);
    });
  }

  function buildLogout() {
    const side = document.querySelector('.side-store');
    if (!side) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'side-logout';
    b.textContent = 'Sign out';
    b.addEventListener('click', async () => { await call('logout', {}); lock(); });
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
      <p class="muted">Change the username and password used to open this dashboard. Other signed-in devices will be signed out.</p>
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
    document.addEventListener('nk-auth', (e) => { p.user.value = e.detail.user || ''; });

    p.addEventListener('submit', async (e) => {
      e.preventDefault();
      const say = (m) => window.nkToast && window.nkToast(m);
      if (p.pass.value.length < 8) return say('New password needs at least 8 characters');
      if (p.pass.value !== p.pass2.value) return say('The two new passwords do not match');
      const r = await call('change_password', { user: p.user.value.trim(), old: p.old.value, pass: p.pass.value });
      if (r.status === 401) return window.nkSessionExpired();
      if (!r.ok) return say(r.error || 'Could not update the login');
      p.old.value = p.pass.value = p.pass2.value = '';
      p.user.value = r.user;
      say('Login updated');
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    buildGate(); buildLogout(); buildPasswordPanel();
    const r = await call('me');
    if (r.ok) unlock(r.user);
    else document.querySelector('#gateForm input[name=user]')?.focus();
  });
})();
