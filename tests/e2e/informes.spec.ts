import { test, expect, mockSources, choose } from './fixtures';

test.describe('Informes SPI e STR', () => {
  test('SPI de 2026 por padrão, troca para STR e abre o PDF do BCB', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-11T12:00:00-03:00'));
    await mockSources(page);
    await page.goto('/informes/');
    await expect(page.getByTestId('result-count')).toHaveText('6 informes do SPI em 2026');
    await expect(page.getByTestId('informes').getByRole('listitem').first()).toContainText('Informe SPI-018-2026');
    const pdf = page.getByRole('link', { name: 'Abrir PDF do Informe SPI-018-2026' });
    await expect(pdf).toHaveAttribute('href', /^https:\/\/www\.bcb\.gov\.br\/.+InformeSPI-018-2026\.pdf$/);

    await page.getByRole('button', { name: 'STR' }).click();
    await expect(page.getByTestId('result-count')).toHaveText('6 informes do STR em 2026');

    await choose(page, 'Ano', '2025');
    await expect(page.getByText('Nenhum informe encontrado.')).toBeVisible();
  });

  test('BCB fora do ar: erro claro com opção de tentar de novo', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-11T12:00:00-03:00'));
    await mockSources(page, { bcb: 'down' });
    await page.goto('/informes/');
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os informes do Banco Central' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });
});
