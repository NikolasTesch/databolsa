import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for DataBolsa E2E tests.
 *
 * webServer sobe a API e o Next.js antes dos testes; em CI, as apps já devem
 * estar compiladas (dist/ e .next/) antes desta etapa.
 *
 * USE_QUOTE_STUB=true ativa o StubQuoteAdapter no backend, evitando chamadas
 * a APIs externas durante os testes.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Em CI com output:standalone, o servidor é node .next/standalone/server.js
    // Em dev (reuseExistingServer), pode usar `pnpm --filter web start` normalmente.
    command: process.env.CI
      ? 'node apps/web/.next/standalone/server.js'
      : 'pnpm --filter web start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://databolsa:databolsa@localhost:5432/databolsa_test',
      JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-jwt-secret-32-chars-minimum',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'e2e-test-jwt-refresh-secret-32-chars',
      USE_QUOTE_STUB: 'true',
      API_URL: 'http://localhost:3000',
      PORT: '3000',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
    },
  },
});
