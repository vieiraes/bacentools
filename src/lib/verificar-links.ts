// Verificação dos links oficiais (roda toda semana no GitHub Actions: scripts/check-links.mjs).
// O site do BCB é uma aplicação de página única: qualquer endereço devolve 200. Por isso cada tipo de link
// é conferido pela API que a própria página usa para montar o conteúdo.

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export interface ResultadoLink { url: string; ok: boolean; motivo?: string }

export interface StatusLinks {
  /** quando a lista foi revisada à mão (títulos, versões, descrições) */
  revisadoEm: string;
  /** quando o robô abriu os links pela última vez (ISO, UTC) */
  verificadoEm: string;
  total: number;
  quebrados: { titulo: string; url: string; motivo: string }[];
}

export const STATUS_URL = 'https://raw.githubusercontent.com/vieiraes/bacentools/main/public/data/links-status.json';

const BCB = 'https://www.bcb.gov.br';

/** Para onde perguntar se o link existe. */
export function comoConferir(url: string): { tipo: 'norma' | 'pagina-bcb' | 'arquivo'; consulta: string } {
  const u = new URL(url);
  if (u.origin === BCB && u.pathname === '/estabilidadefinanceira/exibenormativo') {
    const tipo = u.searchParams.get('tipo') ?? '';
    const numero = u.searchParams.get('numero') ?? '';
    return { tipo: 'norma', consulta: `${BCB}/api/conteudo/app/normativos/exibenormativo?p1=${encodeURIComponent(tipo)}&p2=${encodeURIComponent(numero)}` };
  }
  if (u.origin === BCB && !u.pathname.startsWith('/content/') && !u.pathname.startsWith('/api/')) {
    return { tipo: 'pagina-bcb', consulta: `${BCB}/api/paginasite/sitebcb${u.pathname}` };
  }
  return { tipo: 'arquivo', consulta: url };
}

export async function verificarLink(url: string, f: Fetch = fetch, tentativas = 2): Promise<ResultadoLink> {
  const { tipo, consulta } = comoConferir(url);
  let motivo = '';
  for (let i = 0; i < tentativas; i++) {
    try {
      const r = await f(consulta, { headers: { 'user-agent': 'Mozilla/5.0 (BacenTools link check)' }, redirect: 'follow' });
      if (!r.ok) { motivo = `HTTP ${r.status}`; continue; }
      if (tipo === 'arquivo') return { url, ok: true };
      const j = (await r.json()) as { metatags?: unknown; conteudo?: unknown };
      if (tipo === 'norma') {
        if (Array.isArray(j.conteudo) && j.conteudo.length > 0) return { url, ok: true };
        return { url, ok: false, motivo: 'A norma não existe mais no site do BCB' };
      }
      if (j.metatags) return { url, ok: true };
      return { url, ok: false, motivo: 'A página não existe mais no site do BCB' };
    } catch (e) {
      motivo = e instanceof Error ? e.message : String(e);
    }
  }
  return { url, ok: false, motivo: motivo || 'sem resposta' };
}

export const dataHoraBr = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
