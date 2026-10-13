// Modelo de um cenário (Pix ou TED) como sequência de mensagens entre os participantes.
// A animação, a lista de passos e os testes leem os mesmos dados.

export type Actor = 'PAGADOR' | 'DICT' | 'SPI' | 'RECEBEDOR' | 'IF_DEBITADA' | 'STR' | 'SITRAF' | 'IF_CREDITADA';

export const ACTOR_LABEL: Record<Actor, { title: string; subtitle: string }> = {
  PAGADOR: { title: 'PSP pagador', subtitle: 'banco de quem paga' },
  DICT: { title: 'DICT', subtitle: 'diretório de chaves' },
  SPI: { title: 'SPI', subtitle: 'Banco Central' },
  RECEBEDOR: { title: 'PSP recebedor', subtitle: 'banco de quem recebe' },
  IF_DEBITADA: { title: 'IF debitada', subtitle: 'banco de quem envia' },
  STR: { title: 'STR', subtitle: 'Banco Central' },
  SITRAF: { title: 'SITRAF', subtitle: 'Núclea' },
  IF_CREDITADA: { title: 'IF creditada', subtitle: 'banco de quem recebe' },
};

/** Ordem fixa da esquerda para a direita na animação (cada cenário mostra só quem usa). */
export const ACTOR_ORDER: Actor[] = ['PAGADOR', 'IF_DEBITADA', 'DICT', 'SPI', 'STR', 'SITRAF', 'RECEBEDOR', 'IF_CREDITADA'];

export type Outcome = 'ok' | 'erro' | 'espera';

export interface FlowStep {
  from: Actor;
  /** Um destino, ou vários ao mesmo tempo (ex.: R1 ao emissor e R2 ao destinatário). */
  to: Actor | Actor[];
  /** Mensagem ou chamada (ex.: "pacs.008", "GET /entries/{chave}"). */
  message: string;
  /** O que acontece neste passo, em português simples. */
  label: string;
  outcome?: Outcome;
  /** Código de motivo, quando o passo é uma rejeição (ex.: "AC06"). */
  code?: string;
  /** Leva dinheiro? (a caixinha mostra o valor) */
  money?: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  summary: string;
  steps: FlowStep[];
  /** Texto do resultado (padrão: "Pix concluído" / "Pix não concluído"). */
  okLabel?: string;
  failLabel?: string;
  /** Texto do botão de iniciar (padrão: "Enviar o Pix"). */
  playLabel?: string;
  /** Nomes dos participantes neste cenário, quando mudam (ex.: na devolução, quem devolve é a IF debitada). */
  labels?: Partial<Record<Actor, { title: string; subtitle: string }>>;
}

export const destinos = (st: FlowStep): Actor[] => (Array.isArray(st.to) ? st.to : [st.to]);
export const rotulo = (s: Scenario, a: Actor) => s.labels?.[a] ?? ACTOR_LABEL[a];

/** Participantes que aparecem no cenário, na ordem da tela (o DICT só aparece se for usado). */
export function actorsOf(s: Scenario): Actor[] {
  const used = new Set(s.steps.flatMap((st) => [st.from, ...destinos(st)]));
  return ACTOR_ORDER.filter((a) => used.has(a));
}

/** Resultado final do cenário: o último passo com desfecho define se o Pix foi concluído ou rejeitado. */
export function finalOutcome(s: Scenario): { outcome: Outcome; code?: string; by?: Actor } {
  const last = [...s.steps].reverse().find((st) => st.outcome && st.outcome !== 'espera');
  if (!last) return { outcome: 'ok' };
  const rejection = s.steps.find((st) => st.outcome === 'erro');
  return rejection ? { outcome: 'erro', code: rejection.code, by: rejection.from } : { outcome: last.outcome! };
}

/** Como cada participante aparece até o passo `upTo`: quem originou o erro, quem foi avisado, quem aceitou, quem está esperando. */
export type NodeState = Outcome | 'avisado';

export function nodeStates(s: Scenario, upTo: number): Partial<Record<Actor, NodeState>> {
  const st: Partial<Record<Actor, NodeState>> = {};
  const origin = s.steps.find((x) => x.outcome === 'erro')?.from;
  for (let i = 0; i <= Math.min(upTo, s.steps.length - 1); i++) {
    const x = s.steps[i];
    const para = destinos(x);
    if (x.outcome === 'ok') { st[x.from] = 'ok'; for (const d of para) st[d] = 'ok'; }
    else if (x.outcome === 'espera') for (const d of para) st[d] = 'espera';
    else if (x.outcome === 'erro') {
      // vermelho forte só em quem originou o erro; quem só recebe o aviso fica destacado de leve
      if (x.from === origin) st[x.from] = 'erro';
      for (const d of para) if (d !== origin && st[d] !== 'espera') st[d] = 'avisado';
    }
  }
  return st;
}
