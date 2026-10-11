import { test as base, expect, type Page } from '@playwright/test';
import banks from '../fixtures/banks.json' with { type: 'json' };
import pix from '../fixtures/pix-participants.json' with { type: 'json' };
import informes from '../fixtures/informes-2026.json' with { type: 'json' };

/** Rede simulada: as fontes externas respondem com amostras reais gravadas (o teste não depende da internet). */
export async function mockSources(page: Page, opts: { brasilapi?: 'ok' | 'down'; bcb?: 'ok' | 'down'; snapshot?: 'ok' | 'down' } = {}) {
  const { brasilapi = 'ok', bcb = 'ok', snapshot = 'ok' } = opts;
  await page.route('https://brasilapi.com.br/api/banks/v1', (r) => (brasilapi === 'ok' ? r.fulfill({ json: banks }) : r.fulfill({ status: 503, body: 'indisponível' })));
  await page.route('https://brasilapi.com.br/api/pix/v1/participants', (r) => (brasilapi === 'ok' ? r.fulfill({ json: pix }) : r.abort('failed')));
  await page.route('https://www.bcb.gov.br/api/servico/sitebcb/cronologicodados?**', (r) => {
    if (bcb === 'down') return r.fulfill({ status: 500, body: 'erro' });
    const url = new URL(r.request().url());
    const tipo = url.searchParams.get('guidLista')?.startsWith('2ce7') ? 'SPI' : 'STR';
    return r.fulfill({ json: url.searchParams.get('ano') === '2026' ? informes[tipo] : { conteudo: [] } });
  });
  if (snapshot === 'down') await page.route('**/data/*.json', (r) => r.fulfill({ status: 404 }));
  // logos dos bancos (CDN): imagem vazia, sem rede
  await page.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' }));
}

/** Toda página: rede simulada e falha automática se aparecer erro no console. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      // falhas de rede provocadas de propósito pelos testes de queda não contam
      if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED/.test(m.text())) errors.push(m.text());
    });
    await use(errors);
    expect(errors, 'erros no console da página').toEqual([]);
  }, { auto: true }],
});
export { expect };

/** Escolhe uma opção num select do MUI (combobox acessível, não <select> nativo). */
export async function choose(page: Page, label: string | RegExp, option: string | RegExp) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option }).click();
}
