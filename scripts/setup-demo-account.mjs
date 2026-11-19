// Creates (or reuses) the shared demo teacher from DEMO_EMAIL / DEMO_PASSWORD in .env.local,
// gives it a demo school, and loads the synthetic sample class. Usage: node scripts/setup-demo-account.mjs
// Afterwards run the SQL it prints once in Supabase so learner-mode exit skips the password for this account.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
if (!env.DEMO_EMAIL || !env.DEMO_PASSWORD) throw new Error('Set DEMO_EMAIL and DEMO_PASSWORD in .env.local first');

const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(90000);

// 1. Sign in, or sign up if the account does not exist yet.
await page.goto(`${BASE}/login`);
await page.fill('#email', env.DEMO_EMAIL);
await page.fill('#password', env.DEMO_PASSWORD);
await page.click('button[type=submit]');
// Wait for either a redirect (signed in) or the error banner (no such account). Dev compiles can be slow.
const signedIn = await Promise.race([
  page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 90000 }).then(() => true),
  page.locator('form p[role="alert"]').first().waitFor({ timeout: 90000 }).then(() => false),
]).catch(() => false);
if (!signedIn) {
  await page.goto(`${BASE}/signup`);
  await page.fill('#fullName', 'Demo Teacher');
  await page.fill('#email', env.DEMO_EMAIL);
  await page.fill('#password', env.DEMO_PASSWORD);
  await page.check('#consent');
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/signup'));
  console.log('demo account created');
} else console.log('demo account exists');

// 2. Make sure it has a school and the sample class.
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
console.log('landed on', new URL(page.url()).pathname);
if (new URL(page.url()).pathname === '/login') throw new Error('session not kept after sign-in');
if (page.url().includes('/onboarding')) {
  await page.waitForSelector('#sname');
  await page.fill('#sname', 'LearnSignal Demo School');
  await page.selectOption('#sstate', 'Lagos');
  await page.click('button[type=submit][form=ob]:visible');
  await page.getByRole('button', { name: /Load the demo class/ }).click();
  await page.waitForURL(/\/classrooms\//);
  console.log('demo school + sample class loaded:', new URL(page.url()).pathname);
} else {
  const hasClass = await page.locator('a[href^="/classrooms/"]').count();
  console.log(hasClass ? 'demo account already has a class' : 'no class yet: use Settings or onboarding');
}
await browser.close();
console.log(`\nNow run once in the Supabase SQL editor:\n  insert into demo_accounts(user_id) select id from auth.users where email = '${env.DEMO_EMAIL}' on conflict do nothing;`);
