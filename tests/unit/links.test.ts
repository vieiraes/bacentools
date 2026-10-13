import { describe, expect, it } from 'vitest';
import { GRUPOS } from '@/lib/links';
import { FONTE_BRCODE } from '@/lib/brcode/brcode';
import { GRUPOS_SPB } from '@/lib/links-spb';
import { FONTES_SPB } from '@/lib/spb/catalogo';

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

describe('links oficiais do SPB', () => {
  const spb = GRUPOS_SPB.flatMap((g) => g.links);

  it('só BCB e Tesouro Nacional, por HTTPS, sem repetir', () => {
    for (const l of spb) expect(l.url, l.titulo).toMatch(/^https:\/\/(www\.bcb\.gov\.br\/|www\.gov\.br\/tesouronacional\/)/);
    expect(new Set(spb.map((l) => l.url)).size).toBe(spb.length);
  });

  it('as versões do catálogo, dos domínios, dos erros e da grade são as mesmas dos dados gerados', () => {
    const urls = spb.map((l) => l.url);
    const cat = FONTES_SPB.catalogo[FONTES_SPB.versao];
    for (const u of [cat.xsd, cat.volumes.I, cat.volumes.II, cat.volumes.IV, FONTES_SPB.dominios.url, FONTES_SPB.erros.url, FONTES_SPB.grade.url, FONTES_SPB.paginaCatalogos]) {
      expect(urls, u).toContain(u);
    }
  });
});
