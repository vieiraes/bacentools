import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { InformesView } from './InformesView';

const tool = TOOLS.find((t) => t.path === '/informes/')!;
export const metadata: Metadata = { title: 'Informes SPI e STR do Banco Central', description: tool.description };

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <InformesView />
    </>
  );
}
