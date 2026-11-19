// Signs in as test teacher A and presses "Reset demo class" in Settings. Usage: node scripts/reset-demo.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const env = Object.fromEntries(readFileSync(new URL('../.env.test.local', import.meta.url), 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}/login`);
await page.fill('#email', env.TEST_TEACHER_A_EMAIL);
await page.fill('#password', env.TEST_TEACHER_A_PASSWORD);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 90000 }), page.click('button[type=submit]')]);
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
await Promise.all([page.waitForURL(/\/classrooms\//, { timeout: 90000 }), page.getByRole('button', { name: 'Reset demo class' }).click()]);
await page.goto(`${page.url()}/progress`, { waitUntil: 'networkidle' });
console.log((await page.locator('tbody tr').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ')).join('\n'));
await browser.close();
