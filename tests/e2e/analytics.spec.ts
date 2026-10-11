import { test, expect, mockSources, gaEvents } from './fixtures';

test.describe('Analytics e LGPD', () => {
  test('@consentimento banner na primeira visita: recusar mantém o GA sem cookies e não volta a aparecer', async ({ page }) => {
    await mockSources(page);
    await page.goto('/');
    await expect(page.getByTestId('consent')).toBeVisible();
    // antes de escolher, o consentimento padrão é "negado"
    const padrao = await page.evaluate(() => Array.from((window as unknown as { dataLayer: IArguments[] }).dataLayer[0]));
    expect(padrao).toEqual(['consent', 'default', expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied' })]);
    await page.getByTestId('consent-deny').click();
    await expect(page.getByTestId('consent')).toBeHidden();
    await page.reload();
    await page.locator('html[data-hydrated="true"]').waitFor();
    await expect(page.getByTestId('consent')).toBeHidden();
    expect(await gaEvents(page)).toEqual([]); // nada além do page_view automático do GA
  });

  test('@consentimento aceitar libera o analytics e registra a escolha', async ({ page }) => {
    await mockSources(page);
    await page.goto('/');
    await page.getByTestId('consent-accept').click();
    const eventos = await gaEvents(page);
    expect(eventos).toContainEqual({ name: 'consent_choice', params: { choice: 'granted' } });
    expect(await page.evaluate(() => localStorage.getItem('bt_consent_v1'))).toBe('granted');
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
