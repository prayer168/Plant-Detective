import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const playwrightModule = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = await import(playwrightModule);

const root = resolve(import.meta.dirname, '..');
const screenshotDir = join(root, 'docs', 'screenshots');
await mkdir(screenshotDir, { recursive: true });

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pages = ['index.html', 'plants.html', 'seeds.html', 'leaves.html', 'game-one.html', 'game-two.html'];
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];
const failures = [];
const browser = await chromium.launch({ executablePath: chromePath, headless: true });

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  for (const file of pages) {
    const page = await context.newPage();
    const messages = [];
    page.on('console', (message) => {
      if (message.type() === 'error') messages.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));

    const response = await page.goto(`${baseUrl}/${file}`, { waitUntil: 'networkidle' });
    if (!response || response.status() !== 200) failures.push(`${viewport.name}/${file}: HTTP ${response?.status()}`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.documentElement.style.scrollBehavior = 'auto';
      for (const image of document.images) image.loading = 'eager';
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
        scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
      scrollTo(0, 0);
    });

    const state = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      current: document.querySelectorAll('[aria-current="page"]').length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
      cards: document.querySelectorAll('.plant-card').length,
      plates: document.querySelectorAll('.plate img').length
    }));
    if (state.h1 !== 1) failures.push(`${viewport.name}/${file}: h1=${state.h1}`);
    if (state.current !== 1) failures.push(`${viewport.name}/${file}: aria-current=${state.current}`);
    if (state.overflow) failures.push(`${viewport.name}/${file}: horizontal overflow`);
    if (state.brokenImages.length) failures.push(`${viewport.name}/${file}: broken images ${state.brokenImages.join(', ')}`);
    if (file === 'plants.html' && (state.cards !== 61 || state.plates !== 13)) failures.push(`${viewport.name}/${file}: cards=${state.cards}, plates=${state.plates}`);
    if (messages.length) failures.push(`${viewport.name}/${file}: ${messages.join(' | ')}`);

    const stem = file.replace('.html', '');
    await page.screenshot({ path: join(screenshotDir, `${stem}-${viewport.name}.png`) });
    if (file === 'plants.html') {
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await page.screenshot({ path: join(screenshotDir, `${stem}-tail-${viewport.name}.png`) });
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('PASS: 18 page/viewport combinations; 61 cards; 13 plant plates; no browser errors, broken images, or horizontal overflow');
