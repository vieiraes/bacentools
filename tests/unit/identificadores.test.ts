import { describe, expect, it } from 'vitest';
import { dataUtc, decodificarId } from '@/lib/identificadores';

describe('EndToEndId e RtrId (Catálogo SPI 5.13.2)', () => {
  it('EndToEndId válido: agente, data em UTC e em Brasília, sequencial', () => {
    const r = decodificarId(' E00038166202610111430abcDEF12345 ');
    expect(r).toMatchObject({ tipo: 'endtoend', valido: true, ispb: '00038166', erros: [] });
    if (r.tipo !== 'endtoend') throw new Error();
    expect(r.data?.toISOString()).toBe('2026-10-11T14:30:00.000Z');
    expect(r.campos.find((c) => c.rotulo === 'Horário de Brasília')?.valor).toBe('11/10/2026, 11:30:00');
    expect(r.campos.find((c) => c.rotulo === 'Sequencial')?.valor).toBe('abcDEF12345');
  });

  it('RtrId de devolução começa com D; agente pode ser raiz de CNPJ alfanumérica', () => {
    expect(decodificarId('D12ABC345202601010000k0000000001')).toMatchObject({ tipo: 'devolucao', valido: true, ispb: '12ABC345' });
  });

  it('aponta cada parte errada: minúscula no início, data impossível, sequencial curto, tamanho', () => {
    const r = decodificarId('e00038166202602301430abc');
    expect(r.valido).toBe(false);
    expect(r.erros).toEqual([
      'Tem 24 caracteres; o formato exige 32',
      'A primeira letra deve ser "E" maiúscula (o campo diferencia maiúsculas)',
      'Data "202602301430" não existe no formato yyyyMMddHHmm',
      'Sequencial "abc": deve ter 11 letras ou dígitos',
    ]);
    expect(decodificarId('E0003816a202610111430abcDEF12345').erros[0]).toMatch(/Agente "0003816a"/);
  });

  it('dataUtc recusa datas que não existem', () => {
    expect(dataUtc('202602291200')).toBeNull(); // 2026 não é bissexto
    expect(dataUtc('202410112460')).toBeNull();
    expect(dataUtc('2024')).toBeNull();
    expect(dataUtc('202402291200')?.toISOString()).toBe('2024-02-29T12:00:00.000Z');
  });
});

describe('UUID (RFC 9562)', () => {
  it('v7: extrai a data embutida', () => {
    const r = decodificarId('019DD3A0-2B40-7000-8000-000000000000');
    expect(r).toMatchObject({ tipo: 'uuid', valido: true, versao: 7 });
    if (r.tipo !== 'uuid') throw new Error();
    expect(r.data?.toISOString()).toBe(new Date(0x019dd3a02b40).toISOString());
    expect(r.campos[0].valor).toBe('019dd3a0-2b40-7000-8000-000000000000');
  });

  it('v4 sem hífens é reconhecido; variante errada e versão inexistente são apontadas', () => {
    expect(decodificarId('9f1c1e8a3c2b4d5e9f0a1b2c3d4e5f60')).toMatchObject({ tipo: 'uuid', versao: 4, valido: true });
    expect(decodificarId('9f1c1e8a-3c2b-4d5e-cf0a-1b2c3d4e5f60').erros[0]).toMatch(/Variante "c"/);
    expect(decodificarId('9f1c1e8a-3c2b-0d5e-8f0a-1b2c3d4e5f60').erros[0]).toMatch(/Versão 0/);
  });

  it('texto que não é identificador', () => {
    expect(decodificarId('olá')).toMatchObject({ tipo: 'desconhecido', valido: false });
  });
});
