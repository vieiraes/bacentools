// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DESCRICAO_SITE, IMAGEM_PREVIA, jsonLdFerramenta, jsonLdSite, metaFerramenta, metaPagina } from '@/lib/seo';
import { SITE, TOOLS } from '@/lib/tools';

describe('SEO', () => {
  it('cada página tem canonical, og:url próprio e imagem de prévia 1200x630', () => {
    const m = metaPagina({ path: '/erros-pix/ac06/', title: 'AC06 no Pix', description: 'Conta bloqueada', ogTitle: 'AC06 no Pix: conta bloqueada' });
    expect(m.alternates).toEqual({ canonical: '/erros-pix/ac06/' });
    expect(m.openGraph).toMatchObject({ url: `${SITE.url}/erros-pix/ac06/`, title: 'AC06 no Pix: conta bloqueada', description: 'Conta bloqueada', locale: 'pt_BR' });
    expect(m.openGraph?.images).toEqual([{ url: '/og-bacentools.png', width: 1200, height: 630, alt: IMAGEM_PREVIA.alt }]);
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', title: 'AC06 no Pix: conta bloqueada' });
  });

  it('sem ogTitle, a prévia usa o título da página', () => {
    expect(metaPagina({ path: '/sobre/', title: 'Sobre', description: 'x' }).openGraph).toMatchObject({ title: 'Sobre' });
  });

  it('página de ferramenta usa o caminho e a descrição do registro', () => {
    const t = TOOLS[0];
    const m = metaFerramenta(t, 'Título de busca');
    expect(m).toMatchObject({ title: 'Título de busca', description: t.description, alternates: { canonical: t.path } });
  });

  it('descrição do site cabe no resultado de busca (até 160 caracteres)', () => {
    expect(DESCRICAO_SITE.length).toBeLessThanOrEqual(160);
  });

  it('dados estruturados: site e ferramentas gratuitas com URL absoluta', () => {
    expect(jsonLdSite()).toMatchObject({ '@type': 'WebSite', url: `${SITE.url}/`, image: `${SITE.url}/og-bacentools.png` });
    for (const t of TOOLS) {
      expect(jsonLdFerramenta(t)).toMatchObject({ '@type': 'WebApplication', url: `${SITE.url}${t.path}`, isAccessibleForFree: true, offers: { price: '0' } });
    }
  });
});
