import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const htmlFiles = (await readdir(root)).filter((name) => name.endsWith('.html'));
const errors = [];
let plantCount = 0;
const plantNames = [];
let classificationFigures = 0;
let gameDetails = 0;
let gameVisuals = 0;
let fragrantCount = 0;
let fragrantPlates = 0;

for (const file of htmlFiles) {
  const full = join(root, file);
  const html = await readFile(full, 'utf8');
  if (file === 'plants.html') plantCount += (html.match(/class="plant-card/g) || []).length;
  if (file === 'fragrant-plants.html') {
    fragrantCount += (html.match(/class="plant-card/g) || []).length;
    fragrantPlates += (html.match(/class="plate"/g) || []).length;
  }
  classificationFigures += (html.match(/class="classification-figure/g) || []).length;
  gameDetails += (html.match(/class="game-detail/g) || []).length;
  gameVisuals += (html.match(/class="game-visual/g) || []).length;
  if (file === 'plants.html') {
    for (const match of html.matchAll(/class="plant-card[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g)) plantNames.push(match[1]);
  }

  if (/待補|lorem ipsum|placeholder/i.test(html)) errors.push(`${file}: 發現占位文字`);
  if (html.includes('brand-mark')) errors.push(`${file}: 不應再出現圓形葉品牌圖示`);
  if (html.includes('hero-note')) errors.push(`${file}: 不應再出現首頁封面資訊條`);
  if (!html.includes('<html lang="zh-Hant">')) errors.push(`${file}: 缺少 zh-Hant 語系`);
  if (!html.includes('aria-label="教材頁籤"')) errors.push(`${file}: 缺少導覽標籤`);

  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(target)) continue;
    try { await access(resolve(dirname(full), target)); }
    catch { errors.push(`${file}: 找不到 ${target}`); }
  }
}

const gameFragment = await readFile(join(root, 'game-two.fragment'), 'utf8');
gameDetails += (gameFragment.match(/class="game-detail/g) || []).length;
gameVisuals += (gameFragment.match(/class="game-visual/g) || []).length;

if (htmlFiles.length !== 7) errors.push(`應有 7 個 HTML 頁面，實際 ${htmlFiles.length}`);
if (plantCount !== 61) errors.push(`植物卡應有 61 張，實際 ${plantCount}`);
if (new Set(plantNames).size !== plantNames.length) errors.push('植物名稱不可重複');
if (fragrantCount !== 32) errors.push(`芳香植物卡應有 32 張，實際 ${fragrantCount}`);
if (fragrantPlates !== 7) errors.push(`芳香植物圖版應有 7 張，實際 ${fragrantPlates}`);
if (classificationFigures !== 6) errors.push(`果實種子分類圖應有 6 張，實際 ${classificationFigures}`);
if (gameDetails !== 8) errors.push(`五感遊戲應有 8 套，實際 ${gameDetails}`);
if (gameVisuals !== 8) errors.push(`五感遊戲步驟圖應有 8 張，實際 ${gameVisuals}`);

const imageDir = join(root, 'assets', 'images');
const images = (await readdir(imageDir)).filter((name) => name.endsWith('.png'));
await access(join(root, 'assets', 'social-preview.png'));
const imageAssetCount = images.length + 1;
if (imageAssetCount !== 44) errors.push(`IMAGE 2.0 圖片應有 44 張，實際 ${imageAssetCount}`);
const indexHtml = await readFile(join(root, 'index.html'), 'utf8');
for (const marker of ['og:image', 'twitter:card', 'https://prayer168.github.io/Plant-Detective/assets/social-preview.png']) {
  if (!indexHtml.includes(marker)) errors.push(`index.html: 缺少社群預覽 metadata ${marker}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`PASS: ${htmlFiles.length} pages, ${plantCount} campus plants, ${fragrantCount} fragrant plants, ${fragrantPlates} fragrant plates, ${classificationFigures} classification figures, ${gameDetails} games, ${imageAssetCount} IMAGE 2.0 assets`);
