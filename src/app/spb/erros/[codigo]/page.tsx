import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { JsonLd } from '@/components/JsonLd';
import { ERROS_SPB, FONTES_SPB, erroSpbPorCodigo } from '@/lib/spb/catalogo';
import { PREFIXO_ERRO, RETORNO_COM_ERRO } from '@/lib/spb/textos';
import { SITE } from '@/lib/tools';
import { metaPagina } from '@/lib/seo';

export const dynamicParams = false;
export function generateStaticParams() {
  return ERROS_SPB.map((e) => ({ codigo: e.codigo.toLowerCase() }));
}

type Props = { params: Promise<{ codigo: string }> };
const titulo = (c: string, d: string) => `${c}: ${d}`;
const dataBr = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = erroSpbPorCodigo((await params).codigo);
  if (!e) return {};
  return metaPagina({
    path: `/spb/erros/${e.codigo.toLowerCase()}/`,
    title: titulo(e.codigo, e.descricao).slice(0, 90),
    description: `${e.codigo} (${PREFIXO_ERRO[e.codigo.slice(0, 4)]}): ${e.descricao}. Código de erro oficial do Catálogo de Serviços do SFN e como ele volta na mensagem.`.slice(0, 160),
    ogTitle: titulo(e.codigo, e.descricao),
  });
}

export default async function Page({ params }: Props) {
  const e = erroSpbPorCodigo((await params).codigo);
  if (!e) notFound();
  const prefixo = e.codigo.slice(0, 4);
  const url = `${SITE.url}/spb/erros/${e.codigo.toLowerCase()}/`;
  const vizinhos = ERROS_SPB.filter((x) => x.codigo.startsWith(prefixo));
  const i = vizinhos.findIndex((x) => x.codigo === e.codigo);
  const perto = vizinhos.slice(Math.max(0, i - 3), i + 4).filter((x) => x.codigo !== e.codigo);
  const faq = [
    { q: `O que significa o erro ${e.codigo}?`, a: `${e.descricao}. ${PREFIXO_ERRO[prefixo]}. Código da Relação de Códigos de Erros do Catálogo de Serviços do SFN.` },
    { q: `Como o ${e.codigo} aparece na mensagem?`, a: RETORNO_COM_ERRO.texto },
  ];
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BacenTools', item: `${SITE.url}/` },
          { '@type': 'ListItem', position: 2, name: 'SPB e TED', item: `${SITE.url}/spb/` },
          { '@type': 'ListItem', position: 3, name: 'Códigos de erro', item: `${SITE.url}/spb/erros/` },
          { '@type': 'ListItem', position: 4, name: e.codigo, item: url },
        ],
      }} />
      <Breadcrumbs aria-label="Trilha" sx={{ mb: 2 }}>
        <Link component={NextLink} href="/spb/">SPB e TED</Link>
        <Link component={NextLink} href="/spb/erros/">Códigos de erro</Link>
        <Typography color="text.primary">{e.codigo}</Typography>
      </Breadcrumbs>
      <Typography variant="h1">{titulo(e.codigo, e.descricao)}</Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ my: 2, flexWrap: 'wrap' }}>
        <Chip label={PREFIXO_ERRO[prefixo]} color="primary" />
        {e.desde && <Chip variant="outlined" label={`Em produção desde ${dataBr(e.desde)}`} />}
      </Stack>
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>Como esse erro volta</Typography>
        <Typography>{RETORNO_COM_ERRO.texto}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{RETORNO_COM_ERRO.fonte}</Typography>
      </Paper>
      {perto.length > 0 && (
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
          <Typography variant="h2" sx={{ mb: 1 }}>Códigos próximos</Typography>
          <Stack spacing={0.5}>
            {perto.map((x) => (
              <Typography key={x.codigo}>
                <Link component={NextLink} href={`/spb/erros/${x.codigo.toLowerCase()}/`} sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{x.codigo}</Link>: {x.descricao}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}
      <Alert severity="info">
        Fonte: <Link href={FONTES_SPB.erros.url}>{FONTES_SPB.erros.titulo}</Link> ({FONTES_SPB.erros.arquivo}). O catálogo não liga cada código a uma mensagem: o mesmo
        código pode voltar em qualquer mensagem do grupo.
      </Alert>
    </>
  );
}
