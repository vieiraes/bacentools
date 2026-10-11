import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ERROS, ORIGEM_LABEL, TIPO_LABEL, erroPorSlug, resumo, slugDe } from '@/lib/pix-erros/catalogo';
import { JsonLd } from '@/components/JsonLd';
import { SITE } from '@/lib/tools';

export const dynamicParams = false;
export function generateStaticParams() {
  return ERROS.map((e) => ({ slug: slugDe(e) }));
}

type Props = { params: Promise<{ slug: string }> };

const tituloDe = (codigo: string, r: string) => `${codigo} no Pix: ${r.charAt(0).toLowerCase()}${r.slice(1)}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = erroPorSlug((await params).slug);
  if (!e) return {};
  const r = resumo(e);
  return {
    title: tituloDe(e.codigo, r).slice(0, 90),
    description: `${e.codigo} (${e.mensagemCurta}): ${r}. Quem gera: ${ORIGEM_LABEL[e.origem]}. Significado oficial do Banco Central e o que fazer.`.slice(0, 160),
    alternates: { canonical: `/erros-pix/${slugDe(e)}/` },
    openGraph: { title: tituloDe(e.codigo, r), url: `${SITE.url}/erros-pix/${slugDe(e)}/` },
  };
}

export default async function Page({ params }: Props) {
  const e = erroPorSlug((await params).slug);
  if (!e) notFound();
  const r = resumo(e);
  const url = `${SITE.url}/erros-pix/${slugDe(e)}/`;
  const relacionados = ERROS.filter((x) => x.id !== e.id && x.tipo === e.tipo && x.origem === e.origem).slice(0, 6);
  const faq = [
    { q: `O que significa o código ${e.codigo} no Pix?`, a: `${r}. É um ${TIPO_LABEL[e.tipo].toLowerCase()}, definido pelo Banco Central em ${e.fonte.titulo} (versão ${e.fonte.versao}).` },
    { q: `Quem gera o ${e.codigo}?`, a: `${ORIGEM_LABEL[e.origem]}. Aparece em: ${e.mensagem}.` },
    ...(e.acaoRecomendada ? [{ q: `O que o app deve mostrar ao usuário no ${e.codigo}?`, a: e.acaoRecomendada }] : []),
  ];

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BacenTools', item: `${SITE.url}/` },
          { '@type': 'ListItem', position: 2, name: 'Códigos de erro do Pix', item: `${SITE.url}/erros-pix/` },
          { '@type': 'ListItem', position: 3, name: e.codigo, item: url },
        ],
      }} />

      <Breadcrumbs aria-label="Trilha" sx={{ mb: 2 }}>
        <Link component={NextLink} href="/">BacenTools</Link>
        <Link component={NextLink} href="/erros-pix/">Códigos de erro do Pix</Link>
        <Typography color="text.primary">{e.codigo}</Typography>
      </Breadcrumbs>

      <Typography variant="h1">{tituloDe(e.codigo, r)}</Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ my: 2, flexWrap: 'wrap' }}>
        <Chip label={ORIGEM_LABEL[e.origem]} color={e.origem === 'SPI' ? 'primary' : 'warning'} />
        <Chip variant="outlined" label={TIPO_LABEL[e.tipo]} />
        {e.nomeIso && <Chip variant="outlined" label={`ISO 20022: ${e.nomeIso}`} />}
        {e.httpStatus && <Chip variant="outlined" label={`HTTP ${e.httpStatus}`} />}
      </Stack>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Typography variant="h2" component="h2" sx={{ mb: 1 }}>Resposta curta</Typography>
        <Typography sx={{ fontSize: '1.1rem' }}><strong>{e.codigo}</strong> significa: {r}.</Typography>
        {e.cenario && <Typography sx={{ mt: 1.5 }}><strong>Quando acontece:</strong> {e.cenario}</Typography>}
        {e.acaoRecomendada && <Typography sx={{ mt: 1.5 }}><strong>O que o app do pagador faz:</strong> {e.acaoRecomendada}</Typography>}
        <Typography sx={{ mt: 1.5 }}><strong>Onde aparece:</strong> <code>{e.mensagem}</code></Typography>
        {e.nomeIso && e.descricaoIso && <Typography sx={{ mt: 1.5 }}><strong>Definição ISO 20022:</strong> <code>{e.nomeIso}</code>, {e.descricaoIso}</Typography>}
        {e.observacao && <Alert severity={e.deducao ? 'warning' : 'info'} sx={{ mt: 2 }}>{e.observacao}</Alert>}
        <Box sx={{ mt: 2 }}>
          <Button component={NextLink} href={`/cenarios-pix/#${e.id}`} variant="contained">Ver a animação deste erro</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Typography variant="h2" component="h2" sx={{ mb: 1 }}>Fonte oficial</Typography>
        <Typography>
          <Link href={e.fonte.url} target="_blank" rel="noopener">{e.fonte.titulo}</Link>, versão {e.fonte.versao}. Local: {e.localNaFonte}.
        </Typography>
      </Paper>

      {relacionados.length > 0 && (
        <Paper component="nav" aria-label="Códigos relacionados" sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h2" component="h2" sx={{ mb: 1 }}>Outros códigos gerados por {ORIGEM_LABEL[e.origem]}</Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {relacionados.map((x) => (
              <li key={x.id}><Link component={NextLink} href={`/erros-pix/${slugDe(x)}/`}><strong>{x.codigo}</strong>: {resumo(x)}</Link></li>
            ))}
          </Box>
        </Paper>
      )}
    </>
  );
}
