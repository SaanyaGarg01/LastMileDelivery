// Tiny fetch wrapper + auth/session helpers shared by every page.
const API_BASE = '/api';

function getSession() {
  const raw = localStorage.getItem('dt_session');
  return raw ? JSON.parse(raw) : null;
}
function setSession(session) {
  localStorage.setItem('dt_session', JSON.stringify(session));
}
function clearSession() {
  localStorage.removeItem('dt_session');
}
function requireSession(allowedRoles) {
  const s = getSession();
  if (!s || !s.token) {
    window.location.href = '/pages/login.html';
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(s.user.role)) {
    window.location.href = '/pages/login.html';
    return null;
  }
  return s;
}

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const s = getSession();
    if (s?.token) headers.Authorization = `Bearer ${s.token}`;
  }
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* no body */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.details = data && data.details;
    err.status = res.status;
    throw err;
  }
  return data;
}

function fmtMoney(n) {
  return 'Rs. ' + Number(n).toFixed(2);
}
function fmtDate(s) {
  if (!s) return '-';
  return new Date(s.replace(' ', 'T') + 'Z').toLocaleString();
}
function statusClass(status) {
  return status.replace(/\s+/g, '');
}
function renderTopbar(activeLabel) {
  const s = getSession();
  const el = document.getElementById('topbar');
  if (!el) return;
  el.innerHTML = `
    <div class="brand">Last-Mile <span>Delivery Tracker</span></div>
    <nav>
      <span class="muted" style="color:#cbd5e1">${s ? `${s.user.name} (${s.user.role})` : ''}</span>
      <button id="logoutBtn">Logout</button>
    </nav>
  `;
  const btn = document.getElementById('logoutBtn');
  if (btn) btn.onclick = () => { clearSession(); window.location.href = '/pages/login.html'; };
}
