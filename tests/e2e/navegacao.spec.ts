import { test, expect, mockSources } from './fixtures';

test.describe('navegação e SEO', () => {
  test('a página inicial lista todas as ferramentas e cada cartão leva à página certa', async ({ page }) => {
    await mockSources(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('BacenTools');
    const cards = page.getByRole('navigation', { name: 'Ferramentas' }).last().getByRole('link');
    await expect(cards).toHaveCount(7);
    for (const [name, path, h1] of [
      [/^Bancos/, '/bancos/', 'Bancos'],
      [/^Participantes do Pix/, '/participantes-pix/', 'Participantes do Pix'],
      [/^Informes SPI e STR/, '/informes/', 'Informes SPI e STR'],
      [/^Decodificador de QR Code/, '/decodificador-pix/', 'Decodificador de QR Code Pix'],
      [/^Decodificador de EndToEndId/, '/identificadores-pix/', 'Decodificador de EndToEndId e UUID'],
      [/^Simulador de fichas/, '/simulador-dict/', 'Simulador de fichas do DICT'],
    ] as const) {
      await page.goto('/');
      await cards.filter({ hasText: name }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    }
  });

  test('menu "Ferramentas" da barra do topo leva aos decodificadores (gaveta no celular)', async ({ page, isMobile }) => {
    await mockSources(page);
    await page.goto('/');
    for (const [item, path] of [['Decodificador Pix (QR Code)', '/decodificador-pix/'], ['Decodificador UUID v7 e EndToEndId', '/identificadores-pix/']] as const) {
      if (isMobile) {
        await page.getByRole('button', { name: 'Abrir menu' }).click();
        await page.getByRole('link', { name: item }).click();
      } else {
        await page.getByRole('banner').getByRole('button', { name: 'Ferramentas' }).click();
        await page.getByRole('menuitem', { name: item }).click();
      }
      await expect(page).toHaveURL(path);
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

test.describe('SEO: páginas por código de erro', () => {
  test('a página do AC06 tem título, resposta, fonte oficial, FAQ estruturado e leva à animação', async ({ page }) => {
    await page.goto('/erros-pix/ac06/');
    await expect(page).toHaveTitle(/AC06 no Pix: conta transacional do usuário recebedor encontra-se bloqueada/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AC06 no Pix');
    await expect(page.getByRole('link', { name: /Catálogo de Mensagens do SPI/ })).toHaveAttribute('href', /bcb\.gov\.br/);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('"FAQPage"'))).toBe(true);
    await page.getByRole('link', { name: 'Ver a animação deste erro' }).click();
    await expect(page).toHaveURL(/\/cenarios-pix\/#pacs002-AC06$/);
  });

  test('índice lista os 75 códigos com links e o sitemap inclui as páginas', async ({ page, request }) => {
    await page.goto('/erros-pix/');
    await expect(page.locator('a[href^="/erros-pix/"]')).toHaveCount(75);
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('https://bacentools.web.app/erros-pix/devolucao-md06/');
    expect(xml).toContain('https://bacentools.web.app/erros-pix/dict-429-rate-limited/');
  });
});
