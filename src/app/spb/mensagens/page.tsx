import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { MensagensView } from './MensagensView';

const tool = TOOLS.find((t) => t.path === '/spb/mensagens/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Mensagens da TED: STR0008, STR0010, PAG0108 e PAG0111 campo a campo');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <MensagensView />
    </>
  );
}
