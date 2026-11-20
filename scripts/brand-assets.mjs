// Renders favicon, Apple/PWA icons and the OG image from public/brand/*.svg.
// Usage: node scripts/brand-assets.mjs   (needs Playwright's Chromium and the Sora font from Google Fonts)
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const icon = readFileSync('public/brand/app-icon.svg', 'utf8');
const mark = readFileSync('public/brand/mark-steps.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(html, w, h, path, transparent = true) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@700&family=Inter:wght@500&display=block"><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${html}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ omitBackground: transparent, type: 'png' });
  if (path) writeFileSync(path, buf);
  return buf;
}
const sized = (svg, s) => svg.replace('<svg ', `<svg width="${s}" height="${s}" `);

await shot(sized(icon, 180), 180, 180, 'app/apple-icon.png');
await shot(sized(icon, 192), 192, 192, 'public/icons/icon-192.png');
await shot(sized(icon, 512), 512, 512, 'public/icons/icon-512.png');
// Maskable: full-bleed violet with the tiles inside the 80% safe zone.
await shot(`<div style="width:512px;height:512px;background:linear-gradient(135deg,#6C52F0,#4A2FD0);display:grid;place-items:center">${sized(icon.replace(/<rect width="120" height="120" rx="28" fill="url\(#g\)"\/>/, ''), 360)}</div>`, 512, 512, 'public/icons/icon-maskable-512.png', false);

// favicon.ico: one 32x32 PNG wrapped in an ICO container.
const png = await shot(sized(icon, 32), 32, 32);
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
writeFileSync('app/favicon.ico', Buffer.concat([head, png]));

// Open Graph image, 1200x630.
await shot(`<div style="width:1200px;height:630px;background:#F8F8FC;position:relative;overflow:hidden;font-family:Sora,sans-serif">
  <div style="position:absolute;inset:0;background:radial-gradient(70% 100% at 0% 0%,#ECE8FF 0%,transparent 60%),radial-gradient(60% 90% at 100% 0%,#FFEBDD 0%,transparent 55%)"></div>
  <div style="position:absolute;left:96px;top:150px;display:flex;align-items:center;gap:28px">${sized(mark, 120)}
    <span style="font-size:88px;font-weight:700;letter-spacing:-0.03em;color:#171625">Learn<span style="color:#5B3FE0">Signal</span></span></div>
  <div style="position:absolute;left:100px;top:340px;font-family:Inter,sans-serif;font-weight:500;font-size:44px;line-height:1.25;color:#171625;max-width:900px">Find the exact skill each child is missing</div>
  <div style="position:absolute;left:100px;bottom:72px;font-family:Inter,sans-serif;font-size:24px;color:#626273">For primary teachers · Assess, group, practise, re-check</div>
</div>`, 1200, 630, 'app/opengraph-image.png', false);

await browser.close();
console.log('brand assets written');
