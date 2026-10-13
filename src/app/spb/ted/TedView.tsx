'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { FlowAnimation } from '@/features/fluxo/FlowAnimation';
import { CENARIOS_TED, cenarioTedPorId, type CenarioTed } from '@/lib/spb/cenarios-ted';
import { descricaoDominio, erroSpbPorCodigo } from '@/lib/spb/catalogo';
import { GRUPOS } from '@/lib/spb/textos';
import { track } from '@/lib/analytics';

function Ficha({ c }: { c: CenarioTed }) {
  const erro = c.erro ? erroSpbPorCodigo(c.erro) : undefined;
  return (
    <Card data-testid="ficha-ted" sx={{ containerType: 'inline-size', minWidth: 0 }}>
      <CardContent>
        <Typography variant="h2">{c.title}</Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', my: 1 }}>
          <Chip size="small" color="primary" label={GRUPOS[c.grupo].nome} />
          {c.mensagens.map((m) => (
            <Chip key={m} size="small" variant="outlined" clickable component={Link} href={`/spb/mensagens/#${m.endsWith('E') ? m.slice(0, -1) : m}`} label={m} />
          ))}
        </Stack>
        <Typography sx={{ mb: 1.5 }}>{c.summary}</Typography>
        {erro && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            <MuiLink component={Link} href={`/spb/erros/${erro.codigo.toLowerCase()}/`} sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{erro.codigo}</MuiLink>: {erro.descricao}
          </Alert>
        )}
        {c.situacoes && (
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            <strong>Situações do lançamento (SitLancSTR):</strong> {c.situacoes.map((s) => `${s} = ${descricaoDominio('SitLancSTR', s)}`).join('; ')}.
          </Typography>
        )}
        <Stack spacing={1}>
          {c.notas.map((n) => (
            <Typography key={n.texto} variant="body2">{n.texto} <Typography component="span" variant="body2" color="text.secondary">({n.fonte})</Typography></Typography>
          ))}
        </Stack>
        {c.deducao && <Alert severity="warning" sx={{ mt: 1.5 }}><strong>Dedução:</strong> {c.deducao}</Alert>}
      </CardContent>
    </Card>
  );
}

export function TedView() {
  const [id, setId] = useState(CENARIOS_TED[0].id);
  useEffect(() => {
    const ler = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (h && cenarioTedPorId(h)) setId(h);
    };
    ler();
    window.addEventListener('hashchange', ler);
    return () => window.removeEventListener('hashchange', ler);
  }, []);
  const escolher = (novo: string) => {
    setId(novo);
    history.replaceState(null, '', `#${novo}`);
    track('select_content', { content_type: 'cenario_ted', item_id: novo });
  };
  const c = cenarioTedPorId(id)!;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} role="group" aria-label="Cenários da TED">
        {CENARIOS_TED.map((x) => (
          <Chip
            key={x.id}
            label={x.title}
            color={x.id === id ? 'primary' : 'default'}
            variant={x.id === id ? 'filled' : 'outlined'}
            aria-pressed={x.id === id}
            onClick={() => escolher(x.id)}
            data-testid={`cenario-${x.id}`}
          />
        ))}
      </Stack>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}><FlowAnimation scenario={c} amount="R$ 15.000,00" /></Grid>
        <Grid size={{ xs: 12, lg: 5 }} sx={{ minWidth: 0 }}><Ficha c={c} /></Grid>
      </Grid>
    </Stack>
  );
}
