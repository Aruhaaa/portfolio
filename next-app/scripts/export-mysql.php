<?php
// Read-only export of the Laragon "portfolio" MySQL database to one JSON file.
// Usage (from the next-app folder): php scripts/export-mysql.php export.json
$out = $argv[1] ?? null;
if (!$out) { fwrite(STDERR, "Usage: php export-mysql.php out.json\n"); exit(1); }

$host = getenv('EXPORT_DB_HOST') ?: '127.0.0.1';
$port = getenv('EXPORT_DB_PORT') ?: '3306';
$name = getenv('EXPORT_DB_NAME') ?: 'portfolio';
$user = getenv('EXPORT_DB_USER') ?: 'root';
$pass = getenv('EXPORT_DB_PASS') ?: '';

$pdo = new PDO("mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$rows = fn(string $sql) => $pdo->query($sql)->fetchAll();
$json = fn($v) => json_decode((string) $v, true) ?: [];

$info = $rows('select name, title, bio, email, github, linkedin from personal_info order by id limit 1')[0] ?? null;

$skills = array_map(fn($r) => [
    'category' => $r['category'], 'items' => $json($r['items']), 'sort_order' => (int) $r['sort_order'],
], $rows('select category, items, sort_order from skills order by sort_order, id'));

$experiences = array_map(fn($r) => [
    'role' => $r['role'], 'company' => $r['company'], 'duration' => $r['duration'],
    'description' => $r['description'], 'sort_order' => (int) $r['sort_order'],
], $rows('select role, company, duration, description, sort_order from experiences order by sort_order, id'));

$images = [];
foreach ($rows('select project_id, mime, data from project_images') as $r) {
    $images[(int) $r['project_id']] = ['mime' => $r['mime'], 'base64' => $r['data']];
}

$hasRepo = (bool) $rows("show columns from projects like 'repo_link'");
$hasHero = (bool) $rows("show columns from projects like 'is_hero'");
$cols = 'id, title, description, tech_stack, link, featured, sort_order'
    . ($hasRepo ? ', repo_link' : '') . ($hasHero ? ', is_hero' : '');
$projects = array_map(fn($r) => [
    'title' => $r['title'], 'description' => $r['description'], 'tech_stack' => $json($r['tech_stack']),
    'link' => ($r['link'] === '#' || $r['link'] === '') ? null : $r['link'],
    'repo_link' => $r['repo_link'] ?? null,
    'featured' => (bool) $r['featured'], 'is_hero' => (bool) ($r['is_hero'] ?? false),
    'sort_order' => (int) $r['sort_order'],
    'image' => $images[(int) $r['id']] ?? null,
], $rows("select $cols from projects order by sort_order, id"));

file_put_contents($out, json_encode([
    'personal_info' => $info, 'skills' => $skills, 'experiences' => $experiences, 'projects' => $projects,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));

printf("Exported: %s | %d skills, %d experiences, %d projects (%d with screenshot)\n",
    $info ? 'personal info' : 'NO personal info', count($skills), count($experiences), count($projects), count($images));
