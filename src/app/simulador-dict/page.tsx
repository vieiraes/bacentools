import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { SimulatorView } from '@/features/simulador/SimulatorView';

const tool = TOOLS.find((t) => t.path === '/simulador-dict/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Simulador de fichas do DICT (token bucket do Pix)');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <SimulatorView />
    </>
  );
}
