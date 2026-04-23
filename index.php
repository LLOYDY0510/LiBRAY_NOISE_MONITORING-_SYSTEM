<?php
// ============================================================
// index.php — Login Page
// ============================================================
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/auth.php';
redirectIfLoggedIn();

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email']    ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($email && $password) {
        try {
            $db   = getDB();
            $stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND status = "active" LIMIT 1');
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            // NOTE: passwords are stored plain in DB seed (as provided).
            // In production, switch to password_hash / password_verify.
            if ($user && $user['password'] === $password) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user']    = [
                    'id'    => $user['id'],
                    'name'  => $user['name'],
                    'email' => $user['email'],
                    'role'  => $user['role'],
                ];

                // Update last_login
                $db->prepare('UPDATE users SET last_login = ? WHERE id = ?')
                   ->execute([date('M d, Y h:i A'), $user['id']]);

                header('Location: ' . BASE_URL . '/dashboard.php');
                exit;
            } else {
                $error = 'Invalid email or password. Please try again.';
            }
        } catch (Exception $e) {
            $error = 'System error. Please try again later.';
        }
    } else {
        $error = 'Please fill in all fields.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login — LibraryQuiet Monitoring System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/library-saba/css/main.css">
    <link rel="stylesheet" href="/library-saba/css/components.css">
</head>
<body>
<div class="login-page">
    <div class="login-card">
        <div class="login-logo">
            <div class="login-logo-icon">
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" stroke="white" stroke-width="2"/>
                    <path d="M14 8v6l3.5 3.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="14" cy="14" r="2.5" fill="white" opacity=".5"/>
                </svg>
            </div>
            <div class="login-logo-text">
                <h1>LibraryQuiet</h1>
                <p>Noise Monitoring System</p>
            </div>
        </div>

        <p class="login-tagline">
            Monitor and manage library noise levels across all zones in real-time.
        </p>

        <?php if ($error): ?>
        <div class="login-error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="form-group">
                <label class="form-label" for="email">Email Address</label>
                <input class="form-control"
                       type="email" id="email" name="email"
                       value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
                       placeholder="you@library.edu"
                       required autocomplete="email">
            </div>

            <div class="form-group">
                <label class="form-label" for="password">Password</label>
                <input class="form-control"
                       type="password" id="password" name="password"
                       placeholder="••••••••"
                       required autocomplete="current-password">
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px;">
                Sign In to Dashboard
            </button>
        </form>

        <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--gray-100);font-size:11.5px;color:var(--gray-400);text-align:center;">
            LQMS v<?= APP_VERSION ?> &nbsp;·&nbsp; <?= date('Y') ?> Library Noise Management
        </div>
    </div>
</div>
</body>
</html>
