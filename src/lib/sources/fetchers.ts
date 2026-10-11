import { z } from 'zod';
import { BankSchema, BcbInformesResponse, PixParticipantSchema, toInforme, type Bank, type Informe, type InformeTipo, type PixParticipant } from './schemas';

export const SOURCES = {
  banks: 'https://brasilapi.com.br/api/banks/v1',
  pixParticipants: 'https://brasilapi.com.br/api/pix/v1/participants',
  bcbInformes: 'https://www.bcb.gov.br/api/servico/sitebcb/cronologicodados',
} as const;

/** Listas do BCB (SharePoint) de onde saem os informes do SPI e do STR. */
export const INFORME_GUIDS: Record<InformeTipo, string> = {
  SPI: '2ce7ab01-23d2-46bd-8f8e-e14888661cd5',
  STR: 'acc99ae3-5bc8-417a-a505-c9818d4486a5',
};

/** De onde veio o dado: direto da fonte ou da cópia diária publicada junto com o site (/data). */
export interface Sourced<T> {
  data: T;
  origin: 'live' | 'snapshot';
  /** Data da cópia, quando veio dela. */
  snapshotAt?: string;
}

type Fetch = typeof fetch;

async function getJson(url: string, f: Fetch, timeoutMs = 12_000): Promise<unknown> {
  const res = await f(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${new URL(url).host}`);
  return res.json();
}

/** Lê uma lista da fonte e valida cada item; itens inválidos são descartados (e contados), não derrubam a página. */
function parseList<S extends z.ZodTypeAny>(schema: S, raw: unknown): z.output<S>[] {
  if (!Array.isArray(raw)) throw new Error('formato inesperado: a fonte não devolveu uma lista');
  const out: z.output<S>[] = [];
  for (const item of raw) {
    const r = schema.safeParse(item);
    if (r.success) out.push(r.data);
  }
  if (raw.length > 0 && out.length === 0) throw new Error('formato inesperado: nenhum item válido na fonte');
  return out;
}

/** Tenta a fonte ao vivo; se falhar, usa a cópia diária (gerada pela GitHub Action e publicada em /data). */
async function withSnapshot<T>(live: () => Promise<T>, snapshotPath: string, parse: (raw: unknown) => T, f: Fetch): Promise<Sourced<T>> {
  try {
    return { data: await live(), origin: 'live' };
  } catch (liveError) {
    try {
      const snap = (await getJson(snapshotPath, f)) as { generatedAt: string; data: unknown };
      return { data: parse(snap.data), origin: 'snapshot', snapshotAt: snap.generatedAt };
    } catch {
      throw liveError;
    }
  }
}

export function fetchBanks(f: Fetch = fetch): Promise<Sourced<Bank[]>> {
  const parse = (raw: unknown) => parseList(BankSchema, raw).sort((a, b) => (a.code ?? 9999) - (b.code ?? 9999) || a.name.localeCompare(b.name));
  return withSnapshot(async () => parse(await getJson(SOURCES.banks, f)), '/data/banks.json', parse, f);
}

export function fetchPixParticipants(f: Fetch = fetch): Promise<Sourced<PixParticipant[]>> {
  const parse = (raw: unknown) => parseList(PixParticipantSchema, raw).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return withSnapshot(async () => parse(await getJson(SOURCES.pixParticipants, f)), '/data/pix-participants.json', parse, f);
}

export function informesUrl(tipo: InformeTipo, ano: number): string {
  const u = new URL(SOURCES.bcbInformes);
  u.searchParams.set('ano', String(ano));
  u.searchParams.set('tronco', 'estabilidadefinanceira');
  u.searchParams.set('guidLista', INFORME_GUIDS[tipo]);
  u.searchParams.set('ordem', 'DataReferencia desc, Title asc');
  return u.toString();
}

/** Informes de um tipo e ano, mais recentes primeiro. */
export async function fetchInformes(tipo: InformeTipo, ano: number, f: Fetch = fetch): Promise<Informe[]> {
  const parsed = BcbInformesResponse.parse(await getJson(informesUrl(tipo, ano), f));
  return parsed.conteudo.map((i) => toInforme(tipo, i)).sort((a, b) => b.referenceDate.localeCompare(a.referenceDate));
}
