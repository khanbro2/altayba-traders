<?php
/* Admin API — every action except login needs a signed-in session. */
declare(strict_types=1);
require __DIR__ . '/_lib.php';

$a = $_GET['a'] ?? '';
$db = nk_db();

/* ---------- Session ---------- */
if ($a === 'me') {
    nk_session();
    if (empty($_SESSION['admin_id'])) nk_json(['ok' => false], 200);
    $adm = nk_admin();
    nk_json(['ok' => true, 'user' => $adm['username']]);
}

if ($a === 'login') {
    $in = nk_body();
    $ip = nk_client_ip();
    $db->prepare('DELETE FROM login_attempts WHERE at < (UTC_TIMESTAMP() - INTERVAL 1 DAY)')->execute();
    $st = $db->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND at > (UTC_TIMESTAMP() - INTERVAL 15 MINUTE)');
    $st->execute([$ip]);
    if ((int)$st->fetchColumn() >= 5) nk_fail('Too many tries. Wait 15 minutes.', 429);

    $user = strtolower(nk_str($in['user'] ?? '', 40));
    $pass = (string)($in['pass'] ?? '');
    $st = $db->prepare('SELECT id, username, pass_hash FROM admins WHERE username = ?');
    $st->execute([$user]);
    $adm = $st->fetch();
    // verify against a dummy hash when the user is unknown, so timing doesn't reveal usernames
    $hash = $adm['pass_hash'] ?? '$2y$10$abcdefghijklmnopqrstuuJ5hJ3vY0yS2cQ7Rk4nqVQd9n1e3e2bW';
    if (!password_verify($pass, $hash) || !$adm) {
        $db->prepare('INSERT INTO login_attempts (ip, at) VALUES (?, UTC_TIMESTAMP())')->execute([$ip]);
        nk_fail('Wrong username or password.', 401);
    }
    $db->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);
    nk_session();
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int)$adm['id'];
    $_SESSION['admin_ver'] = substr($adm['pass_hash'], -16);
    if (!empty($in['remember'])) {
        // keep the cookie for 7 days
        $p = session_get_cookie_params();
        setcookie(session_name(), session_id(), ['expires' => time() + 7 * 86400, 'path' => '/', 'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Strict']);
    }
    nk_json(['ok' => true, 'user' => $adm['username']]);
}

if ($a === 'logout') {
    nk_body();
    nk_session();
    $_SESSION = [];
    session_destroy();
    setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => '/']);
    nk_json(['ok' => true]);
}

/* Everything below needs a signed-in admin */
$adm = nk_admin();

if ($a === 'bootstrap' || $a === 'orders') {
    $orders = array_map('nk_order_out', $db->query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500')->fetchAll());
    if ($a === 'orders') nk_json(['ok' => true, 'orders' => $orders, 'products' => nk_products()]);
    nk_json(['ok' => true, 'user' => $adm['username'], 'settings' => nk_settings(), 'categories' => nk_categories(), 'products' => nk_products(), 'orders' => $orders]);
}

$in = nk_body();

switch ($a) {
case 'change_password':
    if (!password_verify((string)($in['old'] ?? ''), $adm['pass_hash'])) nk_fail('Current password is wrong', 403);
    $user = strtolower(nk_str($in['user'] ?? '', 40));
    $pass = (string)($in['pass'] ?? '');
    if (!preg_match('/^[a-z0-9._-]{3,30}$/', $user)) nk_fail('Username: 3–30 letters, numbers, dot, dash');
    if (strlen($pass) < 8) nk_fail('New password needs at least 8 characters');
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    try { $db->prepare('UPDATE admins SET username = ?, pass_hash = ? WHERE id = ?')->execute([$user, $hash, $adm['id']]); }
    catch (PDOException $e) { nk_fail('That username is taken'); }
    session_regenerate_id(true);
    $_SESSION['admin_ver'] = substr($hash, -16);
    nk_json(['ok' => true, 'user' => $user]);

case 'save_product':
    $p = is_array($in['product'] ?? null) ? $in['product'] : nk_fail('Missing product');
    $id = nk_str($p['id'] ?? '', 40);
    if (!preg_match('/^[A-Za-z0-9_-]{1,40}$/', $id)) nk_fail('Bad product id');
    $name = nk_str($p['name'] ?? '', 80);
    if ($name === '') nk_fail('Name is required');
    $cat = nk_str($p['categoryId'] ?? '', 40);
    $st = $db->prepare('SELECT 1 FROM categories WHERE id = ?'); $st->execute([$cat]);
    if (!$st->fetchColumn()) nk_fail('Pick a category');
    $image = nk_save_image((string)($p['image'] ?? ''), $id);
    $isNew = !empty($in['isNew']);
    $sort = 0;
    if ($isNew) $sort = (int)$db->query('SELECT COALESCE(MIN(sort), 0) - 1 FROM products')->fetchColumn();
    $vals = [
        $name, nk_str($p['arabic'] ?? '', 80), nk_str($p['urdu'] ?? '', 80),
        nk_str($p['desc'] ?? '', 600), nk_str($p['descUr'] ?? '', 600), nk_str($p['descAr'] ?? '', 600),
        $cat, nk_num($p['price'] ?? 0), nk_num($p['oldPrice'] ?? 0), nk_str($p['unit'] ?? '1 kg', 30) ?: '1 kg',
        max(0, (int)($p['stock'] ?? 0)), nk_str($p['palette'] ?? 'ajwa', 20), nk_str($p['badge'] ?? '', 30), $image,
    ];
    $sql = 'INSERT INTO products (name, arabic, urdu, descr, descr_ur, descr_ar, category_id, price, old_price, unit, stock, palette, badge, image, id, sort)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), arabic=VALUES(arabic), urdu=VALUES(urdu), descr=VALUES(descr), descr_ur=VALUES(descr_ur),
              descr_ar=VALUES(descr_ar), category_id=VALUES(category_id), price=VALUES(price), old_price=VALUES(old_price), unit=VALUES(unit),
              stock=VALUES(stock), palette=VALUES(palette), badge=VALUES(badge), image=VALUES(image)';
    $db->prepare($sql)->execute([...$vals, $id, $sort]);
    nk_json(['ok' => true, 'products' => nk_products()]);

case 'set_price':
    $db->prepare('UPDATE products SET price = ? WHERE id = ?')->execute([nk_num($in['price'] ?? 0), nk_str($in['id'] ?? '', 40)]);
    nk_json(['ok' => true, 'products' => nk_products()]);

case 'delete_product':
    $db->prepare('DELETE FROM products WHERE id = ?')->execute([nk_str($in['id'] ?? '', 40)]);
    nk_json(['ok' => true, 'products' => nk_products()]);

case 'add_category':
    $name = nk_str($in['name'] ?? '', 40);
    if ($name === '') nk_fail('Name is required');
    $st = $db->prepare('SELECT 1 FROM categories WHERE LOWER(name) = LOWER(?)'); $st->execute([$name]);
    if ($st->fetchColumn()) nk_fail('That category already exists');
    $id = 'c-' . bin2hex(random_bytes(4));
    $sort = (int)$db->query('SELECT COALESCE(MAX(sort), 0) + 1 FROM categories')->fetchColumn();
    $db->prepare('INSERT INTO categories (id, name, name_ur, name_ar, sort) VALUES (?, ?, "", "", ?)')->execute([$id, $name, $sort]);
    nk_json(['ok' => true, 'categories' => nk_categories()]);

case 'update_category':
    $col = ['name' => 'name', 'nameUr' => 'name_ur', 'nameAr' => 'name_ar'][$in['field'] ?? ''] ?? nk_fail('Bad field');
    $v = nk_str($in['value'] ?? '', 40);
    if ($col === 'name' && $v === '') nk_fail('Name is required');
    $db->prepare("UPDATE categories SET $col = ? WHERE id = ?")->execute([$v, nk_str($in['id'] ?? '', 40)]);
    nk_json(['ok' => true, 'categories' => nk_categories()]);

case 'delete_category':
    $id = nk_str($in['id'] ?? '', 40);
    $st = $db->prepare('SELECT COUNT(*) FROM products WHERE category_id = ?'); $st->execute([$id]);
    if ((int)$st->fetchColumn() > 0) nk_fail('Move or delete its products first');
    $db->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
    nk_json(['ok' => true, 'categories' => nk_categories()]);

case 'save_settings':
    $s = is_array($in['settings'] ?? null) ? $in['settings'] : nk_fail('Missing settings');
    nk_write_settings($s);
    nk_json(['ok' => true, 'settings' => nk_settings()]);

case 'order_status':
    $id = nk_str($in['id'] ?? '', 20);
    $now = in_array($in['status'] ?? '', NK_STATUSES, true) ? $in['status'] : nk_fail('Bad status');
    $db->beginTransaction();
    $st = $db->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE'); $st->execute([$id]);
    $row = $st->fetch() ?: nk_fail('Order not found', 404);
    $was = $row['status'];
    // Cancelling puts the dates back on the shelf; un-cancelling takes them off again
    if (($was === 'cancelled') !== ($now === 'cancelled')) {
        $dir = $now === 'cancelled' ? 1 : -1;
        $up = $db->prepare('UPDATE products SET stock = GREATEST(0, stock + ?) WHERE id = ?');
        foreach ((json_decode($row['data'], true)['items'] ?? []) as $i) $up->execute([$dir * (int)$i['qty'], $i['id']]);
    }
    $db->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$now, $id]);
    $db->commit();
    nk_json(['ok' => true, 'products' => nk_products()]);

case 'order_paid':
    $db->prepare('UPDATE orders SET paid = ? WHERE id = ?')->execute([empty($in['paid']) ? 0 : 1, nk_str($in['id'] ?? '', 20)]);
    nk_json(['ok' => true]);

case 'import':
    // Restore a backup file: replaces settings, categories and products (orders untouched)
    $cats = is_array($in['categories'] ?? null) ? $in['categories'] : nk_fail('Bad backup');
    $prods = is_array($in['products'] ?? null) ? $in['products'] : nk_fail('Bad backup');
    $db->beginTransaction();
    $db->exec('DELETE FROM products');
    $db->exec('DELETE FROM categories');
    $ci = $db->prepare('INSERT INTO categories (id, name, name_ur, name_ar, sort) VALUES (?,?,?,?,?)');
    foreach (array_values($cats) as $n => $c) $ci->execute([nk_str($c['id'] ?? '', 40), nk_str($c['name'] ?? '', 40), nk_str($c['nameUr'] ?? '', 40), nk_str($c['nameAr'] ?? '', 40), $n]);
    $pi = $db->prepare('INSERT INTO products (id, name, arabic, urdu, descr, descr_ur, descr_ar, category_id, price, old_price, unit, stock, palette, badge, image, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach (array_values($prods) as $n => $p) {
        $id = nk_str($p['id'] ?? '', 40);
        $pi->execute([$id, nk_str($p['name'] ?? '', 80), nk_str($p['arabic'] ?? '', 80), nk_str($p['urdu'] ?? '', 80), nk_str($p['desc'] ?? '', 600),
            nk_str($p['descUr'] ?? '', 600), nk_str($p['descAr'] ?? '', 600), nk_str($p['categoryId'] ?? '', 40), nk_num($p['price'] ?? 0),
            nk_num($p['oldPrice'] ?? 0), nk_str($p['unit'] ?? '1 kg', 30), max(0, (int)($p['stock'] ?? 0)), nk_str($p['palette'] ?? 'ajwa', 20),
            nk_str($p['badge'] ?? '', 30), nk_save_image((string)($p['image'] ?? ''), $id), $n]);
    }
    if (is_array($in['settings'] ?? null)) nk_write_settings($in['settings']);
    $db->commit();
    nk_json(['ok' => true, 'settings' => nk_settings(), 'categories' => nk_categories(), 'products' => nk_products()]);

default:
    nk_fail('Unknown action', 404);
}

/* ---------- helpers ---------- */
function nk_write_settings(array $s): void {
    $text = ['name' => 80, 'arabic' => 80, 'tagline' => 160, 'whatsapp' => 20, 'currency' => 5, 'address' => 160,
             'bankName' => 80, 'accountTitle' => 80, 'iban' => 40, 'stcNumber' => 20];
    $nums = ['deliveryFee', 'freeOver', 'codFee'];
    $bools = ['pickup', 'payCod', 'payBank', 'payStc', 'payLink'];
    $out = [];
    foreach ($text as $k => $max) if (array_key_exists($k, $s)) $out[$k] = nk_str($s[$k], $max);
    foreach ($nums as $k) if (array_key_exists($k, $s)) $out[$k] = nk_num($s[$k]);
    foreach ($bools as $k) if (array_key_exists($k, $s)) $out[$k] = (bool)$s[$k];
    if (isset($out['whatsapp'])) $out['whatsapp'] = preg_replace('/\D/', '', $out['whatsapp']);
    if (isset($out['name']) && $out['name'] === '') $out['name'] = 'Altayba Traders';
    if (isset($out['currency']) && $out['currency'] === '') $out['currency'] = 'SAR';
    $cur = nk_settings();
    $merged = array_merge($cur, $out);
    if (empty($merged['payCod']) && empty($merged['payBank']) && empty($merged['payStc']) && empty($merged['payLink'])) $out['payCod'] = true;
    $st = nk_db()->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
    foreach ($out as $k => $v) $st->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE)]);
}

/* A data: URL from the dashboard becomes a real file in /uploads; anything else must be a plain path or https URL. */
function nk_save_image(string $img, string $id): string {
    $img = trim($img);
    if ($img === '') return '';
    if (preg_match('#^data:image/(jpeg|png|webp);base64,(.+)$#s', $img, $m)) {
        $bin = base64_decode($m[2], true);
        if ($bin === false || strlen($bin) > 4_000_000) nk_fail('Image is too large');
        $info = @getimagesizefromstring($bin);
        if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) nk_fail('That file is not a photo');
        $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'][$info[2]];
        $dir = dirname(__DIR__) . '/uploads';
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $name = preg_replace('/[^A-Za-z0-9_-]/', '', $id) . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
        if (file_put_contents("$dir/$name", $bin) === false) nk_fail('Could not save the photo', 500);
        return "uploads/$name";
    }
    if (preg_match('#^(images|uploads)/[A-Za-z0-9._-]+$#', $img) || preg_match('#^https://[^\s"\'<>]+$#', $img)) return mb_substr($img, 0, 500);
    nk_fail('Image must be an uploaded photo or an https:// link');
}
