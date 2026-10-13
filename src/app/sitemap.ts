import type { MetadataRoute } from 'next';
import { SITE, TOOLS } from '@/lib/tools';
import { ERROS, slugDe } from '@/lib/pix-erros/catalogo';
import { ERROS_SPB } from '@/lib/spb/catalogo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, priority: 1 },
    ...TOOLS.map((t) => ({ url: `${SITE.url}${t.path}`, priority: 0.8 })),
    { url: `${SITE.url}/erros-pix/`, priority: 0.8 },
    ...ERROS.map((e) => ({ url: `${SITE.url}/erros-pix/${slugDe(e)}/`, priority: 0.6 })),
    ...ERROS_SPB.map((e) => ({ url: `${SITE.url}/spb/erros/${e.codigo.toLowerCase()}/`, priority: 0.4 })),
    { url: `${SITE.url}/sobre/`, priority: 0.5 },
    { url: `${SITE.url}/privacidade/`, priority: 0.2 },
  ];
}
