import { test, expect, mockSources } from './fixtures';

test.describe('navegação e SEO', () => {
  test('a página inicial lista as 4 ferramentas e cada cartão leva à página certa', async ({ page }) => {
    await mockSources(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('BacenTools');
    const cards = page.getByRole('navigation', { name: 'Ferramentas' }).last().getByRole('link');
    await expect(cards).toHaveCount(4);
    for (const [name, path, h1] of [
      [/^Bancos/, '/bancos/', 'Bancos'],
      [/^Participantes do Pix/, '/participantes-pix/', 'Participantes do Pix'],
      [/^Informes SPI e STR/, '/informes/', 'Informes SPI e STR'],
      [/^Simulador de fichas/, '/simulador-dict/', 'Simulador de fichas do DICT'],
    ] as const) {
      await page.goto('/');
      await cards.filter({ hasText: name }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    }
  });

  test('cada página tem título próprio para buscadores', async ({ page }) => {
    await mockSources(page);
    for (const [path, title] of [['/bancos/', /Bancos por ISPB e código COMPE · BacenTools/], ['/simulador-dict/', /Simulador de fichas do DICT/]] as const) {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    }
  });

  test('links antigos (/banks) continuam funcionando com redirecionamento 301', async ({ page }) => {
    await mockSources(page);
    const res = await page.request.get('/banks', { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers().location).toBe('/bancos/');
  });

  test('sitemap.xml lista as ferramentas', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const p of ['/bancos/', '/participantes-pix/', '/informes/', '/simulador-dict/']) expect(xml).toContain(`https://bacentools.web.app${p}`);
  });
});
