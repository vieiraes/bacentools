'use client';

import { useMemo, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DOMINIOS, EVENTOS, FONTES_SPB, percorrer } from '@/lib/spb/catalogo';
import { ROTULO_DOMINIO } from '@/lib/spb/textos';
import { matches } from '@/lib/domain/text';
import { debounced, track } from '@/lib/analytics';

const ORDEM = ['FinlddCli', 'CodDevTransf', 'SitLancSTR', 'SitLancPAG', 'TpCt', 'TpPessoa', 'Pref', 'PrefPAG'];
const trackBusca = debounced((q: string) => track('search', { search_term: q, area: 'dominios-spb' }));

/** Em quais campos de quais mensagens o domínio aparece (ex.: FinlddCli → STR0008, PAG0108). */
function usadoEm(tipo: string): string[] {
  const out = new Set<string>();
  for (const e of EVENTOS) for (const m of e.mensagens) percorrer(m.campos, (c) => { if (c.tipo?.nome === tipo) out.add(`${m.codigo}.${c.tag}`); });
  return [...out];
}
const dataBr = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');

export function DominiosView() {
  const [q, setQ] = useState('');
  const tipos = ORDEM.filter((t) => DOMINIOS[t]);
  const filtrados = useMemo(
    () => Object.fromEntries(tipos.map((t) => [t, DOMINIOS[t].filter((d) => !q.trim() || matches(q, d.codigo, d.descricao))])),
    [q, tipos],
  );

  return (
    <Stack spacing={3}>
      <TextField
        label="Buscar em todos os domínios"
        placeholder="Ex.: salário, conta encerrada, 99999"
        value={q}
        onChange={(e) => { setQ(e.target.value); trackBusca(e.target.value); }}
        slotProps={{ htmlInput: { 'data-testid': 'busca-dominios' } }}
      />
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} component="nav" aria-label="Domínios">
        {tipos.map((t) => <Chip key={t} component="a" href={`#${t}`} clickable label={`${ROTULO_DOMINIO[t] ?? t} (${filtrados[t].length})`} />)}
      </Stack>
      {tipos.map((t) => (
        <Card key={t} component="section" id={t} aria-labelledby={`${t}-titulo`} sx={{ scrollMarginTop: 80 }}>
          <CardContent>
            <Typography variant="h2" id={`${t}-titulo`}>{ROTULO_DOMINIO[t] ?? t} <Typography component="span" color="text.secondary" sx={{ fontFamily: 'monospace' }}>({t})</Typography></Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
              Usado em: {usadoEm(t).join(', ')}. {DOMINIOS[t].length} valores vigentes.
            </Typography>
            {filtrados[t].length === 0 ? (
              <Typography color="text.secondary">Nenhum valor com “{q}”.</Typography>
            ) : (
              <Table size="small" aria-label={ROTULO_DOMINIO[t] ?? t}>
                <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Descrição</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Em produção desde</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtrados[t].map((d) => (
                    <TableRow key={d.codigo}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{d.codigo}</TableCell>
                      <TableCell>{d.descricao}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>{dataBr(d.desde)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
      <Typography variant="body2" color="text.secondary">
        Fonte: <MuiLink href={FONTES_SPB.dominios.url}>{FONTES_SPB.dominios.titulo}</MuiLink> ({FONTES_SPB.dominios.arquivo}). Só aparecem os valores vigentes: os
        que têm data de desativação em produção já passada foram retirados. No XML, os códigos numéricos vão sem zeros à esquerda (o tipo é inteiro).
      </Typography>
    </Stack>
  );
}
