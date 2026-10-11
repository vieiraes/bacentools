import { describe, expect, it, vi } from 'vitest';
import banksFixture from '../fixtures/banks.json';
import pixFixture from '../fixtures/pix-participants.json';
import informesFixture from '../fixtures/informes-2026.json';
import { SOURCES, fetchBanks, fetchInformes, fetchPixParticipants, informesUrl } from '@/lib/sources/fetchers';
import { BankSchema } from '@/lib/sources/schemas';

/** fetch falso: responde por URL; o que não estiver no mapa vira erro de rede. */
function fakeFetch(routes: Record<string, unknown | Error | number>) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.startsWith(k));
    const v = key ? routes[key] : new TypeError('Failed to fetch');
    if (v instanceof Error) throw v;
    if (typeof v === 'number') return new Response('erro', { status: v });
    return new Response(JSON.stringify(v), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
}

describe('contrato da BrasilAPI: bancos', () => {
  it('valida e normaliza a amostra real gravada (logo, cidade, COMPE nulo)', async () => {
    const r = await fetchBanks(fakeFetch({ [SOURCES.banks]: banksFixture }));
    expect(r.origin).toBe('live');
    expect(r.data).toHaveLength(banksFixture.length);
    const bb = r.data.find((b) => b.code === 1)!;
    expect(bb).toMatchObject({ ispb: '00000000', name: 'BCO DO BRASIL S.A.', city: 'BRASÍLIA', state: 'DF' });
    expect(bb.logoUrl).toMatch(/^https:\/\//);
    expect(r.data.at(-1)!.code).toBeNull(); // sem COMPE vai para o fim da lista
    expect(r.data.every((b) => /^\d{8}$/.test(b.ispb))).toBe(true);
  });

  it('item fora do contrato é descartado sem derrubar a lista', async () => {
    const r = await fetchBanks(fakeFetch({ [SOURCES.banks]: [...banksFixture, { ispb: 'abc', name: 1 }, null] }));
    expect(r.data).toHaveLength(banksFixture.length);
  });

  it('ISPB numérico do BCB ganha os zeros à esquerda', () => {
    expect(BankSchema.parse({ ispb: 360305, name: 'CAIXA', code: 104, fullName: null }).ispb).toBe('00360305');
  });

  it('se nada da lista for válido, é erro de formato (a fonte mudou)', async () => {
    await expect(fetchBanks(fakeFetch({ [SOURCES.banks]: [{ foo: 1 }], '/data/banks.json': 404 }))).rejects.toThrow(/formato inesperado/);
    await expect(fetchBanks(fakeFetch({ [SOURCES.banks]: { not: 'a list' }, '/data/banks.json': 404 }))).rejects.toThrow(/não devolveu uma lista/);
  });
});

describe('cópia diária (fallback) quando a fonte cai', () => {
  const snapshot = { generatedAt: '2026-10-11T06:00:00Z', data: banksFixture };

  it.each([['fora do ar', new TypeError('Failed to fetch')], ['HTTP 503', 503]])('fonte %s → usa a cópia e informa a data', async (_d, failure) => {
    const r = await fetchBanks(fakeFetch({ [SOURCES.banks]: failure, '/data/banks.json': snapshot }));
    expect(r).toMatchObject({ origin: 'snapshot', snapshotAt: '2026-10-11T06:00:00Z' });
    expect(r.data).toHaveLength(banksFixture.length);
  });

  it('fonte e cópia fora do ar → o erro original da fonte chega à tela', async () => {
    await expect(fetchBanks(fakeFetch({ [SOURCES.banks]: 503, '/data/banks.json': 404 }))).rejects.toThrow(/HTTP 503 em brasilapi.com.br/);
  });
});

describe('contrato da BrasilAPI: participantes do Pix', () => {
  it('valida a amostra real, traduz os campos e ordena por nome', async () => {
    const r = await fetchPixParticipants(fakeFetch({ [SOURCES.pixParticipants]: pixFixture }));
    expect(r.data).toHaveLength(pixFixture.length);
    const names = r.data.map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    expect(new Set(r.data.map((p) => p.participation))).toEqual(new Set(['Direta', 'Indireta']));
    expect(r.data.every((p) => p.shortName.length > 0)).toBe(true);
  });
});

describe('contrato do BCB: informes SPI e STR', () => {
  it('monta a URL da lista certa para cada tipo', () => {
    const u = new URL(informesUrl('STR', 2025));
    expect(u.searchParams.get('guidLista')).toBe('acc99ae3-5bc8-417a-a505-c9818d4486a5');
    expect(u.searchParams.get('ano')).toBe('2025');
  });

  it.each(['SPI', 'STR'] as const)('%s: link absoluto para o PDF, tamanho em bytes e mais recente primeiro', async (tipo) => {
    const f = fakeFetch({ [SOURCES.bcbInformes]: informesFixture[tipo] });
    const list = await fetchInformes(tipo, 2026, f);
    expect(list).toHaveLength(6);
    // o BCB usa pastas diferentes (informesspi/ e informes_STR/); o que importa é o domínio e o arquivo
    expect(list[0].pdfUrl).toMatch(new RegExp(`^https://www\\.bcb\\.gov\\.br/content/estabilidadefinanceira/.+/Informe${tipo}-\\d{3}-2026\\.pdf$`));
    expect(list[0].title).toContain(tipo);
    expect(list.every((i) => i.tipo === tipo && (i.sizeBytes ?? 0) > 0)).toBe(true);
    expect(list.map((i) => i.referenceDate)).toEqual([...list.map((i) => i.referenceDate)].sort().reverse());
  });

  it('resposta fora do contrato vira erro claro', async () => {
    await expect(fetchInformes('SPI', 2026, fakeFetch({ [SOURCES.bcbInformes]: { conteudo: [{ Id: 'x' }] } }))).rejects.toThrow();
  });
});
