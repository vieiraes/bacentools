import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { DominiosView } from './DominiosView';

const tool = TOOLS.find((t) => t.path === '/spb/dominios/')!;
export const metadata: Metadata = {
  title: 'Finalidades da TED (FinlddCli), códigos de devolução e situação no STR',
  description: tool.description,
  alternates: { canonical: tool.path },
};

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <DominiosView />
    </>
  );
}
