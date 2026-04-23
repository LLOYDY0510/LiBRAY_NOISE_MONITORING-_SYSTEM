<?php
// ============================================================
// zones.php — Zone Management
// ============================================================
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/auth.php';
requireLogin();

$db = getDB();
$pageTitle = 'Zones';
$user = currentUser();

// Handle manual override (Manager/Admin only)
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!hasRole('Administrator', 'Library Manager')) {
        $msg = 'error:Insufficient permissions.';
    } else {
        $action  = $_POST['action'];
        $zoneId  = $_POST['zone_id'] ?? '';

        if ($action === 'override' && $zoneId) {
            $level = (float)($_POST['override_level'] ?? 0);
            if ($level < 0 || $level > 120) {
                $msg = 'error:Level must be between 0 and 120 dB.';
            } else {
                $db->prepare('UPDATE zones SET level = ?, manual_override = 1 WHERE id = ?')
                   ->execute([$level, $zoneId]);
                $db->prepare('REPLACE INTO sensor_overrides (zone_id, level, set_by, set_at, set_date) VALUES (?,?,?,?,?)')
                   ->execute([$zoneId, $level, $user['name'], date('h:i A'), date('F d, Y')]);
                $msg = 'ok:Override applied for zone ' . $zoneId;
            }
        } elseif ($action === 'clear_override' && $zoneId) {
            $db->prepare('UPDATE zones SET manual_override = 0 WHERE id = ?')->execute([$zoneId]);
            $db->prepare('DELETE FROM sensor_overrides WHERE zone_id = ?')->execute([$zoneId]);
            $msg = 'ok:Override cleared.';
        }
    }
}

$zones = $db->query('SELECT * FROM zones ORDER BY floor, name')->fetchAll();

include __DIR__ . '/includes/layout.php';
?>

<?php if ($msg): list($type, $text) = explode(':', $msg, 2); ?>
<div style="background:<?= $type==='ok'?'var(--safe-bg)':'var(--crit-bg)' ?>;color:<?= $type==='ok'?'var(--safe)':'var(--crit)' ?>;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;font-weight:500;">
    <?= htmlspecialchars($text) ?>
</div>
<?php endif; ?>

<div class="page-header">
    <div>
        <h1>Library Zones</h1>
        <p>Real-time noise level monitoring per zone</p>
    </div>
</div>

<!-- Zone Cards -->
<div class="zones-grid">
<?php foreach ($zones as $z):
    $status = noiseStatus($z['level']);
    $pct    = min(($z['level'] / 90) * 100, 100);
    $bat    = (int)$z['battery'];
    $batClass = $bat > 60 ? 'high' : ($bat > 30 ? 'mid' : 'low');
?>
<div class="zone-card zone-<?= $status ?>" data-zone="<?= $z['id'] ?>" data-last-status="<?= $status ?>">
    <div class="zone-card-header">
        <div>
            <div class="zone-name"><?= htmlspecialchars($z['name']) ?></div>
            <div class="zone-floor"><?= htmlspecialchars($z['floor']) ?> · Sensor <?= htmlspecialchars($z['sensor']) ?></div>
        </div>
        <div class="zone-db-display">
            <div class="zone-db-num <?= $status ?>"><?= number_format($z['level'], 1) ?></div>
            <div class="zone-db-unit">dB (avg)</div>
        </div>
    </div>

    <div class="zone-progress">
        <div class="zone-prog-bar">
            <div class="zone-prog-fill <?= $status ?>"
                 style="width:0"
                 data-pct="<?= round($pct, 1) ?>"></div>
        </div>
        <div class="zone-thresholds">
            <span>0 dB</span>
            <span style="color:var(--warn)">⚠ <?= $z['warn_threshold'] ?>dB</span>
            <span style="color:var(--crit)">⛔ <?= $z['crit_threshold'] ?>dB</span>
            <span>90 dB</span>
        </div>
    </div>

    <div class="zone-meta">
        <div class="zone-meta-item">
            <span class="zone-meta-label">Status</span>
            <span class="zone-meta-val">
                <span class="badge badge-<?= $status === 'safe' ? 'safe' : ($status === 'warning' ? 'warn' : 'crit') ?>">
                    <?= noiseLabel($z['level']) ?>
                </span>
            </span>
        </div>
        <div class="zone-meta-item">
            <span class="zone-meta-label">Battery</span>
            <span class="zone-meta-val">
                <span class="battery <?= $batClass ?>">
                    <span class="battery-bar">
                        <span class="battery-fill" style="width:<?= $bat ?>%"></span>
                    </span>
                    <?= $bat ?>%
                </span>
            </span>
        </div>
        <div class="zone-meta-item">
            <span class="zone-meta-label">Occupancy</span>
            <span class="zone-meta-val"><?= $z['occupied'] ?> / <?= $z['capacity'] ?></span>
        </div>
        <div class="zone-meta-item">
            <span class="zone-meta-label">Override</span>
            <span class="zone-meta-val">
                <?php if ($z['manual_override']): ?>
                <span class="badge badge-warn">Manual</span>
                <?php else: ?>
                <span class="badge badge-gray">Auto</span>
                <?php endif; ?>
            </span>
        </div>
    </div>

    <?php if ($z['description']): ?>
    <div style="font-size:12px;color:var(--gray-400);margin-top:10px;font-style:italic;">
        <?= htmlspecialchars($z['description']) ?>
    </div>
    <?php endif; ?>

    <?php if (hasRole('Administrator', 'Library Manager')): ?>
    <div class="zone-actions">
        <button class="btn btn-outline btn-sm"
                onclick="openOverrideModal('<?= $z['id'] ?>', '<?= addslashes($z['name']) ?>', <?= $z['level'] ?>)">
            Set Override
        </button>
        <?php if ($z['manual_override']): ?>
        <form method="POST" style="display:inline;">
            <input type="hidden" name="action"  value="clear_override">
            <input type="hidden" name="zone_id" value="<?= $z['id'] ?>">
            <button type="submit" class="btn btn-danger btn-sm">Clear Override</button>
        </form>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</div>
<?php endforeach; ?>
</div>

<!-- Override Modal -->
<div class="modal-overlay" id="overrideModal">
    <div class="modal">
        <div class="modal-header">
            <div class="modal-title">Manual Noise Override</div>
            <button class="modal-close" onclick="closeModal('overrideModal')">✕</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action"  value="override">
            <input type="hidden" name="zone_id" id="overrideZoneId">

            <div class="form-group">
                <label class="form-label">Zone</label>
                <input class="form-control" id="overrideZoneName" readonly>
            </div>

            <div class="form-group">
                <label class="form-label">Override Level (dB)</label>
                <input class="form-control" type="number" name="override_level" id="overrideLevel"
                       min="0" max="120" step="0.1" required>
                <div style="font-size:11px;color:var(--gray-400);margin-top:5px;">
                    Warn: <?= NOISE_WARNING ?>dB · Critical: <?= NOISE_CRITICAL ?>dB
                </div>
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                <button type="button" class="btn btn-outline" onclick="closeModal('overrideModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Apply Override</button>
            </div>
        </form>
    </div>
</div>

<?php
$extraScripts = '<script>
function openOverrideModal(id, name, level) {
    document.getElementById("overrideZoneId").value  = id;
    document.getElementById("overrideZoneName").value = name;
    document.getElementById("overrideLevel").value    = level;
    openModal("overrideModal");
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".zone-prog-fill[data-pct]").forEach(el => {
        const pct = parseFloat(el.dataset.pct) || 0;
        setTimeout(() => { el.style.width = pct + "%"; }, 100);
    });
});
</script>';

include __DIR__ . '/includes/layout_footer.php';
?>
