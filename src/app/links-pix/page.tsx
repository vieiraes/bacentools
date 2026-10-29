import type { Metadata } from 'next';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/PageHeader';
import { GRUPOS, LINKS_CONFERIDOS_EM } from '@/lib/links';
import { TOOLS } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';
import { ListaLinks } from '@/components/links/ListaLinks';
import { ResumoStatus } from '@/components/links/StatusLinks';

const tool = TOOLS.find((t) => t.path === '/links-pix/')!;
export const metadata: Metadata = metaFerramenta(tool, 'Links oficiais do Pix: regulamento, manuais, API e normas do BCB');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool}>
        <ResumoStatus revisadoEm={LINKS_CONFERIDOS_EM} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Achou um link quebrado ou uma versão nova? <Link href="https://github.com/vieiraes/bacentools/issues/new/choose">Avise no GitHub</Link>.
        </Typography>
      </PageHeader>
      <ListaLinks grupos={GRUPOS} />
    </>
  );
}
