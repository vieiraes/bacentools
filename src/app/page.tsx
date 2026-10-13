import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { LeadForm } from '@/components/LeadForm';
import { ToolIcon } from '@/components/ToolIcon';
import { SITE, TOOLS, secaoDe, type Tool } from '@/lib/tools';

const PIX = TOOLS.filter((t) => secaoDe(t) === 'pix');
const SPB = TOOLS.filter((t) => secaoDe(t) === 'spb');

function Cartoes({ tools, label }: { tools: Tool[]; label: string }) {
  return (
    <Grid container spacing={2} component="nav" aria-label={label}>
      {tools.map((t) => (
        <Grid key={t.path} size={{ xs: 12, sm: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea component={Link} href={t.path} sx={{ height: '100%', alignItems: 'flex-start' }}>
              <CardContent>
                <Typography variant="h3" component="p" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.25rem', fontWeight: 700 }}>
                  <ToolIcon icon={t.icon} color="primary" />
                  {t.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>{t.description}</Typography>
                <Chip size="small" label={`Fonte: ${t.source}`} sx={{ mt: 2 }} />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default function Home() {
  return (
    <>
      <Box component="section" sx={{ mb: 4 }}>
        <Typography variant="h1">{SITE.name}</Typography>
        <Typography variant="h2" component="p" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>{SITE.tagline}</Typography>
        <Typography sx={{ mt: 2, maxWidth: '70ch' }}>
          Consultas rápidas do dia a dia de quem trabalha com Pix e com o sistema financeiro: de quem é um ISPB, quem participa do Pix,
          o que o BCB publicou nos informes do SPI e do STR, e como funciona o limite de consultas do DICT. Tudo de graça e sem cadastro.
        </Typography>
      </Box>

      <Box component="section" aria-labelledby="secao-pix">
        <Typography id="secao-pix" variant="h2" sx={{ mb: 1.5 }}>Pix</Typography>
        <Cartoes tools={PIX} label="Ferramentas do Pix" />
      </Box>

      <Box component="section" aria-labelledby="secao-spb" sx={{ mt: 5 }}>
        <Typography id="secao-spb" variant="h2">SPB e TED</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 1.5, maxWidth: '70ch' }}>
          O Sistema de Pagamentos Brasileiro por trás da TED: mensagens do STR, horários, contratos XML e códigos de erro, direto do
          Catálogo de Serviços do SFN.
        </Typography>
        <Cartoes tools={SPB} label="Ferramentas do SPB" />
      </Box>

      <Paper component="section" aria-labelledby="newsletter" sx={{ mt: 4, p: { xs: 2, md: 3 } }}>
        <Typography id="newsletter" variant="h2">Mudou no Pix</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 2, maxWidth: '70ch' }}>
          Um e-mail curto quando o Banco Central mudar o Pix: versão nova do catálogo de erros, regulamento, informes do SPI e ferramentas
          novas aqui no {SITE.name}. Sem spam.
        </Typography>
        <LeadForm tipo="newsletter" origem="inicio" />
      </Paper>
    </>
  );
}
