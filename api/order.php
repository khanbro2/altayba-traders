<?php
/* Place an order. The server re-prices everything from the database and
   reserves stock inside one transaction, so the browser can't change prices. */
declare(strict_types=1);
require __DIR__ . '/_lib.php';

$in = nk_body();
$db = nk_db();

// Light flood protection: max 10 orders per IP per 10 minutes
$st = $db->prepare('SELECT COUNT(*) FROM orders WHERE ip = ? AND created_at > (UTC_TIMESTAMP() - INTERVAL 10 MINUTE)');
$st->execute([nk_client_ip()]);
if ((int)$st->fetchColumn() >= 10) nk_fail('Too many orders, please try again shortly', 429);

$cart = is_array($in['cart'] ?? null) ? $in['cart'] : [];
$qtys = [];
foreach ($cart as $id => $q) {
    $q = (int)$q;
    if ($q > 0 && $q <= 999 && is_string($id) && strlen($id) <= 40) $qtys[$id] = $q;
}
if (!$qtys) nk_fail('Your basket is empty', 400, ['code' => 'empty']);
if (count($qtys) > 50) nk_fail('Too many items');

$delivery = ($in['delivery'] ?? '') === 'pickup' ? 'pickup' : 'delivery';
$c = is_array($in['customer'] ?? null) ? $in['customer'] : [];
$customer = [
    'name' => nk_str($c['name'] ?? '', 60),
    'phone' => nk_str($c['phone'] ?? '', 30),
    'email' => nk_str($c['email'] ?? '', 120),
    'city' => $delivery === 'pickup' ? '' : nk_str($c['city'] ?? '', 60),
    'district' => nk_str($c['district'] ?? '', 60),
    'address' => $delivery === 'pickup' ? '' : nk_str($c['address'] ?? '', 160),
    'notes' => nk_str($c['notes'] ?? '', 240),
];
if ($customer['name'] === '') nk_fail('Name is required', 422, ['field' => 'name']);
if (strlen(preg_replace('/\D/', '', $customer['phone'])) < 9) nk_fail('Phone is required', 422, ['field' => 'phone']);
if ($customer['email'] !== '' && !filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) nk_fail('Email looks wrong', 422, ['field' => 'email']);
if ($delivery === 'delivery' && ($customer['city'] === '' || $customer['address'] === '')) nk_fail('Address is required', 422, ['field' => 'address']);

$s = nk_settings();
if ($delivery === 'pickup' && empty($s['pickup'])) $delivery = 'delivery';
$payment = in_array($in['payment'] ?? '', NK_PAYMENTS, true) ? $in['payment'] : 'cod';
$enabled = ['cod' => !empty($s['payCod']), 'bank' => !empty($s['payBank']), 'stc' => !empty($s['payStc']), 'link' => !empty($s['payLink'])];
if (empty($enabled[$payment])) $payment = 'cod';

try {
    $db->beginTransaction();
    $marks = implode(',', array_fill(0, count($qtys), '?'));
    $st = $db->prepare("SELECT * FROM products WHERE id IN ($marks) FOR UPDATE");
    $st->execute(array_keys($qtys));
    $found = [];
    foreach ($st->fetchAll() as $p) $found[$p['id']] = $p;

    $items = [];
    $subtotal = 0.0;
    foreach ($qtys as $id => $q) {
        $p = $found[$id] ?? null;
        if (!$p || (int)$p['stock'] < $q) {
            $db->rollBack();
            nk_fail('Not enough stock', 409, ['code' => 'stock', 'id' => $id, 'stock' => $p ? (int)$p['stock'] : 0, 'products' => nk_products()]);
        }
        $price = (float)$p['price'];
        $items[] = ['id' => $id, 'name' => $p['name'], 'unit' => $p['unit'], 'price' => $price, 'qty' => $q, 'image' => $p['image'], 'palette' => $p['palette']];
        $subtotal += $price * $q;
    }
    $t = nk_totals($subtotal, $s, $delivery, $payment, true);

    $up = $db->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    foreach ($items as $i) $up->execute([$i['qty'], $i['id']]);

    $order = [
        'currency' => $s['currency'] ?? 'SAR', 'customer' => $customer, 'delivery' => $delivery, 'payment' => $payment,
        'items' => $items, 'subtotal' => $t['subtotal'], 'deliveryFee' => $t['delivery'], 'codFee' => $t['codFee'], 'total' => $t['total'],
    ];
    $ins = $db->prepare('INSERT INTO orders (id, status, paid, total, data, ip, created_at) VALUES (?, "new", 0, ?, ?, ?, UTC_TIMESTAMP())');
    $no = '';
    for ($try = 0; $try < 8; $try++) {
        $no = 'NK-' . gmdate('ymd') . '-' . random_int(1000, 9999);
        try { $ins->execute([$no, $t['total'], json_encode($order, JSON_UNESCAPED_UNICODE), nk_client_ip()]); break; }
        catch (PDOException $e) { if ($e->errorInfo[1] != 1062 || $try === 7) throw $e; }
    }
    $db->commit();
} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('Altayba order failed: ' . $e->getMessage());
    nk_fail('Could not save the order', 500);
}

$st = $db->prepare('SELECT * FROM orders WHERE id = ?');
$st->execute([$no]);
nk_json(['ok' => true, 'order' => nk_order_out($st->fetch()), 'products' => nk_products()]);
