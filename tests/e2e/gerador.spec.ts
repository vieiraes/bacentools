import { test, expect, mockSources, gaEvents } from './fixtures';

test.describe('gerador de QR Code Pix', () => {
  test('exemplo do manual: gera o mesmo código oficial, desenha o QR e abre no decodificador', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockSources(page);
    await page.goto('/gerador-pix/');
    await expect(page.getByTestId('gerador-vazio')).toBeVisible();
    await page.getByRole('button', { name: 'Preencher com o exemplo do manual' }).click();
    const oficial = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D';
    await expect(page.getByTestId('gerador-codigo')).toHaveValue(oficial);
    await expect(page.getByRole('img', { name: 'QR Code Pix gerado' }).locator('svg')).toBeVisible();

    await page.getByRole('button', { name: 'Copiar código' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(oficial);
    expect(await gaEvents(page)).toContainEqual({ name: 'generate_brcode', params: { action: 'copiar', key_type: 'aleatoria', item_id: 'sem_valor' } });

    await page.getByRole('link', { name: 'Conferir no decodificador' }).click();
    await expect(page).toHaveURL(/\/decodificador-pix\/\?codigo=/);
    await expect(page.getByTestId('brcode-veredito')).toContainText('QR Code estático válido');
  });

  test('preenchido à mão: normaliza celular e valor, avisa acento; campo inválido mostra o motivo', async ({ page }) => {
    await mockSources(page);
    await page.goto('/gerador-pix/');
    await page.getByTestId('gerador-chave').fill('(61) 91234-5678');
    await page.getByTestId('gerador-nome').fill('João da Padaria');
    await page.getByTestId('gerador-cidade').fill('Brasília');
    await page.getByTestId('gerador-valor').fill('12,5');
    await expect(page.getByTestId('gerador-codigo')).toHaveValue(/0114\+5561912345678.*540512\.50.*5915Joao da Padaria6008BRASILIA/);
    await expect(page.getByTestId('gerador-resultado')).toContainText('Acentos e símbolos foram removidos');

    await page.getByTestId('gerador-txid').fill('pedido 1');
    await expect(page.getByText('Só letras e números, sem espaço, até 25 caracteres')).toBeVisible();
    await expect(page.getByTestId('gerador-vazio')).toBeVisible();
  });
});

test('links oficiais: agrupados, abrem fora do site e só apontam para o BCB', async ({ page }) => {
  await mockSources(page);
  await page.goto('/links-pix/');
  await expect(page.getByRole('heading', { level: 2, name: 'Regulamento e manuais' })).toBeVisible();
  const links = page.locator('main section a[target="_blank"]');
  expect(await links.count()).toBeGreaterThan(20);
  for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
    expect(href).toMatch(/^https:\/\/(www\.bcb\.gov\.br|github\.com\/bacen)\//);
  }
});
