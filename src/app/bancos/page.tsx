import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { BanksView } from './BanksView';

const tool = TOOLS.find((t) => t.path === '/bancos/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Bancos por ISPB e código COMPE');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <BanksView />
    </>
  );
}
