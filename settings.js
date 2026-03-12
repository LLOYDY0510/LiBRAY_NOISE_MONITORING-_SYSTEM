// ============================================================
//  LibraryQuiet – settings.js  (uses AppData)
// ============================================================

let clearTarget = '';

function el(id)        { return document.getElementById(id); }
function setText(id,v) { const e=el(id); if(e) e.textContent=v; }

function startClock() {
  const update = () => {
    const now = new Date();
    setText('tb-date', now.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-PH'));
  };
  update(); setInterval(update, 1000);
}
function toggleSidebar() { el('sidebar').classList.toggle('collapsed'); }

// ── TABS ───────────────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  el('tab-'+name).classList.add('active');
  btn.classList.add('active');
}

// ── NOISE THRESHOLDS ───────────────────────────────────────
function noiseColor(db) { return db < 40 ? '#10b981' : db < 60 ? '#f59e0b' : '#ef4444'; }

function renderZoneThresholds() {
  const list = el('zone-thresh-list'); if (!list) return;
  const zones = AppData.getZones();
  list.innerHTML = zones.map(z => `
    <div class="zt-row" id="ztr-${z.id}">
      <div>
        <div class="zt-name">${z.name}</div>
        <div class="zt-floor">Floor ${z.floor} · ${z.sensor||'No sensor'}</div>
      </div>
      <div class="zt-field">
        <div class="zt-label">⚠️ Warning (dB)</div>
        <div class="zt-input-wrap">
          <input class="zt-input" type="number" id="warn-${z.id}" value="${z.warnThreshold}" min="1" max="89"/>
          <span class="zt-unit">dB</span>
        </div>
      </div>
      <div class="zt-field">
        <div class="zt-label">🔴 Critical (dB)</div>
        <div class="zt-input-wrap">
          <input class="zt-input" type="number" id="crit-${z.id}" value="${z.critThreshold}" min="2" max="90"/>
          <span class="zt-unit">dB</span>
        </div>
      </div>
      <div class="zt-field">
        <div class="zt-label">Live Now</div>
        <div class="zt-live" style="color:${noiseColor(z.level)};">${Math.round(z.level)} dB</div>
      </div>
    </div>`).join('');
}

function saveThresholds() {
  const zones = AppData.getZones();
  let hasError = false;
  zones.forEach(z => {
    const warn = parseInt(el(`warn-${z.id}`)?.value);
    const crit = parseInt(el(`crit-${z.id}`)?.value);
    if (!warn || !crit || warn >= crit) { hasError = true; return; }
    AppData.updateZone(z.id, { warnThreshold: warn, critThreshold: crit });
  });
  if (hasError) { showToast('⚠️ Warning must be less than Critical for all zones.', 'error'); return; }
  showToast('💾 Thresholds saved to all zones!', 'success');
}

function resetThresholds() {
  AppData.getZones().forEach(z => {
    AppData.updateZone(z.id, { warnThreshold: 40, critThreshold: 60 });
  });
  renderZoneThresholds();
  showToast('↺ Thresholds reset to defaults (40 / 60 dB).', 'info');
}

const PRESETS = {
  strict:   { warn: 30, crit: 45 },
  standard: { warn: 40, crit: 60 },
  relaxed:  { warn: 55, crit: 75 },
};

function applyPreset(name) {
  const p = PRESETS[name]; if (!p) return;
  AppData.getZones().forEach(z => {
    const wi = el(`warn-${z.id}`); const ci = el(`crit-${z.id}`);
    if (wi) wi.value = p.warn;
    if (ci) ci.value = p.crit;
  });
  const labels = { strict:'🔇 Strict', standard:'📚 Standard', relaxed:'☕ Relaxed' };
  showToast(`${labels[name]} preset applied. Click Save to confirm.`, 'info');
}

// ── ALERT SETTINGS ─────────────────────────────────────────
function saveAlertSettings() {
  // Read & store values (demo — saved to localStorage via a simple key)
  const cfg = {
    autoAlert:   el('s-auto-alert')?.checked,
    consec:      el('s-consec')?.value,
    cooldown:    el('s-cooldown')?.value,
    sound:       el('s-sound')?.checked,
    escalate:    el('s-escalate')?.checked,
    escTime:     el('s-esc-time')?.value,
    silence:     el('s-silence')?.checked,
    autoresolve: el('s-autoresolve')?.checked,
  };
  localStorage.setItem('lq_alert_cfg', JSON.stringify(cfg));
  showToast('💾 Alert settings saved!', 'success');
}

function loadAlertSettings() {
  try {
    const cfg = JSON.parse(localStorage.getItem('lq_alert_cfg') || '{}');
    if (cfg.autoAlert   !== undefined) el('s-auto-alert').checked = cfg.autoAlert;
    if (cfg.consec)                    el('s-consec').value       = cfg.consec;
    if (cfg.cooldown)                  el('s-cooldown').value     = cfg.cooldown;
    if (cfg.sound       !== undefined) el('s-sound').checked      = cfg.sound;
    if (cfg.escalate    !== undefined) el('s-escalate').checked   = cfg.escalate;
    if (cfg.escTime)                   el('s-esc-time').value     = cfg.escTime;
    if (cfg.silence     !== undefined) el('s-silence').checked    = cfg.silence;
    if (cfg.autoresolve !== undefined) el('s-autoresolve').checked= cfg.autoresolve;
  } catch(e) {}
}

// ── SENSOR SETTINGS ────────────────────────────────────────
function saveSensorSettings() {
  const cfg = {
    poll:        el('s-poll')?.value,
    refresh:     el('s-refresh')?.value,
    fluctuate:   el('s-fluctuate')?.checked,
    offset:      el('s-offset')?.value,
    offlineT:    el('s-offline-t')?.value,
    showOffline: el('s-show-offline')?.checked,
  };
  localStorage.setItem('lq_sensor_cfg', JSON.stringify(cfg));
  showToast('💾 Sensor settings saved!', 'success');
}

function loadSensorSettings() {
  try {
    const cfg = JSON.parse(localStorage.getItem('lq_sensor_cfg') || '{}');
    if (cfg.poll)        el('s-poll').value       = cfg.poll;
    if (cfg.refresh)     el('s-refresh').value    = cfg.refresh;
    if (cfg.fluctuate !== undefined) el('s-fluctuate').checked = cfg.fluctuate;
    if (cfg.offset)      el('s-offset').value     = cfg.offset;
    if (cfg.offlineT)    el('s-offline-t').value  = cfg.offlineT;
    if (cfg.showOffline !== undefined) el('s-show-offline').checked = cfg.showOffline;
  } catch(e) {}
}

function nudge(id, delta) {
  const inp = el(id); if (!inp) return;
  const v = parseInt(inp.value)||0;
  inp.value = Math.max(parseInt(inp.min)||-99, Math.min(parseInt(inp.max)||99, v+delta));
}

function renderSensorTable() {
  const tbody = el('sensor-tbody'); if (!tbody) return;
  const zones = AppData.getZones();
  tbody.innerHTML = zones.map(z => {
    const online  = z.status === 'active';
    const badge   = online ? '<span class="badge b-green">Online</span>' : '<span class="badge b-red">Offline</span>';
    const lastRead= `${Math.round(z.level)} dB`;
    return `<tr>
      <td class="mono">${z.sensor||'—'}</td>
      <td style="font-weight:700;">${z.name}</td>
      <td><span class="badge b-gray">${z.floor}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:${noiseColor(z.level)};">${lastRead}</td>
      <td>${badge}</td>
      <td><button class="tbl-btn" onclick="pingZone('${z.id}')">📡 Ping</button></td>
    </tr>`;
  }).join('');
}

function pingZone(id) {
  const z = AppData.getZone(id); if (!z) return;
  showToast(`📡 Ping sent to ${z.sensor||z.name} — response: OK (${Math.round(z.level)} dB)`, 'success');
}

// ── SYSTEM SETTINGS ────────────────────────────────────────
function saveSystemSettings() {
  const cfg = {
    libname:    el('s-libname')?.value,
    timeformat: el('s-timeformat')?.value,
    decimals:   el('s-decimals')?.checked,
    compact:    el('s-compact')?.checked,
  };
  localStorage.setItem('lq_system_cfg', JSON.stringify(cfg));
  showToast('💾 System preferences saved!', 'success');
}

function loadSystemSettings() {
  try {
    const cfg = JSON.parse(localStorage.getItem('lq_system_cfg') || '{}');
    if (cfg.libname)    el('s-libname').value   = cfg.libname;
    if (cfg.timeformat) el('s-timeformat').value= cfg.timeformat;
    if (cfg.decimals !== undefined) el('s-decimals').checked = cfg.decimals;
    if (cfg.compact  !== undefined) el('s-compact').checked  = cfg.compact;
  } catch(e) {}
}

function renderSysInfo() {
  const grid   = el('sysinfo-grid'); if (!grid) return;
  const zones  = AppData.getZones();
  const alerts = AppData.getAlerts();
  const users  = AppData.getUsers();
  const reports= AppData.getReports();
  const now    = new Date();
  const items  = [
    { label:'System Version',    val:'LibraryQuiet v1.0',         sub:'Capstone Build 2025' },
    { label:'Uptime',            val:'Running',                    sub:'Live since page load' },
    { label:'Current Time',      val:now.toLocaleTimeString('en-PH'), sub:now.toLocaleDateString('en-PH') },
    { label:'Total Zones',       val:zones.length,                 sub:`${zones.filter(z=>z.status==='active').length} active` },
    { label:'Active Alerts',     val:alerts.filter(a=>a.status==='active').length, sub:`${alerts.length} total` },
    { label:'Registered Users',  val:users.length,                 sub:`${users.filter(u=>u.status==='active').length} active` },
    { label:'Total Reports',     val:reports.length,               sub:`${reports.filter(r=>r.sentToAdmin).length} sent to admin` },
    { label:'localStorage Used', val:calcStorageKB()+'KB',         sub:'Estimated usage' },
    { label:'Browser',           val:getBrowser(),                 sub:navigator.platform||'Web' },
  ];
  grid.innerHTML = items.map(item=>`
    <div class="si-card">
      <div class="si-label">${item.label}</div>
      <div class="si-val">${item.val}</div>
      <div class="si-sub">${item.sub}</div>
    </div>`).join('');
}

function calcStorageKB() {
  try {
    let total = 0;
    for (let k in localStorage) total += localStorage[k].length + k.length;
    return Math.round(total * 2 / 1024);
  } catch(e) { return '—'; }
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome'))  return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari'))  return 'Safari';
  if (ua.includes('Edge'))    return 'Edge';
  return 'Browser';
}

// ── DATA CLEAR ─────────────────────────────────────────────
const CLEAR_CONFIG = {
  alerts:   { icon:'⚠️', title:'Clear All Alerts',       msg:'This will permanently delete ALL alert log records. This action cannot be undone.' },
  resolved: { icon:'🗑',  title:'Clear Resolved Alerts',  msg:'This will delete all resolved alerts. Active alerts will be kept.' },
  reports:  { icon:'📋',  title:'Clear All Reports',      msg:'This will permanently delete ALL generated reports. This action cannot be undone.' },
  all:      { icon:'🔄',  title:'Reset All Data',         msg:'⚠️ This will RESET all zones, alerts, reports, and users to factory defaults. This is irreversible.' },
};

function confirmClear(target) {
  clearTarget = target;
  const cfg = CLEAR_CONFIG[target];
  setText('clear-title', cfg.title);
  setText('clear-msg',   cfg.msg);
  el('clear-icon').textContent = cfg.icon;
  el('clear-confirm-btn').textContent = target==='all' ? '🔄 Yes, Reset Everything' : '🗑 Yes, Clear';
  el('clear-overlay').classList.add('show');
  el('clear-modal').classList.add('show');
}

function executeClear() {
  closeClearModal();
  switch(clearTarget) {
    case 'alerts':
      AppData.saveAlerts([]);
      showToast('🗑 All alerts cleared.', 'info'); break;
    case 'resolved':
      AppData.saveAlerts(AppData.getAlerts().filter(a=>a.status==='active'));
      showToast('🗑 Resolved alerts cleared.', 'info'); break;
    case 'reports':
      AppData.saveReports([]);
      showToast('🗑 All reports cleared.', 'info'); break;
    case 'all':
      ['lq_zones','lq_alerts','lq_reports','lq_users','lq_notifications','lq_alert_cfg','lq_sensor_cfg','lq_system_cfg']
        .forEach(k=>localStorage.removeItem(k));
      showToast('🔄 System reset to defaults! Reloading…', 'info');
      setTimeout(()=>location.reload(), 1800); break;
  }
  renderSysInfo();
  AppData.updateNotifBadge();
}

function closeClearModal() {
  el('clear-overlay').classList.remove('show');
  el('clear-modal').classList.remove('show');
}

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg, type='info') {
  const t=el('toast'); t.textContent=msg; t.className=`toast ${type} show`;
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3200);
}

// ── LIVE REFRESH ───────────────────────────────────────────
function startLiveRefresh() {
  setInterval(() => {
    renderZoneThresholds();
    renderSensorTable();
    renderSysInfo();
    AppData.updateNotifBadge();
  }, 3000);
}

document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeClearModal(); });

document.addEventListener('DOMContentLoaded',()=>{
  AppData.applySession();
  startClock();
  renderZoneThresholds();
  renderSensorTable();
  renderSysInfo();
  loadAlertSettings();
  loadSensorSettings();
  loadSystemSettings();
  AppData.updateNotifBadge();
  startLiveRefresh();
});