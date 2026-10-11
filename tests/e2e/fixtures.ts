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

/** Toda página: espera a hidratação do React depois de cada navegação e falha se aparecer erro no console. */
export const test = base.extend<{ consoleErrors: string[] }>({
  page: async ({ page }, use, info) => {
    // Google Analytics nunca sai para a rede nos testes; os eventos ficam no window.dataLayer para conferir
    await page.route('https://www.googletagmanager.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    // Firestore também nunca é tocado: um envio de formulário nos testes não grava lead de verdade
    await page.route('https://firestore.googleapis.com/**', (r) => r.fulfill({ json: { commitTime: '2026-10-11T12:00:00Z', writeResults: [{ updateTime: '2026-10-11T12:00:00Z' }] } }));
    // o banner de cookies já vem respondido, exceto no teste do próprio banner (tag @consentimento)
    if (!info.title.includes('@consentimento')) await page.addInitScript(() => localStorage.setItem('bt_consent_v1', 'denied'));
    const goto = page.goto.bind(page);
    page.goto = async (url, opts) => {
      const res = await goto(url, opts);
      // clicar antes da hidratação perde o clique (o CI é mais lento que a máquina local)
      await page.locator('html[data-hydrated="true"]').waitFor({ timeout: 15_000 });
      return res;
    };
    await use(page);
  },
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

/** Eventos que a página mandou para o GA4 (via gtag → dataLayer). */
export async function gaEvents(page: Page): Promise<{ name: string; params: Record<string, unknown> }[]> {
  return page.evaluate(() =>
    ((window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? [])
      .map((a) => Array.from(a))
      .filter((a) => a[0] === 'event')
      .map((a) => ({ name: a[1] as string, params: (a[2] ?? {}) as Record<string, unknown> })),
  );
}

/** Gravações enviadas ao Firestore (corpo do commit), para conferir o que o formulário mandou. */
export async function capturarFirestore(page: Page, status = 200) {
  const commits: Record<string, unknown>[] = [];
  await page.route('https://firestore.googleapis.com/**', async (r) => {
    commits.push(r.request().postDataJSON() ?? {});
    if (status !== 200) return r.fulfill({ status, json: { error: { code: status, message: 'falhou', status: 'UNAVAILABLE' } } });
    return r.fulfill({ json: { commitTime: '2026-10-11T12:00:00Z', writeResults: [{ updateTime: '2026-10-11T12:00:00Z' }] } });
  });
  return commits;
}
