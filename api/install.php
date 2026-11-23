<?php
/* ONE-TIME installer: creates the tables and loads the starting catalogue.
   Refuses to run if already installed. Delete this file after use. */
declare(strict_types=1);
require __DIR__ . '/_lib.php';

$token = is_file(__DIR__ . '/install.token') ? trim((string)file_get_contents(__DIR__ . '/install.token')) : '';
if ($token === '' || !hash_equals($token, (string)($_GET['token'] ?? ''))) nk_fail('Not found', 404);

$db = nk_db();
$exists = $db->query("SHOW TABLES LIKE 'admins'")->fetchColumn();
if ($exists && (int)$db->query('SELECT COUNT(*) FROM admins')->fetchColumn() > 0) nk_fail('Already installed', 409);

$schema = <<<SQL
CREATE TABLE IF NOT EXISTS settings (
  k VARCHAR(64) NOT NULL PRIMARY KEY,
  v TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(40) NOT NULL PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  name_ur VARCHAR(40) NOT NULL DEFAULT '',
  name_ar VARCHAR(40) NOT NULL DEFAULT '',
  sort INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(40) NOT NULL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  arabic VARCHAR(80) NOT NULL DEFAULT '',
  urdu VARCHAR(80) NOT NULL DEFAULT '',
  descr VARCHAR(600) NOT NULL DEFAULT '',
  descr_ur VARCHAR(600) NOT NULL DEFAULT '',
  descr_ar VARCHAR(600) NOT NULL DEFAULT '',
  category_id VARCHAR(40) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  old_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(30) NOT NULL DEFAULT '1 kg',
  stock INT NOT NULL DEFAULT 0,
  palette VARCHAR(20) NOT NULL DEFAULT 'ajwa',
  badge VARCHAR(30) NOT NULL DEFAULT '',
  image VARCHAR(500) NOT NULL DEFAULT '',
  sort INT NOT NULL DEFAULT 0,
  KEY idx_cat (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(20) NOT NULL PRIMARY KEY,
  status VARCHAR(12) NOT NULL DEFAULT 'new',
  paid TINYINT(1) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  data MEDIUMTEXT NOT NULL,
  ip VARCHAR(45) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  KEY idx_created (created_at),
  KEY idx_status (status),
  KEY idx_ip (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(40) NOT NULL UNIQUE,
  pass_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  at DATETIME NOT NULL,
  KEY idx_ip (ip, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
foreach (array_filter(array_map('trim', explode(';', $schema))) as $sql) $db->exec($sql);

$seed = json_decode((string)@file_get_contents(__DIR__ . '/seed.json'), true);
if (!is_array($seed)) nk_fail('seed.json missing', 500);

$db->beginTransaction();
$st = $db->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
foreach ($seed['settings'] as $k => $v) $st->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE)]);

$st = $db->prepare('INSERT IGNORE INTO categories (id, name, name_ur, name_ar, sort) VALUES (?,?,?,?,?)');
foreach ($seed['categories'] as $n => $c) $st->execute([$c['id'], $c['name'], $c['nameUr'] ?? '', $c['nameAr'] ?? '', $n]);

$st = $db->prepare('INSERT IGNORE INTO products (id, name, arabic, urdu, descr, descr_ur, descr_ar, category_id, price, old_price, unit, stock, palette, badge, image, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
foreach ($seed['products'] as $n => $p) {
    $st->execute([$p['id'], $p['name'], $p['arabic'] ?? '', $p['urdu'] ?? '', $p['desc'] ?? '', $p['descUr'] ?? '', $p['descAr'] ?? '',
        $p['categoryId'], $p['price'], $p['oldPrice'] ?? 0, $p['unit'] ?? '1 kg', $p['stock'] ?? 0, $p['palette'] ?? 'ajwa', $p['badge'] ?? '', $p['image'] ?? '', $n]);
}

// First admin — change this password from Dashboard → Settings after the first sign-in
$db->prepare('INSERT INTO admins (username, pass_hash) VALUES (?, ?)')->execute(['admin', password_hash('Altayba@2026', PASSWORD_DEFAULT)]);
$db->commit();

nk_json(['ok' => true, 'tables' => $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN), 'products' => count($seed['products'])]);
