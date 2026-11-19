import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Integration tests against the real Supabase project (see tests/rls/rls.test.ts).
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: { include: ['tests/rls/**/*.test.ts'], environment: 'node', testTimeout: 30000 },
});
