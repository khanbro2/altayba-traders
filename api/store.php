<?php
/* Public catalogue: settings, categories, products */
declare(strict_types=1);
require __DIR__ . '/_lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') nk_fail('GET required', 405);
nk_json(['ok' => true, 'settings' => nk_settings(), 'categories' => nk_categories(), 'products' => nk_products()]);
