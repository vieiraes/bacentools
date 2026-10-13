import { describe, expect, it } from 'vitest';
import { actorsOf, destinos, finalOutcome, nodeStates } from '@/features/fluxo/model';
import { CENARIOS_TED, cenarioTedPorId } from '@/lib/spb/cenarios-ted';
import { DOMINIOS, erroSpbPorCodigo, mensagemPorCodigo } from '@/lib/spb/catalogo';

describe('cenários da TED', () => {
  it('ids únicos; toda mensagem citada existe no catálogo (ou é a mensagem E / GEN0004 de erro)', () => {
    expect(new Set(CENARIOS_TED.map((c) => c.id)).size).toBe(CENARIOS_TED.length);
    for (const c of CENARIOS_TED) for (const m of c.mensagens) {
      if (m.endsWith('E')) expect(mensagemPorCodigo(m.slice(0, -1)), m).toBeDefined();
      else expect(mensagemPorCodigo(m), `${c.id}: ${m}`).toBeDefined();
    }
  });

  it('todo código de erro e toda situação usados existem e estão vigentes', () => {
    for (const c of CENARIOS_TED) {
      if (c.erro) expect(erroSpbPorCodigo(c.erro), c.id).toBeDefined();
      for (const s of c.steps) if (s.code?.startsWith('E')) expect(erroSpbPorCodigo(s.code), `${c.id}: ${s.code}`).toBeDefined();
      for (const s of c.situacoes ?? []) expect(DOMINIOS.SitLancSTR.some((d) => d.codigo === s), `${c.id}: situação ${s}`).toBe(true);
    }
  });

  it('o banco de quem recebe só é avisado depois da efetivação (Vol. I, p. 251): nenhuma R2 em cenário recusado', () => {
    for (const c of CENARIOS_TED) {
      const recusado = finalOutcome(c).outcome === 'erro';
      const avisaCreditada = c.steps.some((s) => destinos(s).includes('IF_CREDITADA'));
      if (recusado) expect(avisaCreditada, c.id).toBe(false);
      else expect(avisaCreditada, c.id).toBe(true);
    }
  });

  it('efetivada: R1 e R2 saem juntas do STR, e os três participantes ficam verdes', () => {
    const c = cenarioTedPorId('ted-efetivada')!;
    expect(actorsOf(c)).toEqual(['IF_DEBITADA', 'STR', 'IF_CREDITADA']);
    expect(destinos(c.steps[1])).toEqual(['IF_DEBITADA', 'IF_CREDITADA']);
    expect(nodeStates(c, 1)).toEqual({ IF_DEBITADA: 'ok', STR: 'ok', IF_CREDITADA: 'ok' });
  });

  it('recusa: vermelho forte só no STR, que originou o erro; quem envia fica avisado', () => {
    const c = cenarioTedPorId('ted-finalidade-outros')!;
    expect(finalOutcome(c)).toEqual({ outcome: 'erro', code: 'ESTR0146', by: 'STR' });
    expect(nodeStates(c, 1)).toEqual({ STR: 'erro', IF_DEBITADA: 'avisado' });
  });

  it('pendente: STR e IF debitada esperando até o saldo chegar', () => {
    const c = cenarioTedPorId('ted-pendente')!;
    expect(nodeStates(c, 1)).toEqual({ STR: 'espera', IF_DEBITADA: 'espera' });
    expect(nodeStates(c, 2).IF_CREDITADA).toBe('ok');
  });

  it('SITRAF usa a câmara no meio; devolução troca os nomes dos bancos', () => {
    expect(actorsOf(cenarioTedPorId('ted-sitraf')!)).toEqual(['IF_DEBITADA', 'SITRAF', 'IF_CREDITADA']);
    expect(cenarioTedPorId('devolucao')!.labels?.IF_DEBITADA?.title).toBe('Banco B');
    expect(cenarioTedPorId('nao-existe')).toBeUndefined();
  });
});
