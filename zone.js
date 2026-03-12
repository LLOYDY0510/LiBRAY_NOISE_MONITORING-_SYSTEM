// ============================================================
//  LibraryQuiet – zones.js  (uses AppData)
// ============================================================

let currentFilter = { search:'', floor:'', status:'' };
let deleteTargetId = null;
let viewTargetId   = null;

function noiseColor(db)  { return db < 40 ? '#10b981' : db < 60 ? '#f59e0b' : '#ef4444'; }
function noiseStatus(db) { return db < 40 ? 'quiet'   : db < 60 ? 'moderate' : 'loud'; }
function el(id)          { return document.getElementById(id); }
function setText(id,v)   { const e=el(id); if(e) e.textContent=v; }

// ── CLOCK ──────────────────────────────────────────────────
function startClock() {
  const update = () => {
    const now = new Date();
    setText('tb-date', now.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-PH'));
  };
  update(); setInterval(update, 1000);
}

function toggleSidebar() { el('sidebar').classList.toggle('collapsed'); }

// ── STAT CARDS ─────────────────────────────────────────────
function renderStats() {
  const zones = AppData.getZones();
  setText('s-total',    zones.length);
  setText('s-active',   zones.filter(z=>z.status==='active').length);
  setText('s-capacity', zones.reduce((a,z)=>a+z.capacity,0));
  setText('s-loud',     zones.filter(z=>noiseStatus(z.level)==='loud').length);
}

// ── TABLE ──────────────────────────────────────────────────
function getFilteredZones() {
  const { search, floor, status } = currentFilter;
  return AppData.getZones().filter(z => {
    const matchSearch = !search || z.name.toLowerCase().includes(search.toLowerCase()) || z.id.toLowerCase().includes(search.toLowerCase());
    const matchFloor  = !floor  || z.floor === floor;
    const matchStatus = !status || z.status === status;
    return matchSearch && matchFloor && matchStatus;
  });
}

function renderTable() {
  const tbody  = el('zones-tbody'); if (!tbody) return;
  const zones  = getFilteredZones();
  const count  = el('tbl-count');
  if (count) count.textContent = `Showing ${zones.length} of ${AppData.getZones().length} zone${AppData.getZones().length!==1?'s':''}`;

  if (zones.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--light);">No zones found matching your filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = zones.map(z => {
    const col    = noiseColor(z.level);
    const ns     = noiseStatus(z.level);
    const nsBadge = ns==='quiet' ? '<span class="badge b-green">Quiet</span>' : ns==='moderate' ? '<span class="badge b-yellow">Moderate</span>' : '<span class="badge b-red">Loud</span>';
    const stBadge = z.status==='active' ? '<span class="badge b-green">Active</span>' : '<span class="badge b-gray">Inactive</span>';
    return `<tr>
      <td class="mono">${z.id}</td>
      <td style="font-weight:800;color:var(--text);">${z.name}</td>
      <td><span class="badge b-blue">${z.floor}</span></td>
      <td style="font-weight:700;">${z.capacity}</td>
      <td>
        <span class="noise-val" style="color:${col};">${Math.round(z.level)} dB</span>
        <div style="margin-top:4px;">${nsBadge}</div>
      </td>
      <td><span style="font-weight:700;color:#f59e0b;">${z.warnThreshold} dB</span></td>
      <td><span style="font-weight:700;color:#ef4444;">${z.critThreshold} dB</span></td>
      <td class="mono">${z.sensor||'—'}</td>
      <td>${stBadge}</td>
      <td>
        <div class="action-btns">
          <button class="tbl-btn tb-view" onclick="openViewModal('${z.id}')">👁 View</button>
          <button class="tbl-btn tb-edit" onclick="openEditModal('${z.id}')">✏️ Edit</button>
          <button class="tbl-btn tb-del"  onclick="openDeleteModal('${z.id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterZones() {
  currentFilter.search = el('search-input').value;
  currentFilter.floor  = el('floor-filter').value;
  currentFilter.status = el('status-filter').value;
  renderTable();
}

// ── ADD MODAL ──────────────────────────────────────────────
function openAddModal() {
  el('edit-id').value    = '';
  el('modal-title').textContent = 'Add New Zone';
  el('modal-sub').textContent   = 'Fill in zone details';
  el('modal-save-btn').textContent = 'Save Zone';
  clearForm();
  showModal('modal-overlay','zone-modal');
}

// ── EDIT MODAL ─────────────────────────────────────────────
function openEditModal(id) {
  const z = AppData.getZone(id); if (!z) return;
  el('edit-id').value    = id;
  el('modal-title').textContent = 'Edit Zone';
  el('modal-sub').textContent   = `Editing: ${z.name}`;
  el('modal-save-btn').textContent = 'Update Zone';
  el('f-name').value     = z.name;
  el('f-floor').value    = z.floor;
  el('f-capacity').value = z.capacity;
  el('f-sensor').value   = z.sensor || '';
  el('f-warn').value     = z.warnThreshold;
  el('f-critical').value = z.critThreshold;
  el('f-desc').value     = z.desc || '';
  el('f-status').value   = z.status || 'active';
  clearFormErrors();
  showModal('modal-overlay','zone-modal');
}

// ── SAVE ZONE ──────────────────────────────────────────────
function saveZone() {
  const name     = el('f-name').value.trim();
  const floor    = el('f-floor').value;
  const capacity = parseInt(el('f-capacity').value);
  const warn     = parseInt(el('f-warn').value);
  const critical = parseInt(el('f-critical').value);
  const sensor   = el('f-sensor').value.trim();
  const desc     = el('f-desc').value.trim();
  const status   = el('f-status').value;

  // Validation
  let valid = true;
  clearFormErrors();
  if (!name)              { showFieldError('f-name','Zone name is required');          valid=false; }
  if (!floor)             { showFieldError('f-floor','Please select a floor');         valid=false; }
  if (!capacity || capacity<1) { showFieldError('f-capacity','Enter a valid capacity'); valid=false; }
  if (!warn || warn<1)    { showFieldError('f-warn','Enter a warning threshold');      valid=false; }
  if (!critical||critical<1){ showFieldError('f-critical','Enter a critical threshold'); valid=false; }
  if (warn >= critical)   { showFieldError('f-critical','Critical must be higher than Warning'); valid=false; }
  if (!valid) return;

  const editId = el('edit-id').value;

  if (editId) {
    // Update existing
    AppData.updateZone(editId, { name, floor, capacity, warnThreshold:warn, critThreshold:critical, sensor, desc, status });
    showToast(`✅ Zone "${name}" updated successfully!`, 'success');
  } else {
    // Add new
    const zones  = AppData.getZones();
    const nextId = 'Z-' + String(zones.length + 1).padStart(3,'0');
    const newZone = {
      id: nextId, name, floor, capacity, occupied: 0,
      level: 0, warnThreshold: warn, critThreshold: critical,
      sensor, desc, status,
    };
    AppData.addZone(newZone);
    showToast(`✅ Zone "${name}" added successfully!`, 'success');
  }

  closeModal();
  renderStats();
  renderTable();
}

// ── VIEW MODAL ─────────────────────────────────────────────
function openViewModal(id) {
  const z = AppData.getZone(id); if (!z) return;
  viewTargetId = id;
  el('view-title').textContent = z.name;

  const col = noiseColor(z.level), ns = noiseStatus(z.level);
  const nsLabel = ns==='quiet'?'🟢 Quiet':ns==='moderate'?'🟡 Moderate':'🔴 Loud';
  const stLabel = z.status==='active'?'🟢 Active':'⚫ Inactive';

  el('view-body').innerHTML = `
    <div class="view-grid">
      <div class="view-field"><div class="vf-label">Zone ID</div><div class="vf-val mono">${z.id}</div></div>
      <div class="view-field"><div class="vf-label">Floor</div><div class="vf-val">${z.floor}</div></div>
      <div class="view-field"><div class="vf-label">Capacity</div><div class="vf-val">${z.capacity} persons</div></div>
      <div class="view-field"><div class="vf-label">Occupancy</div><div class="vf-val">${z.occupied} / ${z.capacity}</div></div>
      <div class="view-divider"></div>
      <div class="view-field"><div class="vf-label">Live Noise Level</div><div class="vf-val" style="color:${col};font-size:22px;">${Math.round(z.level)} dB — ${nsLabel}</div></div>
      <div class="view-field"><div class="vf-label">Sensor ID</div><div class="vf-val mono">${z.sensor||'Not assigned'}</div></div>
      <div class="view-field"><div class="vf-label">Warning Threshold</div><div class="vf-val" style="color:#f59e0b;">${z.warnThreshold} dB</div></div>
      <div class="view-field"><div class="vf-label">Critical Threshold</div><div class="vf-val" style="color:#ef4444;">${z.critThreshold} dB</div></div>
      <div class="view-divider"></div>
      <div class="view-field" style="grid-column:1/-1"><div class="vf-label">Description</div><div class="vf-val" style="font-weight:500;color:var(--muted);">${z.desc||'No description provided.'}</div></div>
      <div class="view-field"><div class="vf-label">Status</div><div class="vf-val">${stLabel}</div></div>
    </div>`;

  el('view-edit-btn').onclick = () => { closeViewModal(); openEditModal(id); };
  showModal('view-overlay','view-modal');
}

function closeViewModal() { hideModal('view-overlay','view-modal'); }

// ── DELETE MODAL ───────────────────────────────────────────
function openDeleteModal(id) {
  const z = AppData.getZone(id); if (!z) return;
  deleteTargetId = id;
  setText('del-zone-name', `"${z.name}"`);
  showModal('del-overlay','del-modal');
}

function confirmDelete() {
  if (!deleteTargetId) return;
  const z = AppData.getZone(deleteTargetId);
  AppData.deleteZone(deleteTargetId);
  closeDeleteModal();
  renderStats();
  renderTable();
  showToast(`🗑️ Zone "${z?.name}" deleted.`, 'info');
  deleteTargetId = null;
}

function closeDeleteModal() { hideModal('del-overlay','del-modal'); }
function closeModal()       { hideModal('modal-overlay','zone-modal'); }

// ── MODAL HELPERS ──────────────────────────────────────────
function showModal(ovId, modalId) { el(ovId).classList.add('show'); el(modalId).classList.add('show'); }
function hideModal(ovId, modalId) { el(ovId).classList.remove('show'); el(modalId).classList.remove('show'); }

function clearForm() {
  ['f-name','f-capacity','f-sensor','f-desc'].forEach(id => { const e=el(id); if(e) e.value=''; });
  const floor = el('f-floor'); if(floor) floor.value='';
  const warn  = el('f-warn');  if(warn)  warn.value='40';
  const crit  = el('f-critical'); if(crit) crit.value='60';
  const stat  = el('f-status');   if(stat) stat.value='active';
  clearFormErrors();
}

function clearFormErrors() {
  document.querySelectorAll('.form-input.error').forEach(e=>e.classList.remove('error'));
  document.querySelectorAll('.form-err').forEach(e=>e.remove());
}

function showFieldError(fieldId, msg) {
  const f = el(fieldId); if (!f) return;
  f.classList.add('error');
  const err = document.createElement('div');
  err.className='form-err'; err.textContent=msg;
  f.parentNode.appendChild(err);
}

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg, type='info') {
  const t = el('toast');
  t.textContent=msg; t.className=`toast ${type} show`;
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3000);
}

// ── LIVE UPDATE ────────────────────────────────────────────
function startLiveUpdate() {
  setInterval(() => {
    renderStats();
    renderTable();
    AppData.updateNotifBadge();
  }, 3000);
}

// ── ESC KEY ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key==='Escape') { closeModal(); closeDeleteModal(); closeViewModal(); }
});

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  AppData.applySession();
  startClock();
  renderStats();
  renderTable();
  AppData.updateNotifBadge();
  startLiveUpdate();
});