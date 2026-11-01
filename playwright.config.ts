import { defineConfig, devices } from '@playwright/test'

// Porta do preview dos testes: E2E_PORT (padrão 4174) permite várias sessões em paralelo.
const PORT = Number(process.env.E2E_PORT ?? 4174)

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  // O build já embute os mocks (.env: VITE_ENABLE_MOCKS=true); o preview serve o dist.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // desliga o carrossel automático e as animações
    reducedMotion: 'reduce',
  },

  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
})
