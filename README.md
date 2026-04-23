# LibraryQuiet Monitoring System (LQMS) — Deployment Guide

## Credentials
| Item | Value |
|---|---|
| FTP Host | ftp.ics-dev.io |
| FTP User | u442411629.librarysaba |
| FTP Pass | 6nV6$5BSLjjl |
| FTP Port | 21 |
| phpMyAdmin | https://auth-db19821.hstgr.io |
| DB Name | u442411629_librarysaba |
| DB User | u442411629_dev_library |
| DB Pass | 6nV6$5BSLjjl |

---

## Folder Structure (deploy outside public_html)

```
/librarysaba/           ← upload this entire folder via FTP
├── index.php           ← Login page
├── dashboard.php
├── zones.php
├── alerts.php
├── reports.php
├── users.php
├── setup.sql           ← Run once in phpMyAdmin
│
├── includes/
│   ├── config.php      ← DB + app config
│   ├── auth.php
│   ├── layout.php      ← Shared sidebar/header
│   └── layout_footer.php
│
├── css/
│   ├── main.css
│   └── components.css
│
├── js/
│   ├── app.js
│   └── charts.js
│
├── php/
│   ├── logout.php
│   └── simulate_noise.php   ← Cron target
│
└── api/
    ├── active_alerts_count.php
    ├── zone_levels.php
    └── trigger_sim.php
```

---

## Step-by-Step Setup

### 1. Run SQL in phpMyAdmin
- Go to https://auth-db19821.hstgr.io
- Select database `u442411629_librarysaba`
- Import or paste `setup.sql`

### 2. Upload via FileZilla
- Connect: Host `ftp.ics-dev.io`, User `u442411629.librarysaba`, Pass `6nV6$5BSLjjl`, Port `21`
- Navigate to the directory **OUTSIDE** `public_html` (e.g., the home dir or a `librarysaba/` folder next to `public_html`)
- Upload the entire `librarysaba/` folder

### 3. Set BASE_URL in config.php
Open `includes/config.php` and confirm:
```php
define('BASE_URL', '/librarysaba');
```
If your subdomain root already points to the folder, set it to `''` (empty string).

### 4. Set Up Cron Job (Hostinger Control Panel)
- Go to Hostinger hPanel → Advanced → Cron Jobs
- Add new cron job:
  - **Every 7 minutes**: `*/7 * * * *`
  - Command: `php /path/to/librarysaba/php/simulate_noise.php`
  - Or HTTP: `curl -s "https://yoursubdomain.ics-dev.io/librarysaba/api/trigger_sim.php"` (must be logged in)

> The JS dashboard countdown also triggers simulation automatically via `api/trigger_sim.php` when a user is browsing. No extra setup needed for basic use.

---

## Default Login Accounts

| Name | Email | Password | Role |
|---|---|---|---|
| Johnlloyd P. | admin@library.edu | admin123 | Administrator |
| James Anticamars | james@library.edu | james123 | Library Manager |
| Dimavier | staff@library.edu | staff123 | Library Staff |

> ⚠️ Change passwords after first login. Passwords are currently stored in plaintext as provided in the seed data. To hash them, update `index.php` to use `password_hash()` / `password_verify()`.

---

## Role Permissions

| Feature | Admin | Manager | Staff |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| Zones (view) | ✅ | ✅ | ✅ |
| Zone Override | ✅ | ✅ | ❌ |
| Alerts (view/resolve) | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |

---

## Noise Thresholds (dB)

| Level | Range | Color |
|---|---|---|
| Safe (Quiet) | < 40 dB | Green |
| Warning (Moderate) | 40–74 dB | Amber |
| Critical (Loud) | ≥ 75 dB | Red |

These can be adjusted per-zone in the database or via the Override feature.

---

## Anti-DDOS / Data Safety Notes
- Simulation runs **once every 7 minutes** — generates exactly 1 UPDATE per zone + 1 INSERT only on threshold breach
- Sidebar badge polling is every **30 seconds** (tiny JSON, ~50 bytes)
- Zone level refresh (dashboard) triggers only when JS countdown reaches 0 (every 7 min)
- No flooding, no loops, no repeated inserts
