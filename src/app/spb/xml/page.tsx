import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { XmlView } from './XmlView';

const tool = TOOLS.find((t) => t.path === '/spb/xml/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Montar e validar XML da TED (STR0008, STR0010) contra o XSD do BCB');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <XmlView />
    </>
  );
}
