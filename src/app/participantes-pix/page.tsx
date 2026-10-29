import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { PixParticipantsView } from './PixParticipantsView';

const tool = TOOLS.find((t) => t.path === '/participantes-pix/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Participantes do Pix');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <PixParticipantsView />
    </>
  );
}
