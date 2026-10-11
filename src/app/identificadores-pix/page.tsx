import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { IdentificadoresView } from './IdentificadoresView';

const tool = TOOLS.find((t) => t.path === '/identificadores-pix/')!;
export const metadata: Metadata = {
  title: 'Decodificador de EndToEndId do Pix (E2E ID), RtrId e UUID v7',
  description: tool.description,
  alternates: { canonical: tool.path },
};

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <IdentificadoresView />
    </>
  );
}
