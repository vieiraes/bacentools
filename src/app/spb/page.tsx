import type { Metadata } from 'next';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MuiLink from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/PageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { HorarioTed } from '@/features/spb/HorarioTed';
import { EVENTOS, FONTES_SPB } from '@/lib/spb/catalogo';
import { TOOLS, secaoDe } from '@/lib/tools';
import { metaFerramenta } from '@/lib/seo';

const tool = TOOLS.find((t) => t.path === '/spb/')!;
const outras = TOOLS.filter((t) => secaoDe(t) === 'spb' && t.path !== '/spb/');
const dataBr = (iso: string) => iso.split('-').reverse().join('/');

export const metadata: Metadata = metaFerramenta(tool, 'SPB e TED: horário da TED, mensagens STR0008 e PAG0108');

export default function Page() {
  const ted = EVENTOS.filter((e) => e.papel === 'ted');
  const dev = EVENTOS.filter((e) => e.papel === 'devolucao');
  return (
    <>
      <PageHeader tool={tool} />
      <Stack spacing={3}>
        <Alert severity="info" data-testid="spb-versao">
          Dados do <strong>Catálogo de Serviços do SFN {FONTES_SPB.versao}</strong>, em produção a partir de {dataBr(FONTES_SPB.producao)}.
          {FONTES_SPB.tedIgualNaVersaoAnterior && ` As mensagens da TED são iguais às da versão ${FONTES_SPB.versaoAnterior}, que está em produção até lá.`}{' '}
          O grupo Split (CBS e IBS da reforma tributária) entrou na versão {FONTES_SPB.split.versao}, em produção desde {dataBr(FONTES_SPB.split.producao)}.
        </Alert>

        <Paper sx={{ p: { xs: 2, md: 3 } }} component="section" aria-labelledby="o-que-e">
          <Typography id="o-que-e" variant="h2" sx={{ mb: 1 }}>O que é</Typography>
          <Typography sx={{ mb: 1.5, maxWidth: '80ch' }}>
            O <strong>SPB</strong> (Sistema de Pagamentos Brasileiro) reúne as infraestruturas do mercado financeiro e os arranjos de pagamento,
            como o Pix. O <strong>STR</strong> (Sistema de Transferência de Reservas), nas palavras do Banco Central, é o coração do SPB, onde
            ocorre a liquidação final das obrigações financeiras: liquida transação por transação, em tempo real (LBTR), de forma irrevogável
            (só se desfaz com outra transação no sentido contrário) e sem admitir saldo negativo. É regulamentado pela Resolução BCB nº 105/2021.
          </Typography>
          <Typography sx={{ mb: 1.5, maxWidth: '80ch' }}>
            A <strong>TED</strong> é a transferência entre contas de clientes de instituições diferentes. No catálogo ela aparece como{' '}
            {ted.map((e, i) => (
              <span key={e.codigo}>{i > 0 && ' e '}<strong>{e.codigo}</strong> (“{e.titulo}”, liquidada no {e.grupo === 'STR' ? 'STR do Banco Central' : 'SITRAF, da Núclea'})</span>
            ))}
            . A devolução de uma TED indevida usa {dev.map((e) => e.codigo).join(' ou ')}.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fontes: <MuiLink href="https://www.bcb.gov.br/estabilidadefinanceira/spb">página do SPB</MuiLink> e{' '}
            <MuiLink href="https://www.bcb.gov.br/estabilidadefinanceira/str">página do STR</MuiLink> do Banco Central;{' '}
            <MuiLink href={FONTES_SPB.catalogo[FONTES_SPB.versao].volumes.I}>Catálogo de Serviços do SFN {FONTES_SPB.versao}, volumes I e II</MuiLink>.
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 3 } }} component="section" aria-labelledby="horario">
          <Typography id="horario" variant="h2" sx={{ mb: 1.5 }}>Horário da TED</Typography>
          <HorarioTed />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Fonte: <MuiLink href={FONTES_SPB.grade.url}>{FONTES_SPB.grade.titulo}</MuiLink> (Banco Central, planilha lida em {dataBr(FONTES_SPB.geradoEm)}).
          </Typography>
        </Paper>

        {outras.length > 0 && (
          <section aria-labelledby="ferramentas-spb">
            <Typography id="ferramentas-spb" variant="h2" sx={{ mb: 1.5 }}>Ferramentas do SPB</Typography>
            <Grid container spacing={2} component="nav" aria-label="Ferramentas do SPB">
              {outras.map((t) => (
                <Grid key={t.path} size={{ xs: 12, sm: 6 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardActionArea component={Link} href={t.path} sx={{ height: '100%', alignItems: 'flex-start' }}>
                      <CardContent>
                        <Typography variant="h3" component="p" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.15rem', fontWeight: 700 }}>
                          <ToolIcon icon={t.icon} color="primary" />
                          {t.title}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>{t.description}</Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </section>
        )}
      </Stack>
    </>
  );
}
