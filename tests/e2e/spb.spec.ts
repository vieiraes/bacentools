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

test.describe('mensagens, domínios e erros do SPB', () => {
  test('explorador: STR0008 com grupo OU e Split, regras; troca para R2 e PAG0108 pelo endereço', async ({ page }) => {
    await mockSources(page);
    await page.goto('/spb/mensagens/');
    const tabela = page.getByRole('table', { name: 'Campos da STR0008' });
    await expect(tabela.locator('[data-tag="CtDebtd"]')).toContainText('OU 1');
    await expect(tabela.locator('[data-tag="Grupo_STR0008_Split"]')).toContainText('[0..1]');
    await expect(tabela.locator('[data-tag="VlrCBS"]')).toBeVisible();
    await expect(tabela.locator('[data-tag="FinlddCli"]')).toContainText('Finalidade da transferência: 101 valores');
    await expect(page.getByText('RSTR0040')).toBeVisible();

    await page.getByTestId('msg-STR0008R2').click();
    await expect(page).toHaveURL(/#STR0008R2$/);
    await expect(page.getByTestId('mensagem')).toContainText('Para: IF creditada');

    await page.goto('/spb/mensagens/#PAG0108');
    await expect(page.getByTestId('mensagem')).toContainText('PAG0108: Requisição de Transferência de recursos entre contas de clientes');
    await expect(page.getByTestId('mensagem')).toContainText('Para: SITRAF (Núclea)');
  });

  test('domínios: busca sem acento acha a finalidade de salário', async ({ page }) => {
    await mockSources(page);
    await page.goto('/spb/dominios/');
    await page.getByTestId('busca-dominios').fill('salario');
    const fin = page.locator('section#FinlddCli');
    await expect(fin.getByRole('row')).not.toHaveCount(1);
    await expect(fin).toContainText('Pagamento de Salários');
    await expect(page.locator('section#TpCt')).toContainText('Nenhum valor');
  });

  test('erros: filtra por grupo e abre a página do código', async ({ page }) => {
    await mockSources(page);
    await page.goto('/spb/erros/');
    await page.getByRole('button', { name: 'EGEN' }).click();
    await page.getByTestId('busca-erros-spb').fill('mal formado');
    await expect(page.getByTestId('total-erros-spb')).toHaveText('1 códigos');
    await page.getByRole('link', { name: 'EGEN0001' }).click();
    await expect(page).toHaveURL('/spb/erros/egen0001/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('EGEN0001: XML Mal Formado');
  });
});

test.describe('TED animada', () => {
  test('efetivada: R1 e R2 juntas, passos em texto e resultado', async ({ page }) => {
    await mockSources(page);
    await page.goto('/spb/ted/');
    await expect(page.getByTestId('play')).toHaveText('Enviar a TED');
    await page.getByTestId('next').click();
    await page.getByTestId('next').click();
    const passos = page.getByTestId('steps').getByRole('listitem');
    await expect(passos).toHaveCount(2);
    await expect(passos.nth(1)).toContainText('STR → IF debitada e IF creditada');
    await expect(passos.nth(1)).toContainText('STR0008R1 + STR0008R2');
    await expect(page.getByTestId('result')).toHaveText('TED efetivada');
  });

  test('recusa por RSTR0034: STR0008E com ESTR0146, dedução marcada e link para o código', async ({ page }) => {
    await mockSources(page);
    await page.goto('/spb/ted/#ted-finalidade-outros');
    await expect(page.getByTestId('ficha-ted')).toContainText('Dedução');
    await page.getByTestId('next').click();
    await page.getByTestId('next').click();
    await expect(page.getByTestId('result')).toHaveText('TED recusada · ESTR0146');
    await page.getByTestId('ficha-ted').getByRole('link', { name: 'ESTR0146' }).click();
    await expect(page).toHaveURL('/spb/erros/estr0146/');
  });

  test('devolução troca os nomes dos bancos', async ({ page }) => {
    await mockSources(page);
    await page.goto('/spb/ted/');
    await page.getByTestId('cenario-devolucao').click();
    await expect(page).toHaveURL(/#devolucao$/);
    await expect(page.getByTestId('play')).toHaveText('Devolver a TED');
    await page.getByTestId('next').click();
    await expect(page.getByTestId('steps')).toContainText('Banco B → STR');
  });
});
