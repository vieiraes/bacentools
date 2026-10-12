import { describe, expect, it } from 'vitest';
import { comoConferir, dataHoraBr, verificarLink, type Fetch } from '@/lib/verificar-links';

const resp = (status: number, json?: unknown) => new Response(json === undefined ? 'x' : JSON.stringify(json), { status });
const fake = (...respostas: (Response | Error)[]): Fetch & { chamadas: string[] } => {
  const chamadas: string[] = [];
  const f = (async (url: string) => {
    chamadas.push(url);
    const r = respostas.shift()!;
    if (r instanceof Error) throw r;
    return r;
  }) as Fetch & { chamadas: string[] };
  f.chamadas = chamadas;
  return f;
};

describe('como conferir cada tipo de link', () => {
  it('norma vai para a API de normativos', () => {
    expect(comoConferir('https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=1')).toEqual({
      tipo: 'norma',
      consulta: 'https://www.bcb.gov.br/api/conteudo/app/normativos/exibenormativo?p1=Resolu%C3%A7%C3%A3o%20BCB&p2=1',
    });
  });
  it('página do BCB vai para a API do site; arquivo e GitHub são abertos direto', () => {
    expect(comoConferir('https://www.bcb.gov.br/estabilidadefinanceira/pix-normas').consulta).toBe('https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-normas');
    expect(comoConferir('https://www.bcb.gov.br/content/estabilidadefinanceira/pix/a.pdf').tipo).toBe('arquivo');
    expect(comoConferir('https://github.com/bacen/pix-api').tipo).toBe('arquivo');
  });
});

describe('verificarLink', () => {
  const norma = 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=X&numero=1';
  const pagina = 'https://www.bcb.gov.br/estabilidadefinanceira/pix';

  it('norma existe ou não existe (o site responde 200 nos dois casos)', async () => {
    expect(await verificarLink(norma, fake(resp(200, { conteudo: [{ Titulo: 'R' }] })))).toEqual({ url: norma, ok: true });
    expect(await verificarLink(norma, fake(resp(200, { conteudo: [] })))).toEqual({ url: norma, ok: false, motivo: 'A norma não existe mais no site do BCB' });
  });

  it('página existe quando a API devolve metatags', async () => {
    expect((await verificarLink(pagina, fake(resp(200, { metatags: { Titulo: 'Pix' } })))).ok).toBe(true);
    expect(await verificarLink(pagina, fake(resp(200, { metatags: null })))).toMatchObject({ ok: false, motivo: 'A página não existe mais no site do BCB' });
  });

  it('arquivo: 404 falha; erro de rede tenta de novo e passa na segunda', async () => {
    const pdf = 'https://www.bcb.gov.br/content/x.pdf';
    expect(await verificarLink(pdf, fake(resp(404), resp(404)))).toEqual({ url: pdf, ok: false, motivo: 'HTTP 404' });
    const f = fake(new Error('ECONNRESET'), resp(200));
    expect(await verificarLink(pdf, f)).toEqual({ url: pdf, ok: true });
    expect(f.chamadas).toHaveLength(2);
    expect(await verificarLink(pdf, fake(new Error('timeout'), new Error('timeout')))).toMatchObject({ ok: false, motivo: 'timeout' });
    expect(await verificarLink(pdf, fake('falhou' as unknown as Error), 1)).toMatchObject({ ok: false });
  });

  it('data e hora em Brasília', () => {
    expect(dataHoraBr('2026-10-12T09:05:00Z')).toBe('12/10/2026, 06:05');
  });
});
