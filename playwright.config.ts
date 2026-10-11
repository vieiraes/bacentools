import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['html', { open: 'never' }], ['github'], ['list']] : [['html', { open: 'never' }], ['list']],
  use: { baseURL: 'http://localhost:4180', trace: 'retain-on-failure', screenshot: 'only-on-failure', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  // Testa o build estático de produção (o mesmo que vai para o Firebase).
  webServer: { command: 'npm run build && node scripts/serve-out.mjs', url: 'http://localhost:4180', reuseExistingServer: !CI, timeout: 240_000 },
});
