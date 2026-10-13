// Horário de funcionamento a partir da Grade de horários do SPB (BCB), no fuso de Brasília.
// Feriados não são considerados: num feriado nacional vale a coluna "Sábados e Feriados" (o site não tem o calendário).
import type { GradeHorario } from './catalogo';

export type TipoDia = 'util' | 'natal' | 'ultimoDia' | 'sabadoFeriado' | 'domingo';

export const ROTULO_DIA: Record<TipoDia, string> = {
  util: 'dia útil',
  natal: '24 de dezembro',
  ultimoDia: 'último dia útil do ano',
  sabadoFeriado: 'sábado',
  domingo: 'domingo',
};

/** Data e hora em Brasília, sem depender do fuso de quem abre o site. */
export function agoraEmBrasilia(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { ano: Number(p.year), mes: Number(p.month), dia: Number(p.day), minutos: Number(p.hour) * 60 + Number(p.minute), semana: p.weekday as string };
}

/** Último dia de semana (seg–sex) de dezembro do ano. */
export function ultimoDiaUtilDoAno(ano: number): number {
  for (let dia = 31; ; dia--) {
    const s = new Date(Date.UTC(ano, 11, dia)).getUTCDay();
    if (s !== 0 && s !== 6) return dia;
  }
}

export function tipoDoDia(d: Date): TipoDia {
  const b = agoraEmBrasilia(d);
  if (b.semana === 'Sun') return 'domingo';
  if (b.semana === 'Sat') return 'sabadoFeriado';
  if (b.mes === 12 && b.dia === 24) return 'natal';
  if (b.mes === 12 && b.dia === ultimoDiaUtilDoAno(b.ano)) return 'ultimoDia';
  return 'util';
}

const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export interface Situacao {
  tipoDia: TipoDia;
  janela: { abre: string; fecha: string } | null;
  aberto: boolean;
  /** "abre às 06:30", "fecha às 17:30", "fechou às 17:30", "não funciona hoje" */
  texto: string;
}

export function situacao(g: GradeHorario, agora: Date): Situacao {
  const tipoDia = tipoDoDia(agora);
  const janela = g[tipoDia];
  if (!janela) return { tipoDia, janela, aberto: false, texto: `não funciona em ${ROTULO_DIA[tipoDia]}` };
  const m = agoraEmBrasilia(agora).minutos;
  // "23:59" na grade é 23:59:59: o minuto inteiro conta como aberto
  if (m < minutos(janela.abre)) return { tipoDia, janela, aberto: false, texto: `abre às ${janela.abre}` };
  if (m > minutos(janela.fecha) || (m === minutos(janela.fecha) && janela.fecha !== '23:59')) return { tipoDia, janela, aberto: false, texto: `fechou às ${janela.fecha}` };
  return { tipoDia, janela, aberto: true, texto: `aberto até ${janela.fecha}` };
}
