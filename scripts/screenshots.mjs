// Captures each screen at 390, 768 and 1440px into docs/screenshots/ using the local dev server.
// Usage: node scripts/screenshots.mjs [screenName ...]
// Needs: dev server on http://localhost:3000, a test teacher in .env.test.local (TEST_TEACHER_A_*), demo class loaded.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const env = Object.fromEntries(readFileSync(new URL('../.env.test.local', import.meta.url), 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const WIDTHS = [[390, 844], [768, 1024], [1440, 900]];
const out = new URL('../docs/screenshots/', import.meta.url);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Sign in once (public pages work without it).
await page.goto(`${BASE}/login`);
await page.fill('#email', env.TEST_TEACHER_A_EMAIL);
await page.fill('#password', env.TEST_TEACHER_A_PASSWORD);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 }), page.click('button[type=submit]')]);

// Resolve the demo class + a learner from the dashboard.
await page.goto(`${BASE}/dashboard`);
const classHref = await page.locator('a[href^="/classrooms/"]').first().getAttribute('href');
await page.goto(`${BASE}${classHref}/learners`);
const learnerHref = await page.locator('a[href^="/learners/"]').first().getAttribute('href');
const learnerId = learnerHref?.split('/')[2];

const SCREENS = {
  today: classHref,
  learners: `${classHref}/learners`,
  'learner-profile': learnerHref,
  checks: `/learners/${learnerId}/assess`,
  groups: `${classHref}/groups`,
  practice: '/exercises',
  progress: `${classHref}/progress`,
  ask: '/assistant',
  school: '/school',
  settings: '/settings',
  'child-mode': `/learn/${learnerId}`,
  'dev-ui': '/dev/ui',
  landing: '/',
  privacy: '/privacy',
  'how-scoring-works': '/how-scoring-works',
};
const only = process.argv.slice(2);
for (const [name, path] of Object.entries(SCREENS)) {
  if (only.length && !only.includes(name)) continue;
  for (const [w, h] of WIDTHS) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: new URL(`${name}-${w}.png`, out).pathname.replace(/^\/([A-Z]:)/, '$1'), fullPage: true });
    console.log(`captured ${name} @ ${w}`);
  }
}
await browser.close();
