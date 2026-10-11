import { test, expect, mockSources, gaEvents } from './fixtures';

const verificacao = (page: import('@playwright/test').Page, id: string) => page.getByTestId('brcode-verificacoes').locator(`[data-id="${id}"]`);

test.describe('decodificador de QR Code Pix', () => {
  test('exemplo oficial do manual: válido, campos e estrutura', async ({ page }) => {
    await mockSources(page);
    await page.goto('/decodificador-pix/');
    await page.getByRole('button', { name: 'Exemplo estático do manual' }).click();
    await expect(page.getByTestId('brcode-veredito')).toContainText('QR Code estático válido');
    await expect(page.getByText('123e4567-e12b-12d1-a456-426655440000 (chave aleatória)')).toBeVisible();
    await expect(verificacao(page, 'crc')).toHaveAttribute('data-ok', 'true');
    await expect(page.getByRole('table', { name: 'Estrutura do BR Code' }).getByRole('cell', { name: 'br.gov.bcb.pix' })).toBeVisible();
    expect(await gaEvents(page)).toContainEqual({ name: 'select_content', params: { content_type: 'exemplo_brcode', item_id: 'estatico' } });
  });

  test('código colado com CRC errado: aponta o CRC certo e oferece a cópia corrigida', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockSources(page);
    await page.goto('/decodificador-pix/');
    const errado = '00020101021226700014br.gov.bcb.pix2548pix.example.com/8b3da2f39a4140d1a91abd93113bd4415204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63040000';
    await page.getByTestId('brcode-input').fill(errado);
    await expect(page.getByTestId('brcode-veredito')).toContainText('1 problema(s)');
    await expect(verificacao(page, 'crc')).toContainText('CRC informado 0000, mas o calculado é 64E4');
    await page.getByRole('button', { name: 'Copiar com o CRC corrigido' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(errado.slice(0, -4) + '64E4');
    await expect.poll(async () => (await gaEvents(page)).find((e) => e.name === 'decode')?.params, { timeout: 5000 })
      .toEqual({ area: 'brcode', item_id: 'dinamico', result: 'invalido' });
  });
});

test.describe('decodificador de EndToEndId e UUID', () => {
  test('EndToEndId: instituição pelo ISPB, horário em UTC e em Brasília', async ({ page }) => {
    await mockSources(page);
    await page.goto('/identificadores-pix/');
    await page.getByTestId('id-input').fill('E24313102202610111430abcDEF12345');
    await expect(page.getByTestId('id-resultado')).toContainText('Formato válido');
    await expect(page.getByTestId('id-instituicao')).toHaveText('· 99PAY IP S.A.');
    await expect(page.getByTestId('id-resultado')).toContainText('2026-10-11 14:30');
    await expect(page.getByTestId('id-resultado')).toContainText('11/10/2026, 11:30:00');
  });

  test('erros de formato aparecem um a um; UUID v7 mostra a data', async ({ page }) => {
    await mockSources(page);
    await page.goto('/identificadores-pix/');
    await page.getByTestId('id-input').fill('E24313102202613011430abc');
    await expect(page.getByTestId('id-resultado')).toContainText('Tem 24 caracteres; o formato exige 32');
    await expect(page.getByTestId('id-resultado')).toContainText('Data "202613011430" não existe');
    await page.getByRole('button', { name: 'UUID v7' }).click();
    await expect(page.getByTestId('id-resultado')).toContainText('v7 (ordenado pelo tempo)');
  });
});
