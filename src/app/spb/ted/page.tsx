import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { TedView } from './TedView';

const tool = TOOLS.find((t) => t.path === '/spb/ted/')!;
export const metadata: Metadata = {
  title: 'Como funciona a TED: STR0008, R1, R2, fila, agendamento, erro e devolução animados',
  description: tool.description,
  alternates: { canonical: tool.path },
};

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <TedView />
    </>
  );
}
