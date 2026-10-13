import { test, expect, mockSources } from './fixtures';

test.describe('área SPB e TED', () => {
  test('visão geral: versão do catálogo, STR0008 e PAG0108, e horário da TED calculado em Brasília', async ({ page }) => {
    await mockSources(page);
    await page.clock.setFixedTime(new Date('2026-10-13T10:00:00-03:00')); // terça, 10h em Brasília
    await page.goto('/spb/');
    await expect(page.getByTestId('spb-versao')).toContainText('Catálogo de Serviços do SFN 5.13');
    await expect(page.getByTestId('spb-versao')).toContainText('iguais às da versão 5.12');
    await expect(page.getByRole('main')).toContainText('STR0008');
    await expect(page.getByRole('main')).toContainText('PAG0108');
    await expect(page.getByTestId('ted-agora')).toContainText('TED no STR agora: aberta');
    await expect(page.getByTestId('ted-agora')).toContainText('aberto até 17:30');
    await expect(page.getByRole('table', { name: 'Grade de horários da TED no STR' }).getByRole('row', { name: /STR02/ })).toContainText('06:30 às 17:30');
  });

  test('fora do horário: sábado mostra fechada', async ({ page }) => {
    await mockSources(page);
    await page.clock.setFixedTime(new Date('2026-10-17T10:00:00-03:00'));
    await page.goto('/spb/');
    await expect(page.getByTestId('ted-agora')).toContainText('fechada');
    await expect(page.getByTestId('ted-agora')).toContainText('não funciona em sábado');
  });
});
