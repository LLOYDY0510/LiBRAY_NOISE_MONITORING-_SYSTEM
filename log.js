// ============================================================
//  LibraryQuiet – login.js
//  Updated: role-based redirect after login
// ============================================================

// ── ACCOUNTS ─────────────────────────────────────────────────
const ACCOUNTS = [
  {
    email:    'admin@library.edu',
    password: 'admin123',
    name:     'Johnlloyd P.',
    role:     'Administrator',
    redirect: 'admin.html'      // ← Admin goes here
  },
  {
    email:    'james@library.edu',
    password: 'james123',
    name:     'James Anticamars',
    role:     'Library Manager',
    redirect: 'manager.html'    // ← Manager goes here
  },
  {
    email:    'staff@library.edu',
    password: 'staff123',
    name:     'Dimavier',
    role:     'Library Staff',
    redirect: 'dashboard-manager.html'    // ← Staff uses manager view (no admin pages)
  },
];

// ── STATE ─────────────────────────────────────────────────────
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  generateParticles();
  startClock();
  loadRemembered();

  // Enter key submits login
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});

// ── CLOCK ─────────────────────────────────────────────────────
function startClock() {
  const update = () => {
    const now = new Date();
    const el  = document.getElementById('login-time');
    if (el) el.textContent = now.toLocaleTimeString('en-PH');
  };
  update();
  setInterval(update, 1000);
}

// ── REMEMBER ME ───────────────────────────────────────────────
function loadRemembered() {
  const saved = localStorage.getItem('lq_remember');
  if (saved) {
    document.getElementById('email').value    = saved;
    document.getElementById('remember').checked = true;
  }
}

function toggleRemember() {
  const cb    = document.getElementById('remember');
  const email = document.getElementById('email').value.trim();
  if (cb.checked && email) {
    localStorage.setItem('lq_remember', email);
  } else {
    localStorage.removeItem('lq_remember');
  }
}

// ── TOGGLE PASSWORD ───────────────────────────────────────────
function togglePassword() {
  const pw  = document.getElementById('password');
  const btn = document.getElementById('toggle-pw');
  if (pw.type === 'password') {
    pw.type  = 'text';
    btn.textContent = '🙈';
  } else {
    pw.type  = 'password';
    btn.textContent = '👁';
  }
}

// ── FILL DEMO ACCOUNTS ────────────────────────────────────────
function fillAdmin() {
  document.getElementById('email').value    = 'admin@library.edu';
  document.getElementById('password').value = 'admin123';
  clearError();
}

function fillManager() {
  document.getElementById('email').value    = 'james@library.edu';
  document.getElementById('password').value = 'james123';
  clearError();
}

function fillStaff() {
  document.getElementById('email').value    = 'staff@library.edu';
  document.getElementById('password').value = 'staff123';
  clearError();
}

// ── FORGOT PASSWORD ───────────────────────────────────────────
function forgotPassword() {
  const email = document.getElementById('email').value.trim();
  const found = ACCOUNTS.find(a => a.email === email);
  if (found) {
    showError(`📧 Password reset link sent to ${email}`, 'info');
  } else if (email) {
    showError('No account found with that email address.', 'error');
  } else {
    showError('Please enter your email first.', 'error');
  }
}

// ── VALIDATE ──────────────────────────────────────────────────
function validateInputs(email, password) {
  if (!email)    { showError('Please enter your email address.'); return false; }
  if (!password) { showError('Please enter your password.');      return false; }
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) { showError('Please enter a valid email address.'); return false; }
  return true;
}

// ── MAIN LOGIN ────────────────────────────────────────────────
function doLogin() {
  const emailEl = document.getElementById('email');
  const pwEl    = document.getElementById('password');
  const btn     = document.getElementById('login-btn');

  if (!emailEl || !pwEl) return;

  const email    = emailEl.value.trim();
  const password = pwEl.value.trim();

  // Locked out?
  if (loginAttempts >= MAX_ATTEMPTS) {
    showError(`🔒 Account locked. Too many failed attempts. Please try again later.`);
    return;
  }

  if (!validateInputs(email, password)) {
    shakeForm();
    return;
  }

  // Disable button while "loading"
  btn.disabled    = true;
  btn.textContent = 'Signing in...';
  clearError();

  // Simulate network delay
  setTimeout(() => {
    const account = ACCOUNTS.find(
      a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );

    if (account) {
      // ── SUCCESS ──
      loginAttempts = 0;

      // Save remember me
      const cb = document.getElementById('remember');
      if (cb && cb.checked) {
        localStorage.setItem('lq_remember', email);
      } else {
        localStorage.removeItem('lq_remember');
      }

      // Save session
      sessionStorage.setItem('lq_user', JSON.stringify({
        name:  account.name || account.email,
        email: account.email,
        role:  account.role,
      }));

      // Show success overlay then redirect
      loginSuccess(account);

    } else {
      // ── FAILED ──
      loginAttempts++;
      const remaining = MAX_ATTEMPTS - loginAttempts;

      if (remaining <= 0) {
        showError('🔒 Account locked after 5 failed attempts.');
      } else {
        showError(`❌ Incorrect email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      }

      shakeForm();
      btn.disabled    = false;
      btn.textContent = 'Sign In';
    }
  }, 1200);
}

// ── SUCCESS OVERLAY ───────────────────────────────────────────
function loginSuccess(account) {
  // Show success screen if it exists
  const overlay = document.getElementById('success-overlay');
  const nameEl  = document.getElementById('success-name');
  const roleEl  = document.getElementById('success-role');

  if (overlay) {
    if (nameEl) nameEl.textContent = account.name;
    if (roleEl) roleEl.textContent = account.role;
    overlay.style.display = 'flex';

    // Animate progress bar
    const bar = document.getElementById('progress-bar');
    if (bar) {
      bar.style.width = '0%';
      setTimeout(() => { bar.style.transition = 'width 1.5s ease'; bar.style.width = '100%'; }, 50);
    }
  }

  // Redirect after delay
  setTimeout(() => {
    window.location.href = account.redirect;   // ← Role-based redirect!
  }, 1800);
}

// ── HELPERS ───────────────────────────────────────────────────
function showError(msg, type = 'error') {
  const el = document.getElementById('error-msg');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = type === 'info' ? '#dbeafe' : '#fee2e2';
  el.style.color      = type === 'info' ? '#1e3a8a' : '#991b1b';
}

function clearError() {
  const el = document.getElementById('error-msg');
  if (el) el.style.display = 'none';
}

function shakeForm() {
  const form = document.getElementById('login-card') || document.querySelector('.login-card');
  if (!form) return;
  form.classList.remove('shake');
  void form.offsetWidth;
  form.classList.add('shake');
  setTimeout(() => form.classList.remove('shake'), 600);
}

// ── PARTICLES ─────────────────────────────────────────────────
function generateParticles() {
  const wrap = document.getElementById('particles');
  if (!wrap) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      width:${4 + Math.random()*8}px;
      height:${4 + Math.random()*8}px;
      animation-delay:${Math.random()*6}s;
      animation-duration:${6 + Math.random()*8}s;
      opacity:${0.1 + Math.random()*0.25};
    `;
    wrap.appendChild(p);
  }
}