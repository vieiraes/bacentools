import { describe, expect, it } from 'vitest';
import { actorsOf, finalOutcome, type Scenario } from '@/features/fluxo-pix/model';

const base = (steps: Scenario['steps']): Scenario => ({ id: 't', title: 't', summary: 't', steps });

describe('modelo de cenário do Pix', () => {
  it('mostra só os participantes usados, na ordem pagador → DICT → SPI → recebedor', () => {
    expect(actorsOf(base([{ from: 'SPI', to: 'PAGADOR', message: 'x', label: 'x' }, { from: 'PAGADOR', to: 'SPI', message: 'x', label: 'x' }]))).toEqual(['PAGADOR', 'SPI']);
    expect(actorsOf(base([{ from: 'RECEBEDOR', to: 'SPI', message: 'x', label: 'x' }, { from: 'PAGADOR', to: 'DICT', message: 'x', label: 'x' }]))).toEqual(['PAGADOR', 'DICT', 'SPI', 'RECEBEDOR']);
  });

  it('desfecho: sem rejeição é sucesso; com rejeição traz o código e quem rejeitou', () => {
    expect(finalOutcome(base([{ from: 'PAGADOR', to: 'SPI', message: 'pacs.008', label: 'x' }]))).toEqual({ outcome: 'ok' });
    expect(finalOutcome(base([{ from: 'RECEBEDOR', to: 'SPI', message: 'pacs.002', label: 'x', outcome: 'ok' }]))).toEqual({ outcome: 'ok' });
    expect(finalOutcome(base([
      { from: 'RECEBEDOR', to: 'SPI', message: 'pacs.002', label: 'x', outcome: 'erro', code: 'AC06' },
      { from: 'SPI', to: 'PAGADOR', message: 'pacs.002', label: 'x', outcome: 'erro', code: 'AC06' },
    ]))).toEqual({ outcome: 'erro', code: 'AC06', by: 'RECEBEDOR' });
  });

  it('passo "esperando" não define o desfecho', () => {
    expect(finalOutcome(base([
      { from: 'SPI', to: 'RECEBEDOR', message: 'pacs.008', label: 'x', outcome: 'espera' },
    ]))).toEqual({ outcome: 'ok' });
  });
});

import { nodeStates } from '@/features/fluxo-pix/model';
import { cenarioPorId } from '@/lib/pix-erros/cenarios';

describe('cores dos participantes na animação', () => {
  it('AC06: vermelho em quem rejeitou (recebedor); o SPI só repassa e o pagador é avisado', () => {
    const c = cenarioPorId('pacs002-AC06')!;
    expect(nodeStates(c, 2)).toMatchObject({ RECEBEDOR: 'erro' });
    expect(nodeStates(c, 2).SPI).toBe('avisado');
    expect(nodeStates(c, 3)).toMatchObject({ RECEBEDOR: 'erro', PAGADOR: 'avisado' });
  });

  it('AM04: quem rejeita é o próprio SPI', () => {
    expect(nodeStates(cenarioPorId('pacs002-AM04')!, 1)).toEqual({ SPI: 'erro', PAGADOR: 'avisado' });
  });

  it('AB03: o recebedor fica "esperando" e o SPI origina o timeout', () => {
    const c = cenarioPorId('pacs002-AB03')!;
    expect(nodeStates(c, 2)).toEqual({ RECEBEDOR: 'espera' });
    expect(nodeStates(c, 4)).toMatchObject({ SPI: 'erro', RECEBEDOR: 'espera', PAGADOR: 'avisado' });
  });

  it('sucesso: todos verdes no fim; antes de começar, ninguém tem cor', () => {
    const c = cenarioPorId('sucesso')!;
    expect(nodeStates(c, -1)).toEqual({});
    expect(nodeStates(c, c.steps.length - 1)).toEqual({ PAGADOR: 'ok', SPI: 'ok', RECEBEDOR: 'ok' });
  });
});
