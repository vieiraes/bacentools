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
import { SITE, TOOLS } from '@/lib/tools';

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

      <Grid container spacing={2} component="nav" aria-label="Ferramentas">
        {TOOLS.map((t) => (
          <Grid key={t.path} size={{ xs: 12, sm: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea component={Link} href={t.path} sx={{ height: '100%', alignItems: 'flex-start' }}>
                <CardContent>
                  <Typography variant="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
