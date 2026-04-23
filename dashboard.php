<?php
// ============================================================
// dashboard.php — Main Dashboard
// ============================================================
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/auth.php';
requireLogin();

$db = getDB();
$pageTitle = 'Dashboard';

// Fetch zone summary
$zones = $db->query('SELECT * FROM zones WHERE status = "active" ORDER BY id')->fetchAll();

// Active alerts count
$alertCount = $db->query('SELECT COUNT(*) FROM alerts WHERE status = "active"')->fetchColumn();

// Recent alerts
$recentAlerts = $db->query(
    'SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5'
)->fetchAll();

// Stats
$totalZones   = count($zones);
$critZones    = 0;
$warnZones    = 0;
$safeZones    = 0;
foreach ($zones as $z) {
    $s = noiseStatus($z['level']);
    if ($s === 'critical') $critZones++;
    elseif ($s === 'warning') $warnZones++;
    else $safeZones++;
}

// Chart data: last 10 readings per zone (from alerts or simulated history)
// We pull the last 8 hours of simulated averages from alert records
$chartLabels = [];
$chartData   = [];
foreach ($zones as $z) {
    $rows = $db->prepare(
        'SELECT level, alert_time FROM alerts WHERE zone_name = ? ORDER BY created_at DESC LIMIT 10'
    );
    $rows->execute([$z['name']]);
    $history = $rows->fetchAll();
    $history = array_reverse($history);
    $chartData[$z['id']] = array_map(fn($r) => (float)$r['level'], $history);
    if (empty($chartLabels) && !empty($history)) {
        $chartLabels = array_map(fn($r) => $r['alert_time'], $history);
    }
}

include __DIR__ . '/includes/layout.php';
?>

<div data-base="<?= BASE_URL ?>">

<!-- Stats Row -->
<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        </div>
        <div class="stat-value"><?= $totalZones ?></div>
        <div class="stat-label">Total Zones Monitored</div>
    </div>

    <div class="stat-card safe-card">
        <div class="stat-icon safe">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        </div>
        <div class="stat-value" style="color:var(--safe)"><?= $safeZones ?></div>
        <div class="stat-label">Zones in Safe Range</div>
    </div>

    <div class="stat-card warn-card">
        <div class="stat-icon warn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
        </div>
        <div class="stat-value" style="color:var(--warn)"><?= $warnZones ?></div>
        <div class="stat-label">Zones with Warnings</div>
    </div>

    <div class="stat-card crit-card">
        <div class="stat-icon crit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
        </div>
        <div class="stat-value" style="color:var(--crit)"><?= $critZones ?></div>
        <div class="stat-label">Critical Alerts Active</div>
    </div>
</div>

<!-- Main Grid -->
<div class="dashboard-grid">

    <!-- Left: Zones Overview -->
    <div>
        <div class="card" style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <div class="card-title" style="margin-bottom:0">Zone Overview</div>
                <span class="sensor-dot">All Sensors Online</span>
            </div>

            <?php foreach ($zones as $z):
                $status = noiseStatus($z['level']);
                $pct    = min(($z['level'] / 90) * 100, 100);
                $label  = noiseLabel($z['level']);
                $bat    = (int)$z['battery'];
                $batClass = $bat > 60 ? 'high' : ($bat > 30 ? 'mid' : 'low');
            ?>
            <div style="padding:14px 0;border-bottom:1px solid var(--gray-100);" data-zone="<?= $z['id'] ?>" class="zone-row">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div>
                        <span style="font-weight:600;font-size:13.5px;color:var(--gray-900)"><?= htmlspecialchars($z['name']) ?></span>
                        <span style="font-size:11px;color:var(--gray-400);margin-left:8px"><?= htmlspecialchars($z['floor']) ?> · <?= htmlspecialchars($z['sensor']) ?></span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="battery <?= $batClass ?>">
                            <span class="battery-bar">
                                <span class="battery-fill" style="width:<?= $bat ?>%"></span>
                            </span>
                            <?= $bat ?>%
                        </span>
                        <span class="badge badge-<?= $status === 'safe' ? 'safe' : ($status === 'warning' ? 'warn' : 'crit') ?>"><?= $label ?></span>
                    </div>
                </div>
                <div class="db-bar-wrap">
                    <div class="db-bar">
                        <div class="db-bar-fill <?= $status ?>" style="width:0"
                             data-pct="<?= round($pct, 1) ?>"></div>
                    </div>
                    <div class="db-val zone-db-num <?= $status ?>"><?= number_format($z['level'], 1) ?> dB</div>
                </div>
                <div style="font-size:10.5px;color:var(--gray-400);margin-top:5px;">
                    Warn: <?= $z['warn_threshold'] ?>dB &nbsp;|&nbsp;
                    Critical: <?= $z['crit_threshold'] ?>dB &nbsp;|&nbsp;
                    Occupied: <?= $z['occupied'] ?>/<?= $z['capacity'] ?>
                </div>
            </div>
            <?php endforeach; ?>

            <div style="margin-top:14px;text-align:right;">
                <a href="<?= BASE_URL ?>/zones.php" class="btn btn-outline btn-sm">View All Zones →</a>
            </div>
        </div>

        <!-- Noise History Chart -->
        <div class="card">
            <div class="card-title">Noise Level History</div>
            <canvas id="noiseChart" class="chart-container" style="height:220px;"></canvas>
        </div>
    </div>

    <!-- Right: Recent Alerts -->
    <div>
        <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <div class="card-title" style="margin-bottom:0">Recent Alerts</div>
                <?php if ($alertCount > 0): ?>
                <span class="badge badge-crit"><?= $alertCount ?> Active</span>
                <?php endif; ?>
            </div>

            <?php if (empty($recentAlerts)): ?>
            <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                </svg>
                <h3>No alerts yet</h3>
                <p>System is monitoring all zones.</p>
            </div>
            <?php else: ?>
            <?php foreach ($recentAlerts as $a): ?>
            <div class="alert-item">
                <div class="alert-icon <?= $a['status'] === 'resolved' ? 'resolved' : $a['type'] ?>">
                    <?php if ($a['type'] === 'critical'): ?>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <?php else: ?>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <?php endif; ?>
                </div>
                <div class="alert-body">
                    <div class="alert-zone"><?= htmlspecialchars($a['zone_name']) ?></div>
                    <div class="alert-desc"><?= number_format($a['level'], 1) ?> dB — <?= ucfirst($a['type']) ?></div>
                    <div class="alert-time"><?= htmlspecialchars($a['alert_date']) ?> <?= htmlspecialchars($a['alert_time']) ?></div>
                </div>
                <?php if ($a['status'] === 'active'): ?>
                <div class="alert-actions">
                    <a href="<?= BASE_URL ?>/alerts.php" class="btn btn-outline btn-sm">View</a>
                </div>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>

            <div style="margin-top:12px;text-align:right;">
                <a href="<?= BASE_URL ?>/alerts.php" class="btn btn-outline btn-sm">All Alerts →</a>
            </div>
            <?php endif; ?>
        </div>

        <!-- Simulation Status -->
        <div class="card" style="margin-top:20px;">
            <div class="card-title">Simulation Status</div>
            <div style="font-size:13px;color:var(--gray-500);line-height:1.8;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span>Mode</span>
                    <span class="badge badge-blue">Simulated IoT</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span>Data Interval</span>
                    <span style="font-weight:600;color:var(--gray-700)">Every 7 min</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span>Averaging</span>
                    <span style="font-weight:600;color:var(--gray-700)">Per interval</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span>Next Read</span>
                    <span style="font-weight:600;color:var(--blue-600)" id="nextRead">Calculating…</span>
                </div>
            </div>
        </div>
    </div>
</div>

</div><!-- /data-base -->

<?php
$extraScripts = '<script src="' . BASE_URL . '/js/charts.js"></script>
<script>
document.addEventListener("DOMContentLoaded", function() {
    // Init zone progress bars
    document.querySelectorAll(".db-bar-fill[data-pct]").forEach(el => {
        const pct = parseFloat(el.dataset.pct) || 0;
        setTimeout(() => { el.style.width = pct + "%"; }, 100);
    });

    // Noise chart
    const chartLabels = ' . json_encode($chartLabels) . ';
    const chartData   = ' . json_encode(array_values($chartData)) . ';
    const zoneNames   = ' . json_encode(array_column($zones, 'name')) . ';

    if (chartData.length && chartData[0].length) {
        const datasets = chartData.map((d, i) => ({ label: zoneNames[i] || "Zone " + (i+1), data: d }));
        setTimeout(() => renderNoiseChart("noiseChart", datasets, chartLabels), 200);
    }

    // Next read countdown
    const nextRead = document.getElementById("nextRead");
    if (nextRead) {
        const interval = 7 * 60; // 7 min in seconds
        let remaining = interval;
        const tick = () => {
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            nextRead.textContent = m + "m " + String(s).padStart(2,"0") + "s";
            if (remaining-- <= 0) {
                remaining = interval;
                refreshZoneLevels();
            }
        };
        tick();
        setInterval(tick, 1000);
    }
});
</script>';

include __DIR__ . '/includes/layout_footer.php';
?>
