import { describe, expect, it } from 'vitest';
import { BASE, ERROS, FONTES } from '@/lib/pix-erros/catalogo';
import { CENARIO_SUCESSO, DESTAQUES, cenarioDoErro, cenarioPorId } from '@/lib/pix-erros/cenarios';
import { finalOutcome } from '@/features/fluxo-pix/model';

describe('base de erros do Pix: rastreabilidade', () => {
  it('todo código exibido vem de fonte oficial do BCB, com local na fonte', () => {
    for (const e of ERROS) {
      expect(e.fonteOficial, e.id).toBe(true);
      expect(e.fonte.url, e.id).toMatch(/^https:\/\/www\.bcb\.gov\.br\//);
      expect(e.localNaFonte.length, e.id).toBeGreaterThan(10);
    }
  });

  it('identificadores únicos (o mesmo código pode existir em mensagens diferentes, ex.: SL02)', () => {
    const ids = ERROS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ERROS.filter((e) => e.codigo === 'SL02').map((e) => e.id).sort()).toEqual(['pacs002-SL02', 'pacs004-SL02']);
  });

  it('tem as três famílias: rejeições pacs.002, devoluções pacs.004 e erros do DICT', () => {
    const count = (t: string) => ERROS.filter((e) => e.tipo === t).length;
    expect(count('rejeicao')).toBeGreaterThanOrEqual(40);
    expect(count('devolucao')).toBe(4);
    expect(count('dict')).toBeGreaterThanOrEqual(20);
    expect(ERROS.filter((e) => e.tipo === 'devolucao').map((e) => e.codigo).sort()).toEqual(['BE08', 'FR01', 'MD06', 'SL02']);
  });

  it('códigos de rejeição seguem o padrão ISO (4 caracteres) e os do DICT têm status HTTP', () => {
    for (const e of ERROS.filter((x) => x.tipo !== 'dict')) expect(e.codigo, e.id).toMatch(/^[A-Z0-9]{4}$/);
    for (const e of ERROS.filter((x) => x.tipo === 'dict')) expect(e.httpStatus, e.id).toBeGreaterThanOrEqual(400);
  });

  it('códigos fora de vigor não aparecem como vigentes (DS0H e DS24 foram excluídos do catálogo)', () => {
    const vigentes = new Set(ERROS.map((e) => e.codigo));
    expect(vigentes.has('DS0H')).toBe(false);
    expect(vigentes.has('DS24')).toBe(false);
    expect(BASE.naoConfirmado.map((n) => n.item).join(' ')).toMatch(/DS0H/);
  });

  it('o timeout AB03 está marcado como dedução (não está escrito literalmente na fonte)', () => {
    expect(ERROS.find((e) => e.id === 'pacs002-AB03')!.deducao).toBe(true);
    expect(ERROS.find((e) => e.id === 'pacs002-AC06')!.deducao).toBe(false);
  });

  it('as fontes citadas existem', () => {
    for (const e of ERROS) expect(FONTES[e.fonteId], e.id).toBeDefined();
  });
});

describe('cenários gerados a partir dos códigos', () => {
  it('sucesso segue o Manual de Fluxos: ACSP do recebedor, depois ACCC ao recebedor e ACSC ao pagador', () => {
    expect(CENARIO_SUCESSO.steps.map((s) => `${s.from}>${s.to}:${s.message}`)).toEqual([
      'PAGADOR>SPI:pacs.008', 'SPI>RECEBEDOR:pacs.008', 'RECEBEDOR>SPI:pacs.002 ACSP', 'SPI>RECEBEDOR:pacs.002 ACCC', 'SPI>PAGADOR:pacs.002 ACSC',
    ]);
    expect(finalOutcome(CENARIO_SUCESSO).outcome).toBe('ok');
  });

  it('rejeição do PSP recebedor: o dinheiro chega ao recebedor, que rejeita; o código volta ao pagador', () => {
    const c = cenarioDoErro(ERROS.find((e) => e.id === 'pacs002-AC07')!);
    expect(c.steps.some((s) => s.to === 'RECEBEDOR' && s.money)).toBe(true);
    expect(finalOutcome(c)).toEqual({ outcome: 'erro', code: 'AC07', by: 'RECEBEDOR' });
    expect(c.steps.at(-1)).toMatchObject({ to: 'PAGADOR', code: 'AC07' });
  });

  it('rejeição do SPI: o pagamento nunca chega ao recebedor', () => {
    for (const e of ERROS.filter((x) => x.tipo === 'rejeicao' && x.origem === 'SPI' && x.codigo !== 'AB03')) {
      const c = cenarioDoErro(e);
      expect(c.steps.some((s) => s.to === 'RECEBEDOR'), e.id).toBe(false);
      expect(finalOutcome(c), e.id).toMatchObject({ outcome: 'erro', by: 'SPI' });
    }
  });

  it('timeout AB03: o recebedor fica esperando e o SPI avisa os dois PSPs', () => {
    const c = cenarioPorId('pacs002-AB03')!;
    expect(c.steps.some((s) => s.outcome === 'espera')).toBe(true);
    expect(c.steps.filter((s) => s.code === 'AB03').map((s) => s.to).sort()).toEqual(['PAGADOR', 'RECEBEDOR']);
  });

  it('devolução: Pix concluído e depois pacs.004 com o motivo, aceita pelo pagador original', () => {
    const c = cenarioPorId('pacs004-MD06')!;
    expect(c.steps.filter((s) => s.message === 'pacs.004')).toHaveLength(2);
    expect(finalOutcome(c).outcome).toBe('ok');
    expect(c.okLabel).toMatch(/devolvido/);
  });

  it('erro do DICT: só pagador e DICT participam, com o status HTTP', () => {
    const c = cenarioPorId('dict-RateLimited')!;
    expect(new Set(c.steps.flatMap((s) => [s.from, s.to]))).toEqual(new Set(['PAGADOR', 'DICT']));
    expect(c.steps.at(-1)).toMatchObject({ message: 'HTTP 429', outcome: 'erro' });
  });

  it('todos os atalhos da tela existem e todo código gera um cenário', () => {
    for (const id of DESTAQUES) expect(cenarioPorId(id), id).toBeDefined();
    for (const e of ERROS) expect(cenarioDoErro(e).steps.length, e.id).toBeGreaterThanOrEqual(2);
    expect(cenarioPorId('nao-existe')).toBeUndefined();
  });
});
