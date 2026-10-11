import { test, expect, mockSources, gaEvents, capturarFirestore, choose } from './fixtures';

test.describe('captação de leads', () => {
  test('newsletter na página inicial: valida, grava no Firestore e registra a conversão sem dado pessoal no GA', async ({ page }) => {
    await mockSources(page);
    const commits = await capturarFirestore(page);
    await page.goto('/');
    const form = page.getByTestId('lead-form-newsletter');
    await form.getByRole('button', { name: 'Quero receber' }).click();
    await expect(form.getByText('Informe um e-mail válido')).toBeVisible();
    await expect(form.getByText('Escolha o seu perfil')).toBeVisible();
    await expect(form.getByText('Marque a caixa para concordar')).toBeVisible();
    expect(commits).toHaveLength(0);

    await form.getByRole('textbox', { name: 'E-mail' }).fill('Ana@Exemplo.com');
    await choose(page, 'Você é', 'QA / Testes');
    await form.getByRole('checkbox').check();
    await form.getByRole('button', { name: 'Quero receber' }).click();
    await expect(page.getByTestId('lead-ok-newsletter')).toBeVisible();

    expect(commits).toHaveLength(1);
    const campos = JSON.stringify(commits[0]);
    expect(campos).toContain('"ana@exemplo.com"');
    expect(campos).toContain('"qa"');
    expect(campos).toContain('REQUEST_TIME'); // data carimbada pelo servidor (as regras exigem)
    const ev = (await gaEvents(page)).find((e) => e.name === 'generate_lead');
    expect(ev?.params).toEqual({ lead_type: 'newsletter', perfil: 'qa', area: 'inicio' });
    expect(JSON.stringify(ev)).not.toContain('@');
  });

  test('contato na página Sobre: robô que preenche a isca não grava nada', async ({ page }) => {
    await mockSources(page);
    const commits = await capturarFirestore(page);
    await page.goto('/sobre/');
    const form = page.getByTestId('lead-form-contato');
    await form.getByRole('textbox', { name: 'Nome' }).fill('Robô');
    await form.getByRole('textbox', { name: 'E-mail' }).fill('robo@spam.com');
    await form.getByRole('textbox', { name: 'Como posso ajudar?' }).fill('Compre seguidores agora mesmo');
    await form.getByRole('checkbox').check();
    await page.locator('#contato-site').fill('http://spam', { force: true });
    await form.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByTestId('lead-ok-contato')).toBeVisible();
    expect(commits).toHaveLength(0);
  });

  test('contato: falha do servidor mostra o erro e permite tentar de novo', async ({ page }) => {
    await mockSources(page);
    await capturarFirestore(page, 503);
    await page.goto('/sobre/');
    const form = page.getByTestId('lead-form-contato');
    await form.getByRole('textbox', { name: 'Nome' }).fill('Bia Souza');
    await form.getByRole('textbox', { name: 'E-mail' }).fill('bia@banco.com');
    await form.getByRole('textbox', { name: 'Como posso ajudar?' }).fill('Quero ajuda para homologar o Pix.');
    await form.getByRole('checkbox').check();
    await form.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(form.getByText('Não consegui enviar agora')).toBeVisible();
    await expect(form.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled();
  });

  test('painel: fora do índice dos buscadores e do sitemap, pede login', async ({ page, request }) => {
    await page.goto('/admin/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByTestId('admin-login')).toBeVisible();
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain('/admin');
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /admin/');
  });
});
