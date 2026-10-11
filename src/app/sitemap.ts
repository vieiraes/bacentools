import type { MetadataRoute } from 'next';
import { SITE, TOOLS } from '@/lib/tools';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE.url}/`, priority: 1 }, ...TOOLS.map((t) => ({ url: `${SITE.url}${t.path}`, priority: 0.8 }))];
}
