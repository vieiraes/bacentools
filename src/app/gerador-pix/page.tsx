import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { GeradorView } from './GeradorView';

const tool = TOOLS.find((t) => t.path === '/gerador-pix/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Gerador de QR Code Pix estático e Pix Copia e Cola');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <GeradorView />
    </>
  );
}
