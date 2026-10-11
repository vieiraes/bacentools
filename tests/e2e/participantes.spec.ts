import { test, expect, mockSources, choose } from './fixtures';
import pix from '../fixtures/pix-participants.json' with { type: 'json' };

test('Participantes do Pix: filtros por modalidade e participação somam com a busca', async ({ page }) => {
  await mockSources(page);
  await page.goto('/participantes-pix/');
  await expect(page.getByTestId('result-count')).toHaveText(`${pix.length} participantes`);

  const iniciadores = pix.filter((p) => p.modalidade_participacao === 'Iniciador').length;
  await choose(page, 'Modalidade', 'Iniciador');
  await expect(page.getByTestId('result-count')).toHaveText(`${iniciadores} participantes`);

  await choose(page, 'Modalidade', 'Todas');
  const diretas = pix.filter((p) => p.tipo_participacao === 'Direta').length;
  await choose(page, 'Participação', /^Direta$/);
  await expect(page.getByTestId('result-count')).toHaveText(`${diretas} participantes`);
});
