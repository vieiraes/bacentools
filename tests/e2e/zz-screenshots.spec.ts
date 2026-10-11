import { test } from './fixtures';
import { SimulatorPage } from './pages/SimulatorPage';

// Gera as imagens do README (só com SCREENSHOT=1, no desktop).
test('imagens do README', async ({ page }, info) => {
  test.skip(!process.env.SCREENSHOT || info.project.name !== 'desktop-chromium');
  await page.setViewportSize({ width: 1280, height: 820 });
  // imagens com dados reais da BrasilAPI (logos de verdade); o resto da suíte usa a rede simulada
  await page.goto('/');
  await page.screenshot({ path: 'docs/img/inicio.png' });
  await page.goto('/bancos/');
  await page.getByRole('grid').waitFor();
  await page.getByTestId('search').fill('pagamentos');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/img/bancos.png' });
  await page.clock.install({ time: new Date('2026-10-11T12:00:00-03:00') });
  const sim = new SimulatorPage(page);
  await sim.open();
  await page.clock.pauseAt(new Date('2026-10-11T12:00:05-03:00'));
  await sim.scenario({ keyType: 'CPF', category: 'H' });
  await sim.consultNotFound(4);
  await sim.consultFound();
  await sim.pay();
  await sim.consultNotFound(2);
  await page.clock.runFor(600);
  await page.getByRole('region', { name: 'Baldes de fichas' }).scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(700); // fim da animação das barras (tempo real do CSS)
  await page.screenshot({ path: 'docs/img/simulador.png', fullPage: true });
});
