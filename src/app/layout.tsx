import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { AppShell } from '@/components/layout/AppShell';
import { SITE } from '@/lib/tools';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: 'Bancos por ISPB e COMPE, participantes do Pix, informes SPI e STR e simulador de fichas do DICT. Grátis, sem cadastro.',
  openGraph: { type: 'website', siteName: SITE.name, locale: 'pt_BR', url: SITE.url },
  verification: { google: 'uszu0oNe5kKCBR-dx1L0QB737bByJF_7fTmC0Yyu8bc' },
};

export const viewport: Viewport = { themeColor: '#0b4f9c' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
