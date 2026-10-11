import type { Metadata } from 'next';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { ERROS, ORIGEM_LABEL, TIPO_LABEL, resumo, slugDe, type Tipo } from '@/lib/pix-erros/catalogo';
import { JsonLd } from '@/components/JsonLd';
import { SITE } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'Códigos de erro do Pix: lista completa com significado (pacs.002, pacs.004 e DICT)',
  description: `Todos os ${ERROS.length} códigos de rejeição, devolução e erro do DICT do Pix, com o significado oficial do Banco Central, quem gera e o que mostrar ao usuário.`,
  alternates: { canonical: '/erros-pix/' },
};

const GRUPOS: Tipo[] = ['rejeicao', 'devolucao', 'dict'];

export default function Page() {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'Códigos de erro do Pix', url: `${SITE.url}/erros-pix/`,
        hasDefinedTerm: ERROS.map((e) => ({ '@type': 'DefinedTerm', termCode: e.codigo, name: `${e.codigo} (${e.mensagemCurta})`, description: resumo(e), url: `${SITE.url}/erros-pix/${slugDe(e)}/` })),
      }} />
      <Typography variant="h1">Códigos de erro do Pix</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: '75ch' }}>
        Os {ERROS.length} códigos que aparecem nas rejeições (pacs.002), nas devoluções (pacs.004) e nas consultas ao DICT, com a definição
        oficial do Banco Central. Quer ver o caminho do Pix em cada erro? Abra os <Link component={NextLink} href="/cenarios-pix/">cenários animados</Link>.
      </Typography>
      {GRUPOS.map((g) => (
        <Paper key={g} component="section" aria-labelledby={`g-${g}`} sx={{ p: 2, mb: 3 }}>
          <Typography id={`g-${g}`} variant="h2" sx={{ mb: 1 }}>{TIPO_LABEL[g]}</Typography>
          <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 0.5 }}>
            {ERROS.filter((e) => e.tipo === g).map((e) => (
              <li key={e.id}>
                <Link component={NextLink} href={`/erros-pix/${slugDe(e)}/`} sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{e.codigo}</Link>{' '}
                <Typography component="span" variant="body2">{resumo(e)}</Typography>{' '}
                <Typography component="span" variant="caption" color="text.secondary">· {ORIGEM_LABEL[e.origem]}</Typography>
              </li>
            ))}
          </Box>
        </Paper>
      ))}
    </>
  );
}
