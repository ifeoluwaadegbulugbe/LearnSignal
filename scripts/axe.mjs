// Runs axe-core (WCAG 2.1 A/AA) on every screen in light and night themes.
// Usage: node scripts/axe.mjs   (dev server on :3000, TEST_TEACHER_A_* in .env.test.local)
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const env = Object.fromEntries(readFileSync(new URL('../.env.test.local', import.meta.url), 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

const results = [];
async function scan(name, path) {
  for (const theme of ['light', 'night']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.evaluate((t) => { localStorage.setItem('ls-theme', t); document.documentElement.dataset.theme = t; }, theme);
    await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    results.push({ name, theme, violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary ?? '').split('\n').slice(1, 2).join('')) })) });
  }
}
for (const p of ['/login', '/signup', '/', '/privacy', '/how-scoring-works']) await scan(p, p);

await page.goto(`${BASE}/login`);
await page.fill('#email', env.TEST_TEACHER_A_EMAIL);
await page.fill('#password', env.TEST_TEACHER_A_PASSWORD);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 }), page.click('button[type=submit]')]);
await page.goto(`${BASE}/dashboard`);
const c = await page.locator('a[href^="/classrooms/"]').first().getAttribute('href');
await page.goto(`${BASE}${c}/learners`);
const l = await page.locator('a[href^="/learners/"]').first().getAttribute('href');
const id = l.split('/')[2];
for (const [n, p] of Object.entries({ today: c, learners: `${c}/learners`, profile: l, check: `/learners/${id}/assess`, groups: `${c}/groups`, practice: '/exercises', progress: `${c}/progress`, ask: '/assistant', school: '/school', settings: '/settings', child: `/learn/${id}` })) await scan(n, p);
await page.evaluate(() => localStorage.setItem('ls-theme', 'light'));
await browser.close();
for (const r of results) console.log(`${r.name} [${r.theme}] ${r.violations.length ? r.violations.map((v) => `${v.id}(${v.impact},${v.nodes})`).join(' ') : 'OK'}`);
const all = results.flatMap((r) => r.violations.map((v) => ({ ...v, page: r.name, theme: r.theme })));
for (const v of all) for (const s of v.sample) console.log(`  ${v.page}/${v.theme} ${v.id}: ${s}`);
