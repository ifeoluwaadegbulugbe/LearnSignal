// Captures a real crop of the Today screen (sample class) for the landing hero.
// Usage: node scripts/landing-hero.mjs   (dev server on :3000, TEST_TEACHER_A_* in .env.test.local)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const env = Object.fromEntries(readFileSync(new URL('../.env.test.local', import.meta.url), 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1300 }, deviceScaleFactor: 1.5 });
await page.goto(`${BASE}/login`);
await page.fill('#email', env.TEST_TEACHER_A_EMAIL);
await page.fill('#password', env.TEST_TEACHER_A_PASSWORD);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 }), page.click('button[type=submit]')]);
await page.goto(`${BASE}/dashboard`);
const href = await page.locator('a[href^="/classrooms/"]').first().getAttribute('href');
await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.waitForTimeout(600);
const banner = await page.locator('section[aria-label="Next step"]').boundingBox();
const ladder = await page.locator('h2:text("Class ladder")').locator('xpath=ancestor::section[1]').boundingBox();
const plan = await page.locator('#plan').locator('xpath=ancestor::section[1]').boundingBox();
const x = banner.x - 1, y = banner.y - 1;
await page.screenshot({ path: 'public/brand/today-hero.png', clip: { x, y, width: plan.x + plan.width - x + 1, height: ladder.y + ladder.height - y + 1 } });
await browser.close();
console.log('wrote public/brand/today-hero.png');
