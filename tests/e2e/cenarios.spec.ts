import { test, expect } from './fixtures';

test.describe('Cenários e erros do Pix', () => {
  test('AC06 passo a passo: recebedor rejeita, SPI repassa e a ficha cita a fonte oficial', async ({ page }) => {
    await page.goto('/cenarios-pix/');
    await page.getByTestId('atalho-pacs002-AC06').click();
    for (let i = 0; i < 4; i++) await page.getByTestId('next').click();
    const steps = page.getByTestId('steps').getByRole('listitem');
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(2)).toContainText('PSP recebedor → SPI');
    await expect(steps.nth(2)).toContainText('AC06');
    await expect(steps.nth(3)).toContainText('SPI → PSP pagador');
    await expect(page.getByTestId('result')).toHaveText('Pix não concluído · AC06');
    const ficha = page.getByTestId('ficha');
    await expect(ficha).toContainText('BlockedAccount');
    await expect(ficha).toContainText('PSP recebedor');
    await expect(page.getByTestId('fonte').getByRole('link').first()).toHaveAttribute('href', /^https:\/\/www\.bcb\.gov\.br\//);
    await expect(page.getByTestId('fonte')).toContainText('PACS002.xlsx');
  });

  test('erro do próprio SPI (AM04): o Pix não chega ao recebedor', async ({ page }) => {
    await page.goto('/cenarios-pix/');
    await page.getByTestId('atalho-pacs002-AM04').click();
    await page.getByTestId('next').click();
    await page.getByTestId('next').click();
    await expect(page.getByTestId('steps')).not.toContainText('PSP recebedor');
    await expect(page.getByTestId('result')).toContainText('AM04');
  });

  test('timeout AB03 mostra o aviso de que o vínculo é dedução da documentação', async ({ page }) => {
    await page.goto('/cenarios-pix/#pacs002-AB03'); // link direto
    await expect(page.getByTestId('ficha')).toContainText('AbortedSettlementTimeout');
    await expect(page.getByTestId('ficha').getByRole('alert')).toContainText('dedução');
  });

  test('devolução MD06 termina com "Pix devolvido" e erro do DICT com "o Pix nem começa"', async ({ page }) => {
    await page.goto('/cenarios-pix/#pacs004-MD06');
    await expect(page.getByTestId('ficha')).toContainText('MD06'); // o link direto já foi lido
    await page.getByTestId('play').click();
    await expect(page.getByTestId('result')).toHaveText('Pix devolvido · MD06', { timeout: 20_000 });
    await page.getByTestId('atalho-dict-RateLimited').click();
    await page.getByTestId('next').click();
    await page.getByTestId('next').click();
    await expect(page.getByTestId('result')).toContainText('o Pix nem começa');
  });

  test('catálogo: filtra por palavra e o clique abre o cenário', async ({ page }) => {
    await page.goto('/cenarios-pix/');
    await page.getByTestId('filtro-catalogo').fill('fraude');
    await expect(page.getByTestId('result-count')).not.toHaveText('75 códigos');
    await page.getByRole('row', { name: /FRAD/ }).click();
    await expect(page).toHaveURL(/#pacs002-FRAD$/);
    await expect(page.getByTestId('ficha')).toContainText('FRAD');
  });
});
