// ============================================================
//  LibraryQuiet – dashboard-manager.js  (uses AppData)
// ============================================================

const HOURLY = [22,28,35,48,42,38,55,61,58,45,38,30];
const HOURS  = ['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM'];

function noiseColor(db)  { return db < 40 ? '#10b981' : db < 60 ? '#f59e0b' : '#ef4444'; }
function noiseStatus(db) { return db < 40 ? 'quiet'   : db < 60 ? 'moderate' : 'loud'; }
function statusStyle(s)  {
  if (s==='quiet')    return { bg:'#d1fae5', color:'#065f46', dot:'#10b981' };
  if (s==='moderate') return { bg:'#fef3c7', color:'#92400e', dot:'#f59e0b' };
  return                     { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444' };
}
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

function renderStats() {
  const zones  = AppData.getZones();
  const avg    = Math.round(zones.reduce((a,z)=>a+z.level,0)/zones.length);
  const quiet  = zones.filter(z=>noiseStatus(z.level)==='quiet').length;
  const loud   = zones.filter(z=>noiseStatus(z.level)==='loud').length;
  const active = AppData.getActiveAlerts().length;

  setText('s-avg',    avg + ' dB');
  setText('s-quiet',  quiet + ' / ' + zones.length);
  setText('s-loud',   loud);
  setText('s-alerts', active);

  const tr = el('s-avg-trend');
  if (tr) {
    if (avg<40)      { tr.textContent='↓ All zones in good range'; tr.className='stat-trend trend-green'; }
    else if (avg<60) { tr.textContent='→ Moderate overall level';  tr.className='stat-trend trend-blue'; }
    else             { tr.textContent='↑ Elevated noise detected'; tr.className='stat-trend trend-red'; }
  }
  const ll = el('s-loud-lbl');
  if (ll) {
    ll.textContent = loud>0 ? `↑ ${loud} zone${loud>1?'s':''} need attention` : '✓ No loud zones';
    ll.className   = loud>0 ? 'stat-trend trend-red' : 'stat-trend trend-green';
  }
}

function renderZoneBars() {
  const wrap = el('zone-bars'); if (!wrap) return;
  const zones = AppData.getZones();
  wrap.innerHTML = zones.map(z => {
    const s=noiseStatus(z.level), sc=statusStyle(s);
    const pct=Math.min(100,(z.level/90)*100).toFixed(1), col=noiseColor(z.level);
    return `<div class="zone-row">
      <div class="zone-meta">
        <div class="zone-left">
          <div class="zone-dot" style="background:${sc.dot};"></div>
          <span class="zone-name">${z.name}</span>
          <span class="zone-floor">${z.floor}</span>
        </div>
        <div class="zone-right">
          <span class="zone-db" style="color:${col};">${Math.round(z.level)} dB</span>
          <span class="zone-badge" style="background:${sc.bg};color:${sc.color};">${s}</span>
        </div>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${col};"></div></div>
    </div>`;
  }).join('');
}

function renderChart() {
  const wrap = el('chart-wrap'); if (!wrap) return;
  const max = Math.max(...HOURLY);
  wrap.innerHTML = HOURLY.map((v,i) => {
    const h=Math.round((v/max)*120), bg=v>=60?'#ef4444':v>=40?'#f59e0b':'#3b82f6', pk=v===max;
    return `<div class="chart-col">
      ${pk?`<div style="font-size:9px;color:#ef4444;font-weight:700;margin-bottom:2px;">${v}</div>`:''}
      <div class="chart-bar" style="height:${h}px;background:${bg};${pk?'box-shadow:0 0 8px rgba(239,68,68,.4);':''}"></div>
      <span class="chart-lbl">${HOURS[i]}</span>
    </div>`;
  }).join('');
}

function renderAlerts() {
  const tbody = el('alerts-tbody'); if (!tbody) return;
  const alerts = AppData.getAlerts().slice(0,5);
  tbody.innerHTML = alerts.map(a => {
    const tb = a.type==='critical'?'<span class="badge b-red">Critical</span>':a.type==='warning'?'<span class="badge b-yellow">Warning</span>':'<span class="badge b-green">Info</span>';
    const sb = a.status==='active'?'<span class="badge b-red">Active</span>':'<span class="badge b-gray">Resolved</span>';
    return `<tr>
      <td style="color:#64748b;font-size:12px;">${a.time}</td>
      <td style="font-weight:700;">${a.zone}</td>
      <td><span style="font-weight:900;color:${noiseColor(a.level)};">${a.level} dB</span></td>
      <td>${tb}</td><td style="color:#64748b;">${a.msg}</td><td>${sb}</td>
    </tr>`;
  }).join('');
}

function renderSummary() {
  const zones = AppData.getZones();
  setText('sum-quiet',    zones.filter(z=>noiseStatus(z.level)==='quiet').length);
  setText('sum-moderate', zones.filter(z=>noiseStatus(z.level)==='moderate').length);
  setText('sum-loud',     zones.filter(z=>noiseStatus(z.level)==='loud').length);
}

function startLiveUpdate() {
  setInterval(() => {
    // Manager reads from AppData — does NOT overwrite (admin/monitoring updates it)
    renderStats(); renderZoneBars(); renderSummary();
    AppData.updateNotifBadge();
  }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  AppData.applySession();
  startClock();
  renderStats();
  renderZoneBars();
  renderChart();
  renderAlerts();
  renderSummary();
  startLiveUpdate();
});