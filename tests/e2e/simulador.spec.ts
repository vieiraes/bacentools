import { test, expect } from './fixtures';
import { SimulatorPage } from './pages/SimulatorPage';

const T0 = new Date('2026-10-11T12:00:00-03:00');

// Relógio da página congelado: a reposição só anda quando o teste manda (page.clock).
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.clock.pauseAt(new Date(T0.getTime() + 1_000));
});

test.describe('simulador do DICT: regra de contagem', () => {
  test('200 tira 1 do usuário e 1 do participante; o outro balde do usuário não muda', async ({ page }) => {
    const sim = new SimulatorPage(page);
    await sim.open();
    await sim.scenario({ user: 'PF', keyType: 'CPF', category: 'F' });
    await sim.consultFound();
    await expect(sim.lastStatus()).toHaveText('200');
    await expect(sim.tokens('user-v2')).toHaveText('99');
    await expect(sim.tokens('participant')).toHaveText('499');
    await expect(sim.tokens('user-v1')).toHaveText('100');
  });

  test('404 tira 20 do usuário e 3 do participante, e não libera Pix', async ({ page }) => {
    const sim = new SimulatorPage(page);
    await sim.open();
    await sim.scenario({ keyType: 'EMAIL' });
    await sim.consultNotFound();
    await expect(sim.lastStatus()).toHaveText('404');
    await expect(sim.tokens('user-v1')).toHaveText('80');
    await expect(sim.tokens('participant')).toHaveText('497');
    await expect(sim.payBtn).toBeDisabled();
  });

  test('Pix devolve as fichas uma única vez; PJ tem balde de 1.000 e devolve 2', async ({ page }) => {
    const sim = new SimulatorPage(page);
    await sim.open();
    await sim.scenario({ user: 'PJ', keyType: 'CNPJ', category: 'A' });
    await expect(sim.tokens('user-v2')).toHaveText('1.000');
    await sim.consultNotFound();
    await sim.consultFound();
    await sim.pay();
    await expect(sim.lastStatus()).toHaveText('PAGO');
    await expect(sim.tokens('user-v2')).toHaveText('981');
    await sim.pay();
    await expect(sim.lastStatus()).toHaveText('RECUSADO');
    await expect(sim.tokens('user-v2')).toHaveText('981');
  });

  test('varredura: 5 consultas 404 esgotam o PF; a 6ª recebe 429 e não cobra', async ({ page }) => {
    const sim = new SimulatorPage(page);
    await sim.open();
    await sim.scenario({ keyType: 'PHONE', category: 'A' });
    await sim.consultNotFound(5);
    const before = await sim.tokenCount('participant');
    await sim.consultNotFound();
    await expect(sim.lastStatus()).toHaveText('429');
    await expect(sim.lastEntry()).toContainText('Nada foi cobrado');
    expect(await sim.tokenCount('participant')).toBe(before);
    expect(await sim.statuses()).toEqual(['429', '404', '404', '404', '404', '404']);
  });

  test('reposição: 2 fichas por minuto até o teto, e o 429 some depois de 30 s', async ({ page }) => {
    const sim = new SimulatorPage(page);
    await sim.open();
    await sim.scenario({ keyType: 'CPF', category: 'A' });
    await sim.consultNotFound(5);
    await sim.consultFound();
    await expect(sim.lastStatus()).toHaveText('429');
    // a tela atualiza a cada 250 ms: 30,25 s garante um tique depois dos 30 s exatos
    await page.clock.runFor(30_250);
    await expect(sim.tokens('user-v2')).toHaveText('1');
    await sim.consultFound();
    await expect(sim.lastStatus()).toHaveText('200');
    await page.clock.fastForward(10 * 60_000);
    await expect(sim.tokens('user-v2')).toHaveText('20');
    await page.clock.fastForward(60 * 60_000);
    await expect(sim.tokens('user-v2')).toHaveText('100');
  });
});
