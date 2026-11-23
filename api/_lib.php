<?php
/* Altayba Traders — shared helpers for the JSON API.
   DB credentials live OUTSIDE the web root (one folder above public_html). */
declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === '_lib.php') { http_response_code(404); exit; }

const NK_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const NK_PAYMENTS = ['cod', 'bank', 'stc', 'link'];

function nk_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $candidates = [
        getenv('ALTAYBA_CONFIG') ?: '',
        dirname(__DIR__, 2) . '/altayba_config.php',   // /home/<user>/altayba_config.php on the server
        dirname(__DIR__) . '/api-config.local.php',     // local development
    ];
    foreach ($candidates as $f) {
        if ($f && is_file($f)) { $cfg = require $f; return $cfg; }
    }
    nk_fail('Server is not configured', 500);
}

function nk_db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = nk_config();
    try {
        $pdo = new PDO(
            "mysql:host={$c['db_host']};dbname={$c['db_name']};charset=utf8mb4",
            $c['db_user'], $c['db_pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
        );
    } catch (PDOException $e) {
        error_log('Altayba DB connect failed: ' . $e->getMessage());
        nk_fail('Database unavailable', 503);
    }
    return $pdo;
}

function nk_json($data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function nk_fail(string $msg, int $code = 400, array $extra = []): never {
    nk_json(['ok' => false, 'error' => $msg] + $extra, $code);
}

/* Writes must be same-origin JSON with our header — a cross-site form can't send either. */
function nk_body(): array {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') nk_fail('POST required', 405);
    if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'altayba') nk_fail('Bad request', 403);
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > 6_000_000) nk_fail('Request too large', 413);
    $d = json_decode($raw, true);
    if (!is_array($d)) nk_fail('Invalid JSON');
    return $d;
}

function nk_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_name('altayba_admin');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
}

function nk_admin(): array {
    nk_session();
    $id = $_SESSION['admin_id'] ?? null;
    $ver = $_SESSION['admin_ver'] ?? null;
    if (!$id) nk_fail('Not signed in', 401);
    $st = nk_db()->prepare('SELECT id, username, pass_hash FROM admins WHERE id = ?');
    $st->execute([$id]);
    $a = $st->fetch();
    // a password change elsewhere signs out every other session
    if (!$a || !hash_equals(substr($a['pass_hash'], -16), (string)$ver)) { session_destroy(); nk_fail('Not signed in', 401); }
    return $a;
}

function nk_str($v, int $max = 255): string {
    $s = trim((string)($v ?? ''));
    return mb_substr($s, 0, $max);
}
function nk_num($v): float { $n = is_numeric($v) ? (float)$v : 0.0; return max(0.0, round($n, 2)); }

/* ---------- Store data ---------- */
function nk_settings(): array {
    $out = [];
    foreach (nk_db()->query('SELECT k, v FROM settings') as $r) $out[$r['k']] = json_decode($r['v'], true);
    return $out;
}
function nk_categories(): array {
    return nk_db()->query('SELECT id, name, name_ur AS nameUr, name_ar AS nameAr FROM categories ORDER BY sort, name')->fetchAll();
}
function nk_products(): array {
    $rows = nk_db()->query('SELECT * FROM products ORDER BY sort, name')->fetchAll();
    return array_map('nk_product_out', $rows);
}
function nk_product_out(array $r): array {
    return [
        'id' => $r['id'], 'name' => $r['name'], 'arabic' => $r['arabic'], 'urdu' => $r['urdu'],
        'desc' => $r['descr'], 'descUr' => $r['descr_ur'], 'descAr' => $r['descr_ar'],
        'categoryId' => $r['category_id'], 'price' => (float)$r['price'], 'oldPrice' => (float)$r['old_price'],
        'unit' => $r['unit'], 'stock' => (int)$r['stock'], 'palette' => $r['palette'], 'badge' => $r['badge'], 'image' => $r['image'],
    ];
}
function nk_order_out(array $r): array {
    $o = json_decode($r['data'], true) ?: [];
    $o['id'] = $r['id'];
    $o['status'] = $r['status'];
    $o['paid'] = (bool)$r['paid'];
    $o['createdAt'] = gmdate('Y-m-d\TH:i:s\Z', strtotime($r['created_at'] . ' UTC'));
    return $o;
}

/* Same maths as NK.totals() in js/data.js */
function nk_totals(float $subtotal, array $s, string $delivery, string $payment, bool $hasLines): array {
    $free = (float)($s['freeOver'] ?? 0) > 0 && $subtotal >= (float)$s['freeOver'];
    $del = ($delivery === 'pickup' || !$hasLines || $free) ? 0.0 : (float)($s['deliveryFee'] ?? 0);
    $cod = ($payment === 'cod' && $hasLines) ? (float)($s['codFee'] ?? 0) : 0.0;
    return ['subtotal' => round($subtotal, 2), 'delivery' => $del, 'codFee' => $cod, 'total' => round($subtotal + $del + $cod, 2)];
}

function nk_client_ip(): string { return substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45); }
