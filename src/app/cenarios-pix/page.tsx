import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { CenariosView } from './CenariosView';

const tool = TOOLS.find((t) => t.path === '/cenarios-pix/')!;
export const metadata: Metadata = { title: 'Cenários e códigos de erro do Pix (pacs.002, pacs.004, DICT)', description: tool.description };

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <CenariosView />
    </>
  );
}
