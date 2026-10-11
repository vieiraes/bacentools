import type { Scenario } from '@/features/fluxo-pix/model';
import { BASE, ERROS, FONTES, type ErroPix } from './catalogo';

// Transforma cada código da base num cenário animado (sequência de mensagens entre os participantes).
// Os fluxos seguem o Manual de Fluxos do Processo de Efetivação do Pix e o Catálogo de Mensagens do SPI.

export interface CenarioPix extends Scenario {
  erro?: ErroPix;
  fonteIds: string[];
}

const PAGAMENTO_IDA: Scenario['steps'] = [
  { from: 'PAGADOR', to: 'SPI', message: 'pacs.008', label: 'o PSP do pagador envia a ordem de pagamento ao SPI', money: true },
  { from: 'SPI', to: 'RECEBEDOR', message: 'pacs.008', label: 'o SPI repassa a ordem ao PSP do recebedor', money: true },
];

export const CENARIO_SUCESSO: CenarioPix = {
  id: 'sucesso',
  title: 'Pix concluído',
  summary: 'O recebedor aceita, o SPI liquida entre as Contas PI e avisa os dois lados.',
  fonteIds: ['bcb-manual-fluxos-2.1', 'bcb-catalogo-spi-5.13.2'],
  steps: [
    ...PAGAMENTO_IDA,
    { from: 'RECEBEDOR', to: 'SPI', message: 'pacs.002 ACSP', label: 'o recebedor valida a conta e aceita; o SPI troca os saldos das Contas PI', outcome: 'ok' },
    { from: 'SPI', to: 'RECEBEDOR', message: 'pacs.002 ACCC', label: 'o SPI confirma a conclusão; o PSP credita o recebedor', outcome: 'ok' },
    { from: 'SPI', to: 'PAGADOR', message: 'pacs.002 ACSC', label: 'o SPI confirma a conclusão; o PSP efetiva o débito do pagador', outcome: 'ok' },
  ],
};

export const CENARIO_ADMI002: CenarioPix = {
  id: 'admi002',
  failLabel: 'Mensagem recusada pelo SPI',
  title: 'Mensagem inválida (admi.002)',
  summary: 'O SPI recusa a mensagem antes de processar: formato, assinatura ou erro de processamento. Não tem código ISO, o motivo vem em texto livre.',
  fonteIds: [BASE.mensagensDeErroSemCodigo[0]?.fonteId ?? 'bcb-catalogo-spi-5.13.2'],
  steps: [
    { from: 'PAGADOR', to: 'SPI', message: 'pacs.008', label: 'o PSP do pagador envia uma mensagem com assinatura XML inválida', money: true },
    { from: 'SPI', to: 'PAGADOR', message: 'admi.002', label: '"Assinatura XML inválida": a mensagem nem entra no fluxo de liquidação', outcome: 'erro' },
  ],
};

export function cenarioDoErro(e: ErroPix): CenarioPix {
  const base = { id: e.id, erro: e, fonteIds: [e.fonteId], title: `${e.codigo}${e.nomeIso ? ` · ${e.nomeIso}` : ''}`, summary: e.cenario ?? e.descricao };
  if (e.tipo === 'dict') {
    return {
      ...base,
      failLabel: 'Consulta recusada: o Pix nem começa',
      steps: [
        { from: 'PAGADOR', to: 'DICT', message: 'GET /entries/{chave}', label: 'o PSP do pagador consulta a chave Pix no DICT' },
        { from: 'DICT', to: 'PAGADOR', message: `HTTP ${e.httpStatus ?? ''}`.trim(), code: e.codigo, label: e.descricao, outcome: 'erro' },
      ],
    };
  }
  if (e.tipo === 'devolucao') {
    return {
      ...base,
      okLabel: `Pix devolvido · ${e.codigo}`,
      steps: [
        ...CENARIO_SUCESSO.steps,
        { from: 'RECEBEDOR', to: 'SPI', message: 'pacs.004', code: e.codigo, label: `o PSP do recebedor devolve o Pix: ${e.descricao}`, money: true },
        { from: 'SPI', to: 'PAGADOR', message: 'pacs.004', code: e.codigo, label: 'o SPI repassa a devolução ao PSP do pagador original', money: true },
        { from: 'PAGADOR', to: 'SPI', message: 'pacs.002 ACSP', label: 'o PSP do pagador original confere prazo (90 dias) e valor e aceita', outcome: 'ok' },
        { from: 'SPI', to: 'PAGADOR', message: 'pacs.002 ACCC', label: 'devolução concluída: o valor volta para quem pagou', outcome: 'ok' },
      ],
    };
  }
  if (e.codigo === 'AB03') {
    return {
      ...base,
      steps: [
        ...PAGAMENTO_IDA,
        { from: 'SPI', to: 'RECEBEDOR', message: 'aguardando pacs.002', label: 'o recebedor não responde dentro do tempo-limite do SPI', outcome: 'espera' },
        { from: 'SPI', to: 'PAGADOR', message: 'pacs.002 RJCT', code: e.codigo, label: e.descricao, outcome: 'erro' },
        { from: 'SPI', to: 'RECEBEDOR', message: 'pacs.002 RJCT', code: e.codigo, label: 'o SPI também avisa o recebedor; o bloqueio na Conta PI é desfeito', outcome: 'erro' },
      ],
    };
  }
  if (e.origem === 'SPI') {
    return {
      ...base,
      steps: [
        PAGAMENTO_IDA[0],
        { from: 'SPI', to: 'PAGADOR', message: 'pacs.002 RJCT', code: e.codigo, label: `o próprio SPI rejeita: ${e.descricao}`, outcome: 'erro' },
      ],
    };
  }
  // PSP do recebedor (ou outro participante) rejeita
  return {
    ...base,
    steps: [
      ...PAGAMENTO_IDA,
      { from: 'RECEBEDOR', to: 'SPI', message: 'pacs.002 RJCT', code: e.codigo, label: `o PSP do recebedor rejeita: ${e.descricao}`, outcome: 'erro' },
      { from: 'SPI', to: 'PAGADOR', message: 'pacs.002 RJCT', code: e.codigo, label: 'o SPI repassa a rejeição; nenhum dinheiro muda de Conta PI', outcome: 'erro' },
    ],
  };
}

/** Atalhos da tela: os cenários que mais aparecem no dia a dia (todos existem na base). */
export const DESTAQUES = ['sucesso', 'pacs002-AC07', 'pacs002-AC06', 'pacs002-FRAD', 'pacs002-AM04', 'pacs002-AB03', 'admi002', 'pacs004-MD06', 'dict-NotFound', 'dict-RateLimited'];

export function cenarioPorId(id: string): CenarioPix | undefined {
  if (id === 'sucesso') return CENARIO_SUCESSO;
  if (id === 'admi002') return CENARIO_ADMI002;
  const e = ERROS.find((x) => x.id === id);
  return e ? cenarioDoErro(e) : undefined;
}

export const fonteDe = (id: string) => FONTES[id];
