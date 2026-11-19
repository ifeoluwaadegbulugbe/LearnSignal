// Calls the two AI routes on the running dev server as the test teacher and saves the raw results.
// Usage: node scripts/ai-smoke.mjs   (needs .env.test.local and a demo class loaded)
// Output: docs/ai-runs/<timestamp>.json  — used to write docs/AI_BEHAVIOR.md from real runs.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const env = Object.fromEntries(readFileSync(new URL('../.env.test.local', import.meta.url), 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto(`${BASE}/login`);
await page.fill('#email', env.TEST_TEACHER_A_EMAIL);
await page.fill('#password', env.TEST_TEACHER_A_PASSWORD);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 90000 }), page.click('button[type=submit]')]);
await page.goto(`${BASE}/dashboard`);
const classroomId = (await page.locator('a[href^="/classrooms/"]').first().getAttribute('href')).split('/')[2];

const runs = [];
const call = async (label, path, body) => {
  const t = Date.now();
  const r = await page.request.post(`${BASE}${path}`, { data: body, timeout: 120000 });
  const json = await r.json().catch(() => ({}));
  runs.push({ label, path, input: body, status: r.status(), ms: Date.now() - t, output: json });
  console.log(`${label}: HTTP ${r.status()} in ${Date.now() - t}ms`, json.ok ? '' : JSON.stringify(json.error));
};

const which = process.argv.slice(2);
if (!which.length || which.includes('gen')) {
  await call('generate N4 level 2', '/api/generate-exercises', { skillId: 'N4', difficulty: 2, count: 5, language: 'en' });
  await call('generate L2 level 1', '/api/generate-exercises', { skillId: 'L2', difficulty: 1, count: 5, language: 'en' });
}
if (!which.length || which.includes('ask')) {
  await call('ask: subtraction support', '/api/assistant', { classroomId, question: 'Who needs subtraction support?' });
  await call('ask: unsupported', '/api/assistant', { classroomId, question: 'Which learners have the best handwriting?' });
  await call('ask: general guidance', '/api/assistant', { classroomId, question: 'Give me a 15-minute blending activity.' });
}
mkdirSync(new URL('../docs/ai-runs/', import.meta.url), { recursive: true });
const file = new URL(`../docs/ai-runs/${new Date().toISOString().replace(/[:.]/g, '-')}.json`, import.meta.url);
writeFileSync(file, JSON.stringify(runs, null, 2));
console.log('saved', file.pathname);
await browser.close();
