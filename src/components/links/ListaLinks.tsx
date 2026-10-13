import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { GrupoLinks } from '@/lib/links';
import { MarcaQuebrado } from './StatusLinks';

const ROTULO = { pdf: 'PDF', zip: 'ZIP', xls: 'Planilha', pagina: 'Página', norma: 'Norma', codigo: 'GitHub' } as const;

/** Grupos de links oficiais (páginas de links do Pix e do SPB), com a marca da verificação semanal. */
export function ListaLinks({ grupos }: { grupos: GrupoLinks[] }) {
  return (
    <Stack spacing={3}>
      {grupos.map((g) => (
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
                    <MarcaQuebrado url={l.url} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{l.descricao}</Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
