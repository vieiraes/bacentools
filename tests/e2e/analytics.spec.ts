import type { Page } from '@playwright/test';
import { test, expect, mockSources, gaEvents } from './fixtures';

/** Pedidos do gtag.js que a página fez (a rede do Google é simulada na fixture). */
function pedidosGtag(page: Page) {
  const pedidos: string[] = [];
  page.on('request', (r) => { if (r.url().startsWith('https://www.googletagmanager.com/')) pedidos.push(r.url()); });
  return pedidos;
}

const paginasVistas = async (page: Page) => (await gaEvents(page)).filter((e) => e.name === 'page_view').map((e) => e.params);

test.describe('Analytics e LGPD', () => {
  test('@consentimento antes de escolher e depois de recusar, nada do Google é carregado', async ({ page }) => {
    const pedidos = pedidosGtag(page);
    await mockSources(page);
    await page.goto('/');
    await expect(page.getByTestId('consent')).toBeVisible();
    expect(await page.evaluate(() => 'gtag' in window || 'dataLayer' in window)).toBe(false);
    await page.getByTestId('consent-deny').click();
    await expect(page.getByTestId('consent')).toBeHidden();
    await page.reload();
    await page.locator('html[data-hydrated="true"]').waitFor();
    await expect(page.getByTestId('consent')).toBeHidden();
    await page.goto('/bancos/');
    expect(await page.evaluate(() => 'gtag' in window)).toBe(false);
    expect(pedidos).toEqual([]);
  });

  test('@consentimento quem respondeu o aviso antigo é perguntado de novo', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('bt_consent_v1', 'granted'));
    await mockSources(page);
    await page.goto('/');
    await expect(page.getByTestId('consent')).toBeVisible();
  });

  test('@consentimento aceitar carrega o GA, conta a página e registra a escolha', async ({ page }) => {
    const pedidos = pedidosGtag(page);
    await mockSources(page);
    await page.goto('/');
    await page.getByTestId('consent-accept').click();
    await expect(page.getByTestId('consent')).toBeHidden();
    expect(await paginasVistas(page)).toEqual([expect.objectContaining({ page_path: '/', page_location: 'http://localhost:4180/' })]);
    expect(await gaEvents(page)).toContainEqual({ name: 'consent_choice', params: { choice: 'granted' } });
    expect(await page.evaluate(() => localStorage.getItem('bt-aviso-cookies'))).toBe('2:aceito');
    await expect.poll(() => pedidos).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-69FZL5N4D5']);
  });

  test('a página vai sem a query, menos os utm_*: o código Pix aberto no decodificador não sai do navegador', async ({ page }) => {
    await mockSources(page);
    await page.goto('/decodificador-pix/?utm_source=linkedin&codigo=00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano%20de%20Tal6008BRASILIA62070503***63041D3D');
    expect(await paginasVistas(page)).toEqual([expect.objectContaining({ page_path: '/decodificador-pix/', page_location: 'http://localhost:4180/decodificador-pix/?utm_source=linkedin' })]);
    expect(JSON.stringify(await page.evaluate(() => (window as unknown as { dataLayer: IArguments[] }).dataLayer.map((a) => Array.from(a))))).not.toContain('br.gov.bcb.pix');
  });

  test('navegar pelo menu conta cada página uma vez', async ({ page }) => {
    await mockSources(page);
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Ferramentas do Pix' }).getByRole('link', { name: /Bancos/ }).click();
    await expect(page).toHaveURL(/\/bancos\/$/);
    await expect.poll(async () => (await paginasVistas(page)).map((p) => p.page_path)).toEqual(['/', '/bancos/']);
  });

  test('o painel /admin/ nunca é medido', async ({ page }) => {
    const pedidos = pedidosGtag(page);
    await mockSources(page);
    await page.goto('/admin/');
    await expect(page.getByTestId('admin-login')).toBeVisible();
    expect(await page.evaluate(() => 'gtag' in window)).toBe(false);
    expect(pedidos).toEqual([]);
  });

  test('@consentimento preferências de cookies no rodapé: mostra a escolha atual e recusar desliga a medição', async ({ page }) => {
    await mockSources(page);
    await page.goto('/');
    await page.getByTestId('consent-accept').click();
    await expect(page.getByTestId('consent')).toBeHidden();
    await page.getByRole('contentinfo').getByTestId('preferencias-cookies').click();
    await expect(page.getByTestId('consent-atual')).toHaveText('Sua escolha atual: contagem de visitas permitida.');
    await page.getByTestId('consent-deny').click();
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>)['ga-disable-G-69FZL5N4D5'])).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('bt-aviso-cookies'))).toBe('2:recusado');
    await page.reload();
    await page.locator('html[data-hydrated="true"]').waitFor();
    expect(await page.evaluate(() => 'gtag' in window)).toBe(false);
  });

  test('eventos de uso: busca em bancos, cenário de erro escolhido e ação no simulador', async ({ page }) => {
    await mockSources(page);
    await page.goto('/bancos/');
    await page.getByTestId('search').fill('caixa');
    await expect.poll(async () => (await gaEvents(page)).find((e) => e.name === 'search')?.params, { timeout: 5000 })
      .toEqual({ search_term: 'caixa', area: 'bancos' });

    await page.goto('/cenarios-pix/');
    await page.getByTestId('atalho-pacs002-AC06').click();
    expect(await gaEvents(page)).toContainEqual({ name: 'select_content', params: { content_type: 'erro_pix', item_id: 'pacs002-AC06' } });

    await page.goto('/simulador-dict/');
    await page.getByTestId('consult-not-found').click();
    expect(await gaEvents(page)).toContainEqual({ name: 'simulator_action', params: { action: 'consulta_404', key_type: 'CPF' } });
  });
});

test.describe('SEO', () => {
  test('cada página tem canonical, og:url próprio e imagem de prévia', async ({ page, request }) => {
    for (const caminho of ['/', '/bancos/', '/erros-pix/ac06/', '/spb/erros/estr0001/', '/privacidade/']) {
      await page.goto(caminho);
      const url = `https://bacentools.web.app${caminho}`;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', url);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', url);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://bacentools.web.app/og-bacentools.png');
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    }
    expect((await request.get('/og-bacentools.png')).headers()['content-type']).toBe('image/png');
    expect(await (await request.get('/manifest.webmanifest')).json()).toMatchObject({ name: 'BacenTools', theme_color: '#0b4f9c' });
  });

  test('ferramentas e página inicial têm dados estruturados', async ({ page }) => {
    await page.goto('/');
    const tipos = async () => page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((e) => JSON.parse(e.textContent ?? '{}')['@type']));
    expect(await tipos()).toContain('WebSite');
    await page.goto('/gerador-pix/');
    expect(await tipos()).toContain('WebApplication');
  });
});
