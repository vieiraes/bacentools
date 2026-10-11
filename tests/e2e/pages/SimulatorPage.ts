import { expect, type Locator, type Page } from '@playwright/test';
import { choose } from '../fixtures';

export type BucketId = 'user-v1' | 'user-v2' | 'participant';

/** Page Object do simulador do DICT: os testes falam a língua do negócio, não de seletores. */
export class SimulatorPage {
  readonly consultFoundBtn: Locator;
  readonly consultNotFoundBtn: Locator;
  readonly payBtn: Locator;
  readonly log: Locator;

  constructor(readonly page: Page) {
    this.consultFoundBtn = page.getByTestId('consult-found');
    this.consultNotFoundBtn = page.getByTestId('consult-not-found');
    this.payBtn = page.getByTestId('pay');
    this.log = page.getByTestId('log');
  }

  async open() {
    await this.page.goto('/simulador-dict/');
    await expect(this.page.getByRole('heading', { level: 1 })).toHaveText('Simulador de fichas do DICT');
  }

  /**
   * O relógio da página fica congelado nesses testes; o menu do MUI fecha com uma animação por temporizador,
   * então depois de cada escolha avançamos 400 ms para a camada do menu sair de cima dos botões.
   */
  private async pick(label: string | RegExp, option: string | RegExp) {
    await choose(this.page, label, option);
    await this.page.clock.runFor(400);
    await expect(this.page.getByRole('listbox')).toHaveCount(0);
  }

  async scenario(opts: { user?: 'PF' | 'PJ'; keyType?: string; category?: string; speed?: number }) {
    if (opts.user) await this.pick('Quem consulta', opts.user === 'PF' ? /Maria Souza/ : /Padaria/);
    if (opts.keyType) await this.pick('Tipo de chave', new RegExp(`^${opts.keyType}$`));
    if (opts.category) await this.pick(/Categoria do participante/, new RegExp(`^${opts.category} ·`));
    if (opts.speed) await this.pick('Velocidade do relógio', opts.speed === 1 ? 'tempo real' : `${opts.speed}× mais rápido`);
  }

  async consultFound(times = 1) { for (let i = 0; i < times; i++) await this.consultFoundBtn.click(); }
  async consultNotFound(times = 1) { for (let i = 0; i < times; i++) await this.consultNotFoundBtn.click(); }
  async pay() { await this.payBtn.click(); }

  tokens(bucket: BucketId) { return this.page.getByTestId(`tokens-${bucket}`); }
  async tokenCount(bucket: BucketId) { return Number((await this.tokens(bucket).innerText()).replace(/\./g, '')); }
  lastStatus() { return this.log.getByTestId('status').first(); }
  lastEntry() { return this.log.locator('li').first(); }
  statuses() { return this.log.getByTestId('status').allInnerTexts(); }
}
