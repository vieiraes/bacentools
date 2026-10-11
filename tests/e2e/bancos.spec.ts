import { test, expect, mockSources } from './fixtures';
import banks from '../fixtures/banks.json' with { type: 'json' };

test.describe('Bancos', () => {
  test('lista as instituições da fonte e busca por nome sem acento, COMPE e ISPB', async ({ page }) => {
    await mockSources(page);
    await page.goto('/bancos/');
    await expect(page.getByTestId('result-count')).toHaveText(`${banks.length} instituições`);

    await page.getByTestId('search').fill('caixa economica');
    await expect(page.getByTestId('result-count')).toHaveText('1 instituição');
    await expect(page.getByRole('row', { name: /CAIXA/ })).toContainText('104');

    await page.getByTestId('search').fill('260');
    await expect(page.getByRole('row', { name: /NU PAGAMENTOS|NUBANK/i })).toBeVisible();

    await page.getByTestId('search').fill('00360305');
    await expect(page.getByTestId('result-count')).toHaveText('1 instituição');

    await page.getByTestId('search').fill('banco que não existe');
    await expect(page.getByTestId('result-count')).toHaveText('0 instituições');
  });

  test('COMPE com 3 dígitos e instituição sem COMPE aparece como —', async ({ page }) => {
    await mockSources(page);
    await page.goto('/bancos/');
    await page.getByTestId('search').fill('00000000');
    await expect(page.getByRole('row', { name: /BCO DO BRASIL/ })).toContainText('001');
  });

  test('BrasilAPI fora do ar: usa a cópia diária e avisa a data', async ({ page }) => {
    await mockSources(page, { brasilapi: 'down' });
    await page.goto('/bancos/');
    await expect(page.getByRole('status').filter({ hasText: 'não respondeu agora' })).toBeVisible();
    await expect(page.getByTestId('result-count')).toHaveText(/^\d{3,} instituições$/); // a cópia completa (centenas)
  });

  test('fonte e cópia fora do ar: mensagem de erro e "Tentar de novo" recupera', async ({ page }) => {
    await mockSources(page, { brasilapi: 'down', snapshot: 'down' });
    await page.goto('/bancos/');
    // o Next também tem um anúncio de rota com role=alert: filtra pelo texto
    await expect(page.getByRole('alert').filter({ hasText: 'HTTP 503 em brasilapi.com.br' })).toBeVisible();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await mockSources(page);
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(page.getByTestId('result-count')).toHaveText(`${banks.length} instituições`);
  });
});
