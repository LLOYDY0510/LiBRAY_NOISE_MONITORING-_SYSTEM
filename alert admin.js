// ============================================================
//  LibraryQuiet – alerts-admin.js  (uses AppData)
// ============================================================

let currentTab       = 'all';
let selectedIds      = new Set();
let viewTargetId     = null;
let currentFilters   = { search:'', type:'', zone:'' };

function noiseColor(db)  { return db < 40 ? '#10b981' : db < 60 ? '#f59e0b' : '#ef4444'; }
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

// ── STATS ──────────────────────────────────────────────────
function renderStats() {
  const alerts   = AppData.getAlerts();
  const active   = alerts.filter(a=>a.status==='active').length;
  const critical = alerts.filter(a=>a.type==='critical').length;
  const resolved = alerts.filter(a=>a.status==='resolved').length;
  setText('s-active',   active);
  setText('s-critical', critical);
  setText('s-resolved', resolved);
  setText('s-total',    alerts.length);
  setText('bell-count', active);
  setText('alert-nb',   active);
}

// ── POPULATE ZONE FILTER ───────────────────────────────────
function populateZoneFilter() {
  const sel   = el('zone-filter'); if (!sel) return;
  const zones = [...new Set(AppData.getAlerts().map(a=>a.zone))];
  sel.innerHTML = '<option value="">All Zones</option>' + zones.map(z=>`<option>${z}</option>`).join('');
}

// ── FILTER ─────────────────────────────────────────────────
function getFiltered() {
  let alerts = AppData.getAlerts();
  if (currentTab==='active')   alerts = alerts.filter(a=>a.status==='active');
  if (currentTab==='resolved') alerts = alerts.filter(a=>a.status==='resolved');
  if (currentFilters.search)   alerts = alerts.filter(a=>a.zone.toLowerCase().includes(currentFilters.search.toLowerCase())||a.msg.toLowerCase().includes(currentFilters.search.toLowerCase()));
  if (currentFilters.type)     alerts = alerts.filter(a=>a.type===currentFilters.type);
  if (currentFilters.zone)     alerts = alerts.filter(a=>a.zone===currentFilters.zone);
  return alerts;
}

function filterAlerts() {
  currentFilters.search = el('search-input').value;
  currentFilters.type   = el('type-filter').value;
  currentFilters.zone   = el('zone-filter').value;
  renderTable();
}

function setTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  clearSelection();
  renderTable();
}

function resetFilters() {
  currentTab = 'all';
  currentFilters = { search:'', type:'', zone:'' };
  el('search-input').value = '';
  el('type-filter').value  = '';
  el('zone-filter').value  = '';
  document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
  document.querySelector('.ftab').classList.add('active');
  clearSelection();
  renderTable();
}

// ── TABLE ──────────────────────────────────────────────────
function renderTable() {
  const tbody  = el('alerts-tbody'); if (!tbody) return;
  const alerts = getFiltered();
  setText('tbl-count', `Showing ${alerts.length} of ${AppData.getAlerts().length} alert${AppData.getAlerts().length!==1?'s':''}`);

  if (alerts.length===0) {
    tbody.innerHTML=`<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--light);">No alerts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = alerts.map((a,i) => {
    const typeBadge   = a.type==='critical'?'<span class="badge b-red">🔴 Critical</span>':a.type==='warning'?'<span class="badge b-yellow">⚠️ Warning</span>':'<span class="badge b-green">ℹ Info</span>';
    const statusBadge = a.status==='active'?'<span class="badge b-red">Active</span>':'<span class="badge b-gray">Resolved</span>';
    const resolveBtn  = a.status==='active'?`<button class="tbl-btn tb-resolve" onclick="quickResolve('${a.id}',event)">✓ Resolve</button>`:'';
    const checked     = selectedIds.has(a.id)?'checked':'';
    const rowClass    = a.type==='critical'?'row-critical':'';
    return `<tr class="${rowClass}" id="row-${a.id}">
      <td><input type="checkbox" ${checked} onchange="toggleSelect('${a.id}',this)"/></td>
      <td class="mono">${i+1}</td>
      <td style="color:var(--muted);font-size:12px;white-space:nowrap;">${a.date||''}<br>${a.time}</td>
      <td style="font-weight:800;">${a.zone}</td>
      <td><span style="font-weight:900;color:${noiseColor(a.level)};font-family:'JetBrains Mono',monospace;">${a.level} dB</span></td>
      <td>${typeBadge}</td>
      <td style="color:var(--muted);">${a.msg}</td>
      <td>${statusBadge}</td>
      <td style="font-size:12px;color:var(--muted);">${a.resolvedBy||'—'}</td>
      <td>
        <div class="action-btns">
          <button class="tbl-btn tb-view" onclick="openView('${a.id}')">👁 View</button>
          ${resolveBtn}
          <button class="tbl-btn tb-del" onclick="deleteAlert('${a.id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── CHECKBOX SELECTION ─────────────────────────────────────
function toggleSelect(id, cb) {
  if (cb.checked) selectedIds.add(id);
  else            selectedIds.delete(id);
  updateBulkBar();
}

function toggleSelectAll(cb) {
  const alerts = getFiltered();
  if (cb.checked) alerts.forEach(a=>selectedIds.add(a.id));
  else            selectedIds.clear();
  renderTable(); updateBulkBar();
}

function clearSelection() {
  selectedIds.clear();
  const sa = el('select-all'); if(sa) sa.checked=false;
  updateBulkBar(); renderTable();
}

function updateBulkBar() {
  const bar = el('bulk-bar');
  setText('bulk-count', selectedIds.size);
  if (selectedIds.size>0) bar.classList.add('show');
  else                    bar.classList.remove('show');
}

// ── BULK ACTIONS ───────────────────────────────────────────
function bulkResolve() {
  const session = AppData.getSession();
  const name    = session ? session.name : 'Administrator';
  selectedIds.forEach(id => AppData.resolveAlert(id, name));
  showToast(`✅ ${selectedIds.size} alert(s) resolved.`, 'success');
  clearSelection(); renderStats(); renderTable(); populateZoneFilter();
}

function bulkDelete() {
  const alerts = AppData.getAlerts().filter(a=>!selectedIds.has(a.id));
  AppData.saveAlerts(alerts);
  showToast(`🗑️ ${selectedIds.size} alert(s) deleted.`, 'info');
  clearSelection(); renderStats(); renderTable(); populateZoneFilter();
}

function quickResolve(id, e) {
  e.stopPropagation();
  const session = AppData.getSession();
  AppData.resolveAlert(id, session?.name||'Administrator');
  showToast('✅ Alert resolved.', 'success');
  renderStats(); renderTable();
}

function deleteAlert(id) {
  AppData.saveAlerts(AppData.getAlerts().filter(a=>a.id!==id));
  showToast('🗑️ Alert deleted.', 'info');
  renderStats(); renderTable(); populateZoneFilter();
}

function resolveAllActive() {
  const session = AppData.getSession();
  const name    = session ? session.name : 'Administrator';
  AppData.getActiveAlerts().forEach(a=>AppData.resolveAlert(a.id,name));
  showToast('✅ All active alerts resolved!', 'success');
  renderStats(); renderTable();
}

// ── SIMULATE ALERT ─────────────────────────────────────────
function simulateAlert() {
  const zones = ['Group Study Area','Study Room B','Computer Lab','Reading Hall A',"Children's Corner"];
  const zone  = zones[Math.floor(Math.random()*zones.length)];
  const level = Math.floor(Math.random()*30)+60;
  const now   = new Date();
  AppData.addAlert({
    id:   'A-'+Date.now(),
    zone, level,
    time: now.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}),
    date: now.toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'}),
    type: level>=75?'critical':'warning',
    msg:  level>=75?'Critical noise level detected':'Noise threshold exceeded',
    status:'active', resolvedBy:null, resolvedAt:null, sentToAdmin:false,
  });
  showToast(`⚠️ Simulated alert for ${zone}`, 'info');
  renderStats(); renderTable(); populateZoneFilter();
  AppData.updateNotifBadge();
}

// ── VIEW MODAL ─────────────────────────────────────────────
function openView(id) {
  const a = AppData.getAlerts().find(x=>x.id===id); if (!a) return;
  viewTargetId = id;
  const col = noiseColor(a.level);
  const typeLbl   = a.type==='critical'?'🔴 Critical':a.type==='warning'?'⚠️ Warning':'ℹ Info';
  const statusLbl = a.status==='active'?'🔴 Active':'✅ Resolved';
  el('view-body').innerHTML=`
    <div class="view-grid">
      <div class="view-field"><div class="vf-label">Alert ID</div><div class="vf-val mono">${a.id}</div></div>
      <div class="view-field"><div class="vf-label">Zone</div><div class="vf-val">${a.zone}</div></div>
      <div class="view-field"><div class="vf-label">Date</div><div class="vf-val">${a.date||'—'}</div></div>
      <div class="view-field"><div class="vf-label">Time</div><div class="vf-val">${a.time}</div></div>
      <div class="view-divider"></div>
      <div class="view-field"><div class="vf-label">Noise Level</div><div class="vf-val" style="color:${col};font-size:22px;">${a.level} dB</div></div>
      <div class="view-field"><div class="vf-label">Type</div><div class="vf-val">${typeLbl}</div></div>
      <div class="view-field"><div class="vf-label">Status</div><div class="vf-val">${statusLbl}</div></div>
      <div class="view-field"><div class="vf-label">Resolved By</div><div class="vf-val">${a.resolvedBy||'Not yet resolved'}</div></div>
      <div class="view-divider"></div>
      <div class="view-field" style="grid-column:1/-1"><div class="vf-label">Message</div><div class="vf-val" style="font-weight:500;color:var(--muted);">${a.msg}</div></div>
      ${a.resolvedAt?`<div class="view-field" style="grid-column:1/-1"><div class="vf-label">Resolved At</div><div class="vf-val">${a.resolvedAt}</div></div>`:''}
    </div>`;
  const btn = el('modal-resolve-btn');
  if (a.status==='resolved') { btn.disabled=true; btn.textContent='Already Resolved'; }
  else { btn.disabled=false; btn.textContent='✓ Mark Resolved'; btn.onclick=()=>{ const s=AppData.getSession(); AppData.resolveAlert(id,s?.name||'Admin'); closeView(); renderStats(); renderTable(); showToast('✅ Alert resolved.','success'); }; }
  el('view-overlay').classList.add('show'); el('view-modal').classList.add('show');
}

function closeView() { el('view-overlay').classList.remove('show'); el('view-modal').classList.remove('show'); }

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg, type='info') {
  const t=el('toast'); t.textContent=msg; t.className=`toast ${type} show`;
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3000);
}

document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeView(); });

document.addEventListener('DOMContentLoaded', () => {
  AppData.applySession();
  startClock();
  renderStats();
  populateZoneFilter();
  renderTable();
  AppData.updateNotifBadge();
  setInterval(()=>{ renderStats(); renderTable(); AppData.updateNotifBadge(); }, 3000);
});