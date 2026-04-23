<?php
// ============================================================
// auth.php — Session / Auth guard (include at top of pages)
// ============================================================
require_once __DIR__ . '/config.php';

// Called by login page only — redirects to dashboard if already in
function redirectIfLoggedIn(): void {
    if (isLoggedIn()) {
        header('Location: ' . BASE_URL . '/dashboard.php');
        exit;
    }
}
