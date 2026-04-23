<?php
// ============================================================
// LIBRARY QUIET MONITORING SYSTEM — CONFIG
// Hosted via FTP: ftp.ics-dev.io | subdomain outside public_html
// phpMyAdmin: https://auth-db19821.hstgr.io
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ── Base URL (subdomain, deployed outside public_html) ────────
define('BASE_URL', '/library-saba');

// ── Database ──────────────────────────────────────────────────
define('DB_HOST',    'localhost');
define('DB_NAME',    'u442411629_librarysaba');
define('DB_USER',    'u442411629_dev_library');
define('DB_PASS',    '6nV6$5BSLjjl');
define('DB_CHARSET', 'utf8mb4');

// ── App Meta ──────────────────────────────────────────────────
define('APP_NAME',    'LibraryQuiet Monitoring System');
define('APP_SHORT',   'LQMS');
define('APP_VERSION', '1.0.0');

// ── Noise Thresholds (dB) ─────────────────────────────────────
define('NOISE_SAFE',    40);   // below = SAFE (quiet library)
define('NOISE_WARNING', 60);   // warning zone
define('NOISE_CRITICAL',75);   // critical — alert staff

// ── Simulation interval: 7 minutes (420 seconds) ─────────────
define('SIM_INTERVAL_SECONDS', 420);

// ── Timezone ──────────────────────────────────────────────────
date_default_timezone_set('Asia/Manila');

// ── PDO Connection ────────────────────────────────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die('<div style="font-family:monospace;color:#c0392b;padding:20px;">
                 <strong>Database Connection Failed.</strong><br>
                 Please contact your system administrator.<br><br>
                 <small>Error: ' . htmlspecialchars($e->getMessage()) . '</small>
                 </div>');
        }
    }
    return $pdo;
}

// ── Auth Helpers ──────────────────────────────────────────────
function isLoggedIn(): bool {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function requireLogin(): void {
    if (!isLoggedIn()) {
        header('Location: ' . BASE_URL . '/index.php');
        exit;
    }
}

function currentUser(): array {
    return $_SESSION['user'] ?? [];
}

function hasRole(string ...$roles): bool {
    $userRole = $_SESSION['user']['role'] ?? '';
    return in_array($userRole, $roles, true);
}

function requireRole(string ...$roles): void {
    requireLogin();
    if (!hasRole(...$roles)) {
        header('Location: ' . BASE_URL . '/dashboard.php');
        exit;
    }
}

// ── ID Generator ──────────────────────────────────────────────
function generateId(string $prefix): string {
    return $prefix . '-' . strtoupper(substr(uniqid(), -6));
}

// ── Noise Level Label ─────────────────────────────────────────
function noiseStatus(float $db): string {
    if ($db < NOISE_SAFE)     return 'safe';
    if ($db < NOISE_WARNING)  return 'warning';
    return 'critical';
}

function noiseLabel(float $db): string {
    if ($db < NOISE_SAFE)     return 'Quiet';
    if ($db < NOISE_WARNING)  return 'Moderate';
    return 'Loud';
}
