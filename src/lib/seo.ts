// Cabeçalho de SEO de cada página: título, descrição, canonical, Open Graph e cartão do X/LinkedIn.
// No Next, o `openGraph` de uma página substitui o do layout inteiro; por isso toda página monta o seu por aqui,
// senão herda o og:url da página inicial e fica sem imagem de prévia.
import type { Metadata } from 'next';
import { CRIADOR, SITE, type Tool } from './tools';

export const DESCRICAO_SITE =
  'Códigos de erro do Pix, gerador e decodificador de QR Code Pix, bancos por ISPB, simulador do DICT e a TED do SPB campo a campo. Grátis, sem cadastro.';

export const IMAGEM_PREVIA ={ url: '/og-bacentools.png', width: 1200, height: 630, alt: `${SITE.name}: ${SITE.tagline}` };

export function metaPagina({ path, title, description, ogTitle }: { path: string; title: string; description: string; ogTitle?: string }): Metadata {
  const t = ogTitle ?? title;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: SITE.name, locale: 'pt_BR', url: `${SITE.url}${path}`, title: t, description, images: [IMAGEM_PREVIA] },
    twitter: { card: 'summary_large_image', title: t, description, images: [IMAGEM_PREVIA.url] },
  };
}

/** Página de ferramenta: o título de busca é da página; a descrição vem do registro em tools.ts. */
export const metaFerramenta = (tool: Tool, title: string) => metaPagina({ path: tool.path, title, description: tool.description });

const AUTOR = { '@type': 'Person', name: CRIADOR.nome, url: `${SITE.url}/sobre/` };

/** Dados estruturados da página inicial (schema.org): o site e quem o mantém. */
export const jsonLdSite = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: `${SITE.url}/`,
  description: DESCRICAO_SITE,
  inLanguage: 'pt-BR',
  image: `${SITE.url}${IMAGEM_PREVIA.url}`,
  publisher: AUTOR,
});

/** Cada ferramenta como aplicativo web gratuito, para o resultado de busca mostrar "Grátis". */
export const jsonLdFerramenta = (tool: Tool) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: tool.title,
  url: `${SITE.url}${tool.path}`,
  description: tool.description,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  inLanguage: 'pt-BR',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
  author: AUTOR,
});
