import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { MensagensView } from './MensagensView';

const tool = TOOLS.find((t) => t.path === '/spb/mensagens/')!;
export const metadata: Metadata = {
  title: 'Mensagens da TED: STR0008, STR0010, PAG0108 e PAG0111 campo a campo',
  description: tool.description,
  alternates: { canonical: tool.path },
};

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <MensagensView />
    </>
  );
}
