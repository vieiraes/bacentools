import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/tools';

export const dynamic = 'force-static';

// Nome, cor e ícones do site ao salvar na tela inicial. Sem service worker: o site não funciona offline de propósito.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.tagline,
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f7fb',
    theme_color: '#0b4f9c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
