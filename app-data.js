const AppData = (() => {

  // ── KEYS ────────────────────────────────────────────────────
  const KEYS = {
    zones:    'lq_zones',
    alerts:   'lq_alerts',
    reports:  'lq_reports',
    users:    'lq_users',
    session:  'lq_user',
    notifs:   'lq_notifications',
  };

  // ── HELPERS ─────────────────────────────────────────────────
  function today() {
    return new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' });
  }
  function yesterday() {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' });
  }
  function save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) { console.warn('AppData save error:', e); }
  }
  function load(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch(e) { return null; }
  }

  // ── DEFAULT DATA ────────────────────────────────────────────
  const DEFAULT_ZONES = [
    { id:'Z-001', name:'Reading AREA',   floor:'1F', capacity:80,  occupied:45, level:28, warnThreshold:40, critThreshold:60, sensor:'SNS-001', status:'active', desc:'Main reading area on the ground floor.' },
    { id:'Z-002', name:'Study AREA',     floor:'2F', capacity:20,  occupied:18, level:52, warnThreshold:40, critThreshold:60, sensor:'SNS-002', status:'active', desc:'Private study room for small groups.' },
    { id:'Z-003', name:'Computer AREA',  floor:'1F', capacity:40,  occupied:12, level:18, warnThreshold:35, critThreshold:55, sensor:'SNS-003', status:'active', desc:'Computer laboratory section.' },
  ];

  const DEFAULT_ALERTS = [
    { id:'A-001', zone:'Computer AREA', time:'10:42 AM', date: today(), level:71, type:'warning',  msg:'Noise exceeded threshold', status:'active',   resolvedBy:null,           resolvedAt:null,       sentToAdmin:false, messages:[] },
    { id:'A-002', zone:'Study AREA',    time:'10:31 AM', date: today(), level:58, type:'warning',  msg:'Approaching noise limit',  status:'active',   resolvedBy:null,           resolvedAt:null,       sentToAdmin:false, messages:[{id:'M-001',from:'Johnlloyd P.',role:'Administrator',text:'Please monitor this zone closely. Students have exams today.',time:'10:45 AM',date:today()}] },
    { id:'A-003', zone:'Reading AREA',  time:'09:55 AM', date: today(), level:32, type:'resolved', msg:'Noise normalized',         status:'resolved', resolvedBy:'Johnlloyd P.', resolvedAt:'10:00 AM', sentToAdmin:false, messages:[] },
  ];

  const DEFAULT_REPORTS = [
    { id:'R-001', type:'Daily Noise Report',     generatedBy:'James Anticamars', role:'Library Manager', date: today(),     time:'09:00 AM', sentToAdmin:false, notes:'All zones within acceptable range in the morning.' },
    { id:'R-002', type:'Weekly Summary Report',  generatedBy:'James Anticamars', role:'Library Manager', date: yesterday(), time:'04:30 PM', sentToAdmin:true,  notes:'Study AREA had 3 violations this week.', adminReadAt: today() },
    { id:'R-003', type:'Alert Frequency Report', generatedBy:'Johnlloyd P.',     role:'Administrator',   date: yesterday(), time:'11:00 AM', sentToAdmin:false, notes:'Generated for records.' },
  ];

  const DEFAULT_USERS = [
    { id:'U-001', name:'Johnlloyd P.',     email:'admin@library.edu', password:'admin123', role:'Administrator',   status:'active', lastLogin: today() + ' 08:00 AM', createdAt:'2025-01-01' },
    { id:'U-002', name:'James Anticamars', email:'james@library.edu', password:'james123', role:'Library Manager', status:'active', lastLogin: today() + ' 07:45 AM', createdAt:'2025-01-05' },
    { id:'U-003', name:'Dimavier',         email:'staff@library.edu', password:'staff123', role:'Library Staff',   status:'active', lastLogin: today() + ' 07:30 AM', createdAt:'2025-01-10' },
  ];

  // ── INIT (seed data if empty) ────────────────────────────────
  function init() {
    if (!load(KEYS.zones))   save(KEYS.zones,   DEFAULT_ZONES);
    if (!load(KEYS.alerts))  save(KEYS.alerts,  DEFAULT_ALERTS);
    if (!load(KEYS.reports)) save(KEYS.reports, DEFAULT_REPORTS);
    if (!load(KEYS.users))   save(KEYS.users,   DEFAULT_USERS);
    if (!load(KEYS.notifs))  save(KEYS.notifs,  []);
  }

  // ── ZONES ────────────────────────────────────────────────────
  function getZones()           { return load(KEYS.zones) || DEFAULT_ZONES; }
  function saveZones(zones)     { save(KEYS.zones, zones); }
  function addZone(zone)        { const z = getZones(); z.push(zone); saveZones(z); }
  function updateZone(id, data) { saveZones(getZones().map(z => z.id === id ? { ...z, ...data } : z)); }
  function deleteZone(id)       { saveZones(getZones().filter(z => z.id !== id)); }
  function getZone(id)          { return getZones().find(z => z.id === id); }

  function updateNoiseLevels(levels) {
    const zones = getZones().map(z => {
      const upd = levels.find(l => l.id === z.id);
      return upd ? { ...z, level: upd.level, occupied: upd.occupied || z.occupied } : z;
    });
    saveZones(zones);
    zones.forEach(z => {
      if (z.level >= z.critThreshold)      autoAlert(z, 'critical');
      else if (z.level >= z.warnThreshold) autoAlert(z, 'warning');
    });
  }

  // ── ALERTS ───────────────────────────────────────────────────
  function getAlerts()       { return load(KEYS.alerts) || DEFAULT_ALERTS; }
  function saveAlerts(a)     { save(KEYS.alerts, a); }
  function getActiveAlerts() { return getAlerts().filter(a => a.status === 'active'); }

  function addAlert(alert) {
    const a = getAlerts();
    a.unshift(alert);
    saveAlerts(a);
    updateNotifBadge();
  }

  function resolveAlert(id, resolvedBy) {
    const now    = new Date().toLocaleTimeString('en-PH');
    const alerts = getAlerts().map(a =>
      a.id === id ? { ...a, status:'resolved', resolvedBy, resolvedAt: now } : a
    );
    saveAlerts(alerts);
    updateNotifBadge();
  }

  function addAlertMessage(alertId, message) {
    const alerts = getAlerts().map(a => {
      if (a.id !== alertId) return a;
      const msgs = a.messages ? [...a.messages] : [];
      msgs.push(message);
      return { ...a, messages: msgs };
    });
    saveAlerts(alerts);
  }

  function getAlertMessages(alertId) {
    const a = getAlerts().find(x => x.id === alertId);
    return a ? (a.messages || []) : [];
  }

  function autoAlert(zone, type) {
    const existing = getAlerts().find(a => a.zone === zone.name && a.status === 'active');
    if (existing) return;
    const now = new Date();
    const newAlert = {
      id:          'A-' + Date.now(),
      zone:        zone.name,
      time:        now.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' }),
      date:        today(),
      level:       Math.round(zone.level),
      type,
      msg:         type === 'critical' ? 'Critical noise level detected' : 'Noise threshold exceeded',
      status:      'active',
      resolvedBy:  null,
      resolvedAt:  null,
      sentToAdmin: false,
      messages:    [],
    };
    addAlert(newAlert);
  }

  // ── REPORTS ──────────────────────────────────────────────────
  function getReports()      { return load(KEYS.reports) || DEFAULT_REPORTS; }
  function saveReports(r)    { save(KEYS.reports, r); }

  function addReport(report) {
    const r = getReports(); r.unshift(report); saveReports(r);
  }

  function sendReportToAdmin(reportId, senderName) {
    const reports = getReports().map(r =>
      r.id === reportId ? { ...r, sentToAdmin: true, sentAt: new Date().toLocaleTimeString('en-PH') } : r
    );
    saveReports(reports);
    const report = reports.find(r => r.id === reportId);
    addNotification({
      id: 'N-' + Date.now(), type: 'report',
      title: 'New Report from Manager',
      msg:   `${senderName} sent: ${report?.type}`,
      from:  senderName,
      time:  new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' }),
      date:  today(), read: false, reportId,
    });
  }

  function markReportRead(reportId) {
    saveReports(getReports().map(r =>
      r.id === reportId ? { ...r, adminReadAt: new Date().toLocaleTimeString('en-PH') } : r
    ));
  }

  function getUnreadReports() {
    return getReports().filter(r => r.sentToAdmin && !r.adminReadAt);
  }

  // ── USERS ────────────────────────────────────────────────────
  function getUsers()           { return load(KEYS.users) || DEFAULT_USERS; }
  function saveUsers(u)         { save(KEYS.users, u); }
  function getUser(id)          { return getUsers().find(u => u.id === id); }
  function addUser(user)        { const u = getUsers(); u.push(user); saveUsers(u); }
  function updateUser(id, data) { saveUsers(getUsers().map(u => u.id === id ? { ...u, ...data } : u)); }
  function deleteUser(id)       { saveUsers(getUsers().filter(u => u.id !== id)); }
  function getUserByEmail(email){ return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); }

  // ── NOTIFICATIONS ────────────────────────────────────────────
  function getNotifications()   { return load(KEYS.notifs) || []; }
  function saveNotifications(n) { save(KEYS.notifs, n); }
  function addNotification(n)   { const notifs = getNotifications(); notifs.unshift(n); saveNotifications(notifs); }
  function markNotifRead(id)    { saveNotifications(getNotifications().map(n => n.id === id ? { ...n, read: true } : n)); }
  function markAllNotifsRead()  { saveNotifications(getNotifications().map(n => ({ ...n, read: true }))); }
  function getUnreadNotifs()    { return getNotifications().filter(n => !n.read); }

  // ── SESSION ──────────────────────────────────────────────────
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(KEYS.session)); } catch(e) { return null; }
  }
  function isAdmin()   { const s = getSession(); return s && s.role === 'Administrator'; }
  function isManager() { const s = getSession(); return s && s.role === 'Library Manager'; }
  function isStaff()   { const s = getSession(); return s && s.role === 'Library Staff'; }

  // ── UPDATE NOTIF BADGE ────────────────────────────────────────
  function updateNotifBadge() {
    const active = getActiveAlerts().length;
    document.querySelectorAll('.tb-bc, #bell-count').forEach(el => {
      el.textContent = active;
      el.style.display = active > 0 ? 'flex' : 'none';
    });
    const nb = document.querySelector('.nb');
    if (nb) { nb.textContent = active; nb.style.display = active > 0 ? '' : 'none'; }
  }

  // ── APPLY SESSION TO SIDEBAR ──────────────────────────────────
  function applySession() {
    const session = getSession();
    if (!session) return;
    const name    = session.name || session.email;
    const initial = name.charAt(0).toUpperCase();
    document.querySelectorAll('.sb-uname, .sb-bname').forEach(el => el.textContent = name);
    document.querySelectorAll('.sb-urole').forEach(el => el.textContent = (session.role === 'Administrator' ? '👑 ' : session.role === 'Library Manager' ? '📋 ' : '👤 ') + session.role);
    document.querySelectorAll('.sb-brole').forEach(el => el.textContent = session.role);
    document.querySelectorAll('.sb-av, .sb-av-lg, .tb-av, .top-av').forEach(el => el.textContent = initial);
    updateNotifBadge();
  }

  // ── RESET ALL DATA ────────────────────────────────────────────
  function resetAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    init();
  }

  // ── PUBLIC API ────────────────────────────────────────────────
  return {
    init, resetAll, today, yesterday,
    // Zones
    getZones, saveZones, addZone, updateZone, deleteZone, getZone, updateNoiseLevels,
    // Alerts
    getAlerts, saveAlerts, getActiveAlerts, addAlert, resolveAlert, autoAlert,
    addAlertMessage, getAlertMessages,
    // Reports
    getReports, saveReports, addReport, sendReportToAdmin, markReportRead, getUnreadReports,
    // Users
    getUsers, saveUsers, getUser, addUser, updateUser, deleteUser, getUserByEmail,
    // Notifications
    getNotifications, addNotification, markNotifRead, markAllNotifsRead, getUnreadNotifs,
    // Session
    getSession, isAdmin, isManager, isStaff,
    // UI helpers
    updateNotifBadge, applySession,
  };

})();

// Auto-init on load
AppData.init();