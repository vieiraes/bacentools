import type { MetadataRoute } from 'next';
import { SITE, TOOLS } from '@/lib/tools';
import { ERROS, slugDe } from '@/lib/pix-erros/catalogo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, priority: 1 },
    ...TOOLS.map((t) => ({ url: `${SITE.url}${t.path}`, priority: 0.8 })),
    { url: `${SITE.url}/erros-pix/`, priority: 0.8 },
    ...ERROS.map((e) => ({ url: `${SITE.url}/erros-pix/${slugDe(e)}/`, priority: 0.6 })),
    { url: `${SITE.url}/privacidade/`, priority: 0.2 },
  ];
}
