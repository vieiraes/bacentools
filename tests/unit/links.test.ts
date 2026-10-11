import { describe, expect, it } from 'vitest';
import { GRUPOS } from '@/lib/links';
import { FONTE_BRCODE } from '@/lib/brcode/brcode';

const todos = GRUPOS.flatMap((g) => g.links);

describe('links oficiais do Pix', () => {
  it('só apontam para o BCB (ou para o GitHub do BCB) e por HTTPS', () => {
    for (const l of todos) expect(l.url, l.titulo).toMatch(/^https:\/\/(www\.bcb\.gov\.br\/|github\.com\/bacen\/)/);
  });

  it('não há link repetido nem grupo vazio; ids de grupo servem de âncora', () => {
    const urls = todos.map((l) => l.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const g of GRUPOS) {
      expect(g.links.length, g.id).toBeGreaterThan(0);
      expect(g.id).toMatch(/^[a-z-]+$/);
    }
  });

  it('a versão do Manual de Padrões é a mesma usada pelo decodificador e pelo gerador', () => {
    const manual = todos.find((l) => l.url === FONTE_BRCODE.url);
    expect(manual?.versao).toBe(FONTE_BRCODE.versao);
  });

  it('o nome da norma vai codificado no endereço', () => {
    expect(todos.find((l) => l.titulo.startsWith('Regulamento Pix'))?.url).toBe('https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=1');
  });
});
