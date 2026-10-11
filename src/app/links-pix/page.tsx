import type { Metadata } from 'next';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/PageHeader';
import { GRUPOS, LINKS_CONFERIDOS_EM } from '@/lib/links';
import { TOOLS } from '@/lib/tools';

const tool = TOOLS.find((t) => t.path === '/links-pix/')!;
export const metadata: Metadata = {
  title: 'Links oficiais do Pix: regulamento, manuais, API e normas do BCB',
  description: tool.description,
  alternates: { canonical: tool.path },
};

const ROTULO = { pdf: 'PDF', zip: 'ZIP', pagina: 'Página', norma: 'Norma', codigo: 'GitHub' } as const;
const dataBr = (iso: string) => iso.split('-').reverse().join('/');

export default function Page() {
  return (
    <>
      <PageHeader tool={tool}>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Todos os links foram abertos e conferidos em {dataBr(LINKS_CONFERIDOS_EM)}. Achou um quebrado?{' '}
          <Link href="https://github.com/vieiraes/bacentools/issues/new/choose">Avise no GitHub</Link>.
        </Typography>
      </PageHeader>
      <Stack spacing={3}>
        {GRUPOS.map((g) => (
          <Card key={g.id} component="section" id={g.id} aria-labelledby={`${g.id}-titulo`}>
            <CardContent>
              <Typography variant="h2" id={`${g.id}-titulo`}>{g.titulo}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>{g.descricao}</Typography>
              <List disablePadding sx={{ mt: 1 }}>
                {g.links.map((l) => (
                  <ListItem key={l.url} disableGutters divider sx={{ display: 'block', py: 1.25 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link href={l.url} target="_blank" rel="noopener" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{l.titulo}</Link>
                      <Chip size="small" variant="outlined" label={ROTULO[l.tipo]} />
                      {l.versao && <Chip size="small" color="primary" variant="outlined" label={`versão ${l.versao}`} />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{l.descricao}</Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  );
}
