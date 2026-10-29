import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { InformesView } from './InformesView';

const tool = TOOLS.find((t) => t.path === '/informes/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Informes SPI e STR do Banco Central');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <InformesView />
    </>
  );
}
