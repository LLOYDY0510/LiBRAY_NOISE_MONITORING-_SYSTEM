// ============================================================
//  LibraryQuiet – users.js  (uses AppData)
// ============================================================

const ROLE_INFO = {
  'Administrator': {
    color:'av-admin', badge:'b-blue', label:'👑 Administrator',
    access: ['Full system access','Manage all users','View & delete reports','Configure settings','Manage zones & sensors'],
  },
  'Library Manager': {
    color:'av-manager', badge:'b-teal', label:'📋 Library Manager',
    access: ['View live monitoring','Acknowledge alerts','Generate & send reports','View zone data'],
  },
  'Library Staff': {
    color:'av-staff', badge:'b-purple', label:'👤 Library Staff',
    access: ['View live monitoring','View alert logs','View reports (read-only)'],
  },
};

let currentFilters = { search:'', role:'', status:'' };
let deactTargetId  = null;
let deactAction    = '';  // 'deactivate' | 'activate'
let viewTargetId   = null;

function el(id)        { return document.getElementById(id); }
function setText(id,v) { const e=el(id); if(e) e.textContent=v; }
function initial(name) { return name ? name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : '?'; }
function avClass(role) { return ROLE_INFO[role]?.color || 'av-staff'; }

// ── CLOCK ──────────────────────────────────────────────────
function startClock() {
  const update = () => {
    const now = new Date();
    setText('tb-date', now.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-PH'));
  };
  update(); setInterval(update, 1000);
}
function toggleSidebar() { el('sidebar').classList.toggle('collapsed'); }

// ── STATS ──────────────────────────────────────────────────
function renderStats() {
  const users = AppData.getUsers();
  setText('s-total',    users.length);
  setText('s-active',   users.filter(u=>u.status==='active').length);
  setText('s-managers', users.filter(u=>u.role==='Library Manager').length);
  setText('s-inactive', users.filter(u=>u.status==='inactive').length);
}

// ── FILTER ─────────────────────────────────────────────────
function getFiltered() {
  return AppData.getUsers().filter(u => {
    const s = currentFilters.search.toLowerCase();
    const matchSearch = !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    const matchRole   = !currentFilters.role   || u.role   === currentFilters.role;
    const matchStatus = !currentFilters.status || u.status === currentFilters.status;
    return matchSearch && matchRole && matchStatus;
  });
}

function filterUsers() {
  currentFilters.search = el('search-input').value;
  currentFilters.role   = el('role-filter').value;
  currentFilters.status = el('status-filter').value;
  renderCards(); renderTable();
}

// ── USER CARDS ─────────────────────────────────────────────
function renderCards() {
  const grid  = el('user-grid'); if (!grid) return;
  const users = getFiltered();

  if (users.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--light);background:#fff;border-radius:var(--radius);box-shadow:0 1px 8px rgba(0,0,0,.07);">No users match your filters.</div>`;
    return;
  }

  grid.innerHTML = users.map(u => {
    const ri         = ROLE_INFO[u.role] || ROLE_INFO['Library Staff'];
    const init       = initial(u.name);
    const isInactive = u.status === 'inactive';
    const statusBadge= isInactive ? '<span class="badge b-gray">Inactive</span>' : '<span class="badge b-green">Active</span>';
    const roleBadge  = `<span class="badge ${ri.badge}">${ri.label}</span>`;
    const deactBtn   = isInactive
      ? `<button class="uc-btn uc-react" onclick="openDeactModal('${u.id}','activate',event)">🔓 Activate</button>`
      : `<button class="uc-btn uc-deact" onclick="openDeactModal('${u.id}','deactivate',event)">🔒 Deactivate</button>`;
    return `
    <div class="user-card ${isInactive?'inactive':''}" onclick="openViewModal('${u.id}')">
      <div class="uc-top">
        <div class="uc-av ${ri.color}">${init}</div>
        <div>
          <div class="uc-name">${u.name}</div>
          <div class="uc-email">${u.email}</div>
        </div>
      </div>
      <div class="uc-divider"></div>
      <div class="uc-meta">
        ${roleBadge}
        ${statusBadge}
      </div>
      <div class="uc-last">Last login: ${u.lastLogin||'Never'}</div>
      <div style="height:10px;"></div>
      <div class="uc-actions" onclick="event.stopPropagation()">
        <button class="uc-btn uc-view" onclick="openViewModal('${u.id}')">👁 View</button>
        <button class="uc-btn uc-edit" onclick="openEditModal('${u.id}')">✏️ Edit</button>
        ${deactBtn}
      </div>
    </div>`;
  }).join('');
}

// ── TABLE ──────────────────────────────────────────────────
function renderTable() {
  const tbody = el('users-tbody'); if (!tbody) return;
  const users = getFiltered();
  setText('tbl-count', `${users.length} user${users.length!==1?'s':''}`);

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--light);">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map((u,i) => {
    const ri         = ROLE_INFO[u.role] || ROLE_INFO['Library Staff'];
    const isInactive = u.status === 'inactive';
    const statusBadge= isInactive ? '<span class="badge b-gray">Inactive</span>' : '<span class="badge b-green">Active</span>';
    const roleBadge  = `<span class="badge ${ri.badge}">${ri.label}</span>`;
    const deactBtn   = isInactive
      ? `<button class="tbl-btn tb-react" onclick="openDeactModal('${u.id}','activate',event)">🔓 Activate</button>`
      : `<button class="tbl-btn tb-deact" onclick="openDeactModal('${u.id}','deactivate',event)">🔒 Deactivate</button>`;
    return `<tr>
      <td class="mono">${u.id||('U-'+String(i+1).padStart(3,'0'))}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="user-av-sm ${ri.color}">${initial(u.name)}</div>
          <span style="font-weight:700;">${u.name}</span>
        </div>
      </td>
      <td class="mono">${u.email}</td>
      <td>${roleBadge}</td>
      <td>${statusBadge}</td>
      <td style="font-size:12px;color:var(--muted);">${u.lastLogin||'Never'}</td>
      <td style="font-size:12px;color:var(--muted);">${u.createdAt||AppData.today()}</td>
      <td>
        <div class="action-btns">
          <button class="tbl-btn tb-view" onclick="openViewModal('${u.id}')">👁</button>
          <button class="tbl-btn tb-edit" onclick="openEditModal('${u.id}')">✏️</button>
          ${deactBtn}
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── ADD MODAL ──────────────────────────────────────────────
function openAddModal() {
  el('edit-id').value = '';
  setText('modal-title', 'Add New User');
  setText('modal-sub',   'Fill in user details');
  el('modal-save-btn').textContent = 'Save User';
  clearForm(); clearFormErrors();
  showModal('modal-overlay','user-modal');
}

// ── EDIT MODAL ─────────────────────────────────────────────
function openEditModal(id) {
  const u = AppData.getUsers().find(x=>x.id===id); if (!u) return;
  el('edit-id').value = id;
  setText('modal-title', 'Edit User');
  setText('modal-sub',   `Editing: ${u.name}`);
  el('modal-save-btn').textContent = 'Update User';
  el('f-name').value     = u.name;
  el('f-email').value    = u.email;
  el('f-password').value = u.password || '';
  el('f-role').value     = u.role;
  el('f-status').value   = u.status;
  updateRoleInfoBox(u.role);
  clearFormErrors();
  showModal('modal-overlay','user-modal');
}

// ── ROLE INFO BOX ──────────────────────────────────────────
el('f-role').addEventListener('change', function() { updateRoleInfoBox(this.value); });

function updateRoleInfoBox(role) {
  const box = el('role-info-box'); if (!box) return;
  const ri  = ROLE_INFO[role];
  if (!ri) { box.style.display='none'; return; }
  box.style.display = 'block';
  box.innerHTML = `<div class="rib-title">Access Level — ${ri.label}</div>` +
    ri.access.map(a=>`<div class="rib-item">✓ ${a}</div>`).join('');
}

// ── SAVE USER ──────────────────────────────────────────────
function saveUser() {
  const name   = el('f-name').value.trim();
  const email  = el('f-email').value.trim();
  const pw     = el('f-password').value.trim();
  const role   = el('f-role').value;
  const status = el('f-status').value;
  const editId = el('edit-id').value;

  clearFormErrors();
  let valid = true;
  if (!name)                { showFieldError('f-name','Name is required');       valid=false; }
  if (!email||!email.includes('@')) { showFieldError('f-email','Valid email required'); valid=false; }
  if (!pw&&!editId)         { showFieldError('f-password','Password is required'); valid=false; }
  if (!role)                { showFieldError('f-role','Please select a role');   valid=false; }
  if (!valid) return;

  // Duplicate email check
  const existingEmail = AppData.getUsers().find(u=>u.email===email && u.id!==editId);
  if (existingEmail) { showFieldError('f-email','Email already in use'); return; }

  if (editId) {
    const updates = { name, email, role, status };
    if (pw) updates.password = pw;
    AppData.updateUser(editId, updates);
    showToast(`✅ User "${name}" updated!`, 'success');
  } else {
    const users  = AppData.getUsers();
    const nextId = 'U-' + String(users.length + 1).padStart(3,'0');
    AppData.addUser({ id:nextId, name, email, password:pw, role, status, lastLogin:'Never', createdAt:AppData.today() });
    showToast(`✅ User "${name}" added!`, 'success');
  }

  closeModal(); renderStats(); renderCards(); renderTable();
}

// ── VIEW MODAL ─────────────────────────────────────────────
function openViewModal(id) {
  const u = AppData.getUsers().find(x=>x.id===id); if (!u) return;
  viewTargetId = id;
  const ri    = ROLE_INFO[u.role] || ROLE_INFO['Library Staff'];
  const stLbl = u.status==='active' ? '🟢 Active' : '⚫ Inactive';
  el('view-title').textContent = u.name;
  el('view-body').innerHTML = `
    <div class="view-avatar">
      <div class="va-circle ${ri.color}">${initial(u.name)}</div>
      <div class="va-name">${u.name}</div>
      <div class="va-role">${ri.label}</div>
    </div>
    <div class="view-grid">
      <div class="view-field"><div class="vf-label">User ID</div><div class="vf-val mono">${u.id||'—'}</div></div>
      <div class="view-field"><div class="vf-label">Status</div><div class="vf-val">${stLbl}</div></div>
      <div class="view-field" style="grid-column:1/-1"><div class="vf-label">Email</div><div class="vf-val mono" style="font-size:13px;">${u.email}</div></div>
      <div class="view-field"><div class="vf-label">Last Login</div><div class="vf-val">${u.lastLogin||'Never'}</div></div>
      <div class="view-field"><div class="vf-label">Created</div><div class="vf-val">${u.createdAt||AppData.today()}</div></div>
      <div class="view-divider"></div>
      <div class="view-field" style="grid-column:1/-1">
        <div class="vf-label">Access Permissions</div>
        ${ri.access.map(a=>`<div style="font-size:12px;color:var(--muted);padding:3px 0;">✓ ${a}</div>`).join('')}
      </div>
    </div>`;
  el('view-edit-btn').onclick = () => { closeViewModal(); openEditModal(id); };
  showModal('view-overlay','view-modal');
}
function closeViewModal() { hideModal('view-overlay','view-modal'); }

// ── DEACTIVATE / ACTIVATE MODAL ────────────────────────────
function openDeactModal(id, action, e) {
  if (e) e.stopPropagation();
  const u = AppData.getUsers().find(x=>x.id===id); if (!u) return;
  deactTargetId = id; deactAction = action;
  const isDeact = action === 'deactivate';
  setText('deact-title',  isDeact ? 'Deactivate User' : 'Activate User');
  setText('deact-action', isDeact ? 'deactivate' : 'reactivate');
  setText('deact-name',   `"${u.name}"`);
  setText('deact-desc',   isDeact ? 'no longer be able to log in' : 'regain access to the system');
  el('deact-confirm-btn').textContent = isDeact ? '🔒 Deactivate' : '🔓 Activate';
  el('deact-confirm-btn').className   = isDeact ? 'btn-danger' : 'btn-primary';
  showModal('deact-overlay','deact-modal');
}

function confirmDeact() {
  if (!deactTargetId) return;
  const newStatus = deactAction === 'deactivate' ? 'inactive' : 'active';
  AppData.updateUser(deactTargetId, { status: newStatus });
  const u = AppData.getUsers().find(x=>x.id===deactTargetId);
  const msg = deactAction==='deactivate' ? `🔒 "${u?.name}" deactivated.` : `🔓 "${u?.name}" reactivated.`;
  closeDeactModal(); renderStats(); renderCards(); renderTable();
  showToast(msg, deactAction==='deactivate'?'info':'success');
  deactTargetId=null; deactAction='';
}
function closeDeactModal() { hideModal('deact-overlay','deact-modal'); }
function closeModal()      { hideModal('modal-overlay','user-modal'); }

// ── MODAL HELPERS ──────────────────────────────────────────
function showModal(ovId, modalId) { el(ovId).classList.add('show'); el(modalId).classList.add('show'); }
function hideModal(ovId, modalId) { el(ovId).classList.remove('show'); el(modalId).classList.remove('show'); }

function clearForm() {
  ['f-name','f-email','f-password'].forEach(id=>{ const e=el(id); if(e) e.value=''; });
  const role=el('f-role'); if(role) role.value='';
  const stat=el('f-status'); if(stat) stat.value='active';
  const box=el('role-info-box'); if(box) box.style.display='none';
}
function clearFormErrors() {
  document.querySelectorAll('.form-input.error').forEach(e=>e.classList.remove('error'));
  document.querySelectorAll('.form-err').forEach(e=>e.remove());
}
function showFieldError(fieldId, msg) {
  const f=el(fieldId); if(!f) return;
  f.classList.add('error');
  const err=document.createElement('div');
  err.className='form-err'; err.textContent=msg;
  f.parentNode.appendChild(err);
}

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg, type='info') {
  const t=el('toast'); t.textContent=msg; t.className=`toast ${type} show`;
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3000);
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeModal(); closeViewModal(); closeDeactModal(); }
});

document.addEventListener('DOMContentLoaded',()=>{
  AppData.applySession();
  startClock();
  renderStats();
  renderCards();
  renderTable();
  AppData.updateNotifBadge();
});