import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { ErrosSpbView } from './ErrosSpbView';

const tool = TOOLS.find((t) => t.path === '/spb/erros/')!;
export const metadata: Metadata = {
  title: 'Códigos de erro do STR e do SITRAF (ESTR, EGEN, EPAG) da TED',
  description: tool.description,
  alternates: { canonical: tool.path },
};

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <ErrosSpbView />
    </>
  );
}
