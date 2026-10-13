import AxeBuilder from '@axe-core/playwright';
import { test, expect, mockSources } from './fixtures';

const PAGES = ['/', '/bancos/', '/participantes-pix/', '/informes/', '/cenarios-pix/', '/simulador-dict/', '/erros-pix/', '/erros-pix/ac06/', '/privacidade/', '/sobre/', '/admin/', '/decodificador-pix/', '/identificadores-pix/', '/gerador-pix/', '/links-pix/', '/spb/', '/spb/links/', '/spb/mensagens/', '/spb/dominios/', '/spb/erros/', '/spb/erros/estr0001/', '/spb/ted/'];

test.describe('qualidade em todas as páginas', () => {
  for (const path of PAGES) {
    test(`${path}: acessível (WCAG 2.2 AA) e sem rolagem lateral`, async ({ page }) => {
      await mockSources(page);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForLoadState('networkidle');
      // a tabela (DataGrid) carrega só no navegador: espera ela aparecer antes de analisar
      if (path === '/bancos/' || path === '/participantes-pix/' || path === '/cenarios-pix/') await expect(page.getByRole('grid')).toBeVisible();
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
