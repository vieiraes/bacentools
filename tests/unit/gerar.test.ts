import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { decodificarBrCode, EXEMPLOS } from '@/lib/brcode/brcode';
import { cnpjValido, cpfValido, gerarBrCode, normalizarChave, normalizarValor, semAcento } from '@/lib/brcode/gerar';

describe('gerador de BR Code estático', () => {
  it('reproduz byte a byte o exemplo oficial do manual (seção 2.6.3)', () => {
    const r = gerarBrCode({ chave: '123e4567-e12b-12d1-a456-426655440000', nome: 'Fulano de Tal', cidade: 'BRASILIA' });
    expect(r).toEqual({ ok: true, codigo: EXEMPLOS.estatico, chave: '123e4567-e12b-12d1-a456-426655440000', tipoChave: 'aleatoria', avisos: [] });
  });

  it('com valor, txid e informação adicional: o decodificador lê de volta os mesmos dados', () => {
    const r = gerarBrCode({ chave: 'ana@exemplo.com', nome: 'Ana', cidade: 'São Paulo', valor: '1.234,5', txid: 'PEDIDO123', infoAdicional: 'Mesa 4' });
    if (!r.ok) throw new Error();
    expect(r.avisos).toEqual(['Acentos e símbolos foram removidos do nome e da cidade.']);
    expect(decodificarBrCode(r.codigo).campos).toMatchObject({ chave: 'ana@exemplo.com', valor: '1234.50', txid: 'PEDIDO123', infoAdicional: 'Mesa 4', cidade: 'SAO PAULO' });
  });

  it('aponta cada campo inválido de uma vez', () => {
    expect(gerarBrCode({ chave: 'abc', nome: '', cidade: 'Santo Antônio do Descoberto', valor: '0', txid: 'pedido-1' })).toEqual({
      ok: false,
      erros: {
        chave: 'Use e-mail, CPF, CNPJ, celular com DDD ou chave aleatória',
        nome: 'Informe o nome de quem recebe',
        cidade: 'Até 15 caracteres (sem acentos: 27)',
        valor: 'Valor inválido (ex.: 10,50)',
        txid: 'Só letras e números, sem espaço, até 25 caracteres',
      },
    });
    expect(gerarBrCode({ chave: '', nome: 'A'.repeat(26), cidade: '', valor: '99999999999,99' }).ok).toBe(false);
  });

  it('valor-limite do nome (25) e da cidade (15)', () => {
    expect(gerarBrCode({ chave: 'a@b.co', nome: 'N'.repeat(25), cidade: 'C'.repeat(15) }).ok).toBe(true);
    expect(gerarBrCode({ chave: 'a@b.co', nome: 'N'.repeat(26), cidade: 'C'.repeat(15) })).toMatchObject({ ok: false, erros: { nome: 'Até 25 caracteres (sem acentos: 26)' } });
  });

  it('infoAdicional disputa espaço com a chave no ID 26 (seção 2.6.1)', () => {
    const chave = `${'a'.repeat(30)}@exemplo.com`; // 42: sobram 99 − 18 − 46 − 4 = 31
    expect(gerarBrCode({ chave, nome: 'A', cidade: 'B', infoAdicional: 'x'.repeat(31) }).ok).toBe(true);
    expect(gerarBrCode({ chave, nome: 'A', cidade: 'B', infoAdicional: 'x'.repeat(32) })).toMatchObject({ ok: false, erros: { infoAdicional: 'Com esta chave, cabem 31 caracteres (seção 2.6.1)' } });
    expect(gerarBrCode({ chave: `${'a'.repeat(66)}@exemplo.com`, nome: 'A', cidade: 'B' })).toMatchObject({ ok: false, erros: { chave: 'Chave com mais de 77 caracteres' } });
  });

  it('avisa quando o CPF ou o CNPJ têm dígito verificador errado, mas gera', () => {
    const r = gerarBrCode({ chave: '123.456.789-00', nome: 'A', cidade: 'B' });
    expect(r).toMatchObject({ ok: true, chave: '12345678900', tipoChave: 'cpf', avisos: ['Os dígitos verificadores do CPF não conferem: confira a chave.'] });
    expect(gerarBrCode({ chave: '12.ABC.345/01DE-34', nome: 'A', cidade: 'B' })).toMatchObject({ ok: true, avisos: ['Os dígitos verificadores do CNPJ não conferem: confira a chave.'] });
    expect(gerarBrCode({ chave: '12.ABC.345/01DE-35', nome: 'A', cidade: 'B' })).toMatchObject({ ok: true, avisos: [] });
  });

  it('propriedade: qualquer combinação válida gera um código que o decodificador aprova', () => {
    fc.assert(fc.property(
      fc.stringMatching(/^[a-z0-9]{1,20}@[a-z]{2,8}\.com$/),
      fc.stringMatching(/^[A-Za-z ]{1,25}$/).filter((s) => s.trim().length > 0),
      fc.stringMatching(/^[A-Za-z]{1,15}$/),
      fc.option(fc.integer({ min: 1, max: 99_999_999 }), { nil: undefined }),
      (chave, nome, cidade, centavos) => {
        const r = gerarBrCode({ chave, nome, cidade, valor: centavos ? (centavos / 100).toFixed(2) : undefined });
        expect(r.ok).toBe(true);
        if (r.ok) expect(decodificarBrCode(r.codigo).valido).toBe(true);
      }), { numRuns: 300 });
  });
});

describe('normalização', () => {
  it.each([
    ['  ana@ex.com ', 'ana@ex.com'],
    ['123.456.789-09', '12345678909'],
    ['12.abc.345/01de-35', '12ABC34501DE35'],
    ['(61) 91234-5678', '+5561912345678'],
    ['+55 61 91234-5678', '+5561912345678'],
    ['123E4567-E12B-12D1-A456-426655440000', '123e4567-e12b-12d1-a456-426655440000'],
    ['qualquer coisa', 'qualquer coisa'],
  ])('chave %s → %s', (e, s) => expect(normalizarChave(e)).toBe(s));

  it.each([
    ['10', '10.00'], ['10,5', '10.50'], ['R$ 1.234,56', '1234.56'], ['1234.5', '1234.50'], ['1,234.50', '1234.50'],
    ['', undefined], [undefined, undefined], ['abc', null], ['-5', null], ['0,00', null], ['10,555', null],
  ])('valor %s → %s', (e, s) => expect(normalizarValor(e)).toBe(s));

  it('sem acento', () => expect(semAcento('  Conceição   do Araguaia! ')).toBe('Conceicao do Araguaia'));

  it('CPF e CNPJ (numérico e alfanumérico)', () => {
    expect(cpfValido('12345678909')).toBe(true);
    expect(cpfValido('11111111111')).toBe(false);
    expect(cpfValido('123')).toBe(false);
    expect(cnpjValido('00038166000105')).toBe(true);
    expect(cnpjValido('12ABC34501DE35')).toBe(true);
    expect(cnpjValido('00000000000000')).toBe(false);
    expect(cnpjValido('12ABC34501DE3A')).toBe(false);
  });
});
