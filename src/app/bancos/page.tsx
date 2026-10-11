import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { BanksView } from './BanksView';

const tool = TOOLS.find((t) => t.path === '/bancos/')!;
export const metadata: Metadata = { title: 'Bancos por ISPB e código COMPE', description: tool.description };

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <BanksView />
    </>
  );
}
