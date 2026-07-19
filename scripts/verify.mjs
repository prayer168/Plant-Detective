import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const htmlFiles = (await readdir(root)).filter((name) => name.endsWith('.html'));
const errors = [];
let plantCount = 0;
const plantNames = [];

for (const file of htmlFiles) {
  const full = join(root, file);
  const html = await readFile(full, 'utf8');
  plantCount += (html.match(/class="plant-card/g) || []).length;
  for (const match of html.matchAll(/class="plant-card[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g)) plantNames.push(match[1]);

  if (/待補|lorem ipsum|placeholder/i.test(html)) errors.push(`${file}: 發現占位文字`);
  if (!html.includes('<html lang="zh-Hant">')) errors.push(`${file}: 缺少 zh-Hant 語系`);
  if (!html.includes('aria-label="教材頁籤"')) errors.push(`${file}: 缺少導覽標籤`);

  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(target)) continue;
    try { await access(resolve(dirname(full), target)); }
    catch { errors.push(`${file}: 找不到 ${target}`); }
  }
}

if (htmlFiles.length !== 6) errors.push(`應有 6 個 HTML 頁面，實際 ${htmlFiles.length}`);
if (plantCount !== 60) errors.push(`植物卡應有 60 張，實際 ${plantCount}`);
if (new Set(plantNames).size !== plantNames.length) errors.push('植物名稱不可重複');

const imageDir = join(root, 'assets', 'images');
const images = (await readdir(imageDir)).filter((name) => name.endsWith('.png'));
if (images.length !== 20) errors.push(`IMAGE 2.0 圖片應有 20 張，實際 ${images.length}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`PASS: ${htmlFiles.length} pages, ${plantCount} plants, ${images.length} IMAGE 2.0 assets`);
