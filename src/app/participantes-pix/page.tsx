import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/tools';
import { PixParticipantsView } from './PixParticipantsView';

const tool = TOOLS.find((t) => t.path === '/participantes-pix/')!;
export const metadata: Metadata = { title: 'Participantes do Pix', description: tool.description };

export default function Page() {
  return (
    <>
      <PageHeader tool={tool} />
      <PixParticipantsView />
    </>
  );
}
