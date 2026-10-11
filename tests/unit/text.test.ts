import { describe, expect, it } from 'vitest';
import { formatBytes, formatCompe, formatIspb, matches, normalize, plural } from '@/lib/domain/text';

describe('busca sem acento', () => {
  it.each([
    ['São Paulo', 'sao paulo'], ['  CAIXA   ECONÔMICA ', 'caixa economica'], [null, ''], [undefined, ''],
  ])('normalize(%j) = %j', (input, out) => expect(normalize(input)).toBe(out));

  it('todas as palavras precisam aparecer, em qualquer ordem e em qualquer campo', () => {
    expect(matches('economica caixa', 'CAIXA ECONOMICA FEDERAL')).toBe(true);
    expect(matches('caixa 104', 'CAIXA ECONOMICA FEDERAL', 104)).toBe(true);
    expect(matches('caixa itau', 'CAIXA ECONOMICA FEDERAL')).toBe(false);
    expect(matches('', 'qualquer')).toBe(true);
    expect(matches('00360305', '00360305', null)).toBe(true);
  });
});

describe('formatação', () => {
  it.each([[360305, '00360305'], ['360305', '00360305'], ['00.000.000', '00000000']])('ISPB %j → %s', (i, o) => expect(formatIspb(i)).toBe(o));
  it.each([[1, '001'], [104, '104'], [null, null], [undefined, null]])('COMPE %j → %j', (i, o) => expect(formatCompe(i)).toBe(o));
  it.each([[257_527, '251 KB'], [3_145_728, '3.0 MB']])('%i bytes → %s', (n, o) => expect(formatBytes(n)).toBe(o));
});

describe('plural', () => {
  it.each([[0, '0 instituições'], [1, '1 instituição'], [2, '2 instituições'], [1234, '1.234 instituições']])('%i → %s', (n, o) =>
    expect(plural(n, 'instituição', 'instituições')).toBe(o));
});
