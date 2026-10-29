import type { Metadata } from 'next';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ContactLinks } from '@/components/ContactLinks';
import { JsonLd } from '@/components/JsonLd';
import { LeadForm } from '@/components/LeadForm';
import { CRIADOR, SITE } from '@/lib/tools';
import { metaPagina } from '@/lib/seo';

export const metadata: Metadata = metaPagina({
  path: '/sobre/',
  title: 'Sobre e contato',
  description: `Quem criou o ${SITE.name}: ${CRIADOR.nome}, ${CRIADOR.papel}. Consultoria de QA para Pix, homologação no BCB e automação de testes.`,
});

const SERVICOS = [
  { titulo: 'Testes de Pix de ponta a ponta', texto: 'Cenários de SPI e DICT (pacs.008, pacs.002, devoluções, limites de consulta), com os códigos de erro do Catálogo de Mensagens do BCB.' },
  { titulo: 'Preparação para homologação', texto: 'Roteiro de testes, massa de dados e evidências para a homologação do Pix e dos serviços do Banco Central.' },
  { titulo: 'Automação E2E', texto: 'Playwright com TypeScript, Page Object, rede simulada, acessibilidade (axe) e CI no GitHub Actions, como neste projeto.' },
  { titulo: 'Testes de carga', texto: 'K6 para APIs de pagamento: cash-in e cash-out Pix, saldos e picos de uso, com métricas e relatório.' },
];

export default function Page() {
  return (
    <Stack spacing={3}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Person', name: CRIADOR.nome, jobTitle: CRIADOR.papel, url: `${SITE.url}/sobre/`, sameAs: [CRIADOR.github] }} />
      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h1">Sobre o {SITE.name}</Typography>
        <Typography sx={{ mt: 2, maxWidth: '75ch' }}>
          O {SITE.name} foi criado e é mantido por <strong>{CRIADOR.nome}</strong>, {CRIADOR.papel}. Nasceu da rotina de quem testa
          produtos de Pix: procurar o ISPB de um banco, o significado de um <code>AC06</code> ou o motivo de um <code>429</code> no DICT.
          Tudo aqui tem fonte oficial do Banco Central, e o código é aberto (Apache 2.0).
        </Typography>
        <Box sx={{ mt: 2 }}><ContactLinks /></Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h2" component="h2">Precisa de QA para pagamentos?</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>Atendo instituições de pagamento, fintechs e times de produto que estão lançando ou evoluindo o Pix.</Typography>
        <Grid container spacing={2}>
          {SERVICOS.map((s) => (
            <Grid key={s.titulo} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, height: '100%' }}>
                <Typography variant="h3" component="h3" sx={{ fontSize: '1.05rem', fontWeight: 700 }}>{s.titulo}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{s.texto}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
          {['Pix', 'SPI', 'DICT', 'Playwright', 'K6', 'API', 'Acessibilidade'].map((t) => <Chip key={t} label={t} size="small" />)}
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 4 } }} id="contato">
        <Typography variant="h2" component="h2" sx={{ mb: 2 }}>Fale comigo</Typography>
        <LeadForm tipo="contato" origem="sobre" />
      </Paper>
    </Stack>
  );
}
