import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { DecodificadorView } from './DecodificadorView';

const tool = TOOLS.find((t) => t.path === '/decodificador-pix/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Decodificador e validador de QR Code Pix (BR Code, Copia e Cola)');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <DecodificadorView />
    </>
  );
}
