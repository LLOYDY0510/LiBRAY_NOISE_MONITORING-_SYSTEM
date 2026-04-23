-- ============================================================
--  LibraryQuiet Monitoring System — setup.sql (UPDATED)
--  Run in phpMyAdmin: https://auth-db19821.hstgr.io
--  DB: u442411629_librarysaba
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(20)  PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('Administrator','Library Manager','Library Staff') NOT NULL DEFAULT 'Library Staff',
  status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  last_login VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ZONES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id              VARCHAR(20)  PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  floor           VARCHAR(10)  NOT NULL,
  capacity        INT          NOT NULL DEFAULT 50,
  occupied        INT          NOT NULL DEFAULT 0,
  level           DECIMAL(5,2) NOT NULL DEFAULT 0,
  warn_threshold  INT          NOT NULL DEFAULT 40,
  crit_threshold  INT          NOT NULL DEFAULT 60,
  sensor          VARCHAR(20)  NOT NULL,
  status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  battery         INT          NOT NULL DEFAULT 80,
  manual_override TINYINT(1)   NOT NULL DEFAULT 0,
  description     TEXT,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ALERTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id            VARCHAR(30)  PRIMARY KEY,
  zone_name     VARCHAR(100) NOT NULL,
  level         DECIMAL(5,2) NOT NULL,
  type          ENUM('warning','critical','resolved') NOT NULL DEFAULT 'warning',
  msg           TEXT,
  status        ENUM('active','resolved') NOT NULL DEFAULT 'active',
  resolved_by   VARCHAR(100) DEFAULT NULL,
  resolved_at   VARCHAR(50)  DEFAULT NULL,
  sent_to_admin TINYINT(1)   NOT NULL DEFAULT 0,
  alert_date    VARCHAR(100) NOT NULL,
  alert_time    VARCHAR(20)  NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ALERT MESSAGES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_messages (
  id         VARCHAR(30)  PRIMARY KEY,
  alert_id   VARCHAR(30)  NOT NULL,
  from_name  VARCHAR(100) NOT NULL,
  from_role  VARCHAR(50)  NOT NULL,
  message    TEXT         NOT NULL,
  msg_time   VARCHAR(20)  NOT NULL,
  msg_date   VARCHAR(100) NOT NULL,
  is_system  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── REPORTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            VARCHAR(30)  PRIMARY KEY,
  type          VARCHAR(100) NOT NULL,
  generated_by  VARCHAR(100) NOT NULL,
  role          VARCHAR(50)  NOT NULL,
  report_date   VARCHAR(100) NOT NULL,
  report_time   VARCHAR(20)  NOT NULL,
  sent_to_admin TINYINT(1)   NOT NULL DEFAULT 0,
  sent_at       VARCHAR(50)  DEFAULT NULL,
  admin_read_at VARCHAR(50)  DEFAULT NULL,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SENSOR OVERRIDES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensor_overrides (
  zone_id  VARCHAR(20)  PRIMARY KEY,
  level    DECIMAL(5,2) NOT NULL,
  set_by   VARCHAR(100) NOT NULL,
  set_at   VARCHAR(20)  NOT NULL,
  set_date VARCHAR(100) NOT NULL,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SEED DATA ─────────────────────────────────────────────────
START TRANSACTION;

INSERT IGNORE INTO users (id, name, email, password, role, status, last_login) VALUES
('U-001', 'Johnlloyd P.',     'admin@library.edu', 'admin123', 'Administrator',   'active', NULL),
('U-002', 'James Anticamars', 'james@library.edu', 'james123', 'Library Manager', 'active', NULL),
('U-003', 'Dimavier',         'staff@library.edu', 'staff123', 'Library Staff',   'active', NULL);

INSERT IGNORE INTO zones (id, name, floor, capacity, occupied, level, warn_threshold, crit_threshold, sensor, battery, description) VALUES
('Z-001', 'Reading AREA',  '1F', 80, 45, 28.00, 40, 60, 'SNS-001', 85, 'Main reading area on the ground floor.'),
('Z-002', 'Study AREA',    '2F', 20, 18, 52.00, 40, 60, 'SNS-002', 72, 'Private study room for small groups.'),
('Z-003', 'Computer AREA', '1F', 40, 12, 18.00, 35, 55, 'SNS-003', 91, 'Computer laboratory section.');

COMMIT;
