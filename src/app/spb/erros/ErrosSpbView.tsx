'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { ERROS_SPB, FONTES_SPB } from '@/lib/spb/catalogo';
import { PREFIXO_ERRO, RETORNO_COM_ERRO } from '@/lib/spb/textos';
import { matches } from '@/lib/domain/text';
import { debounced, track } from '@/lib/analytics';

const trackBusca = debounced((q: string) => track('search', { search_term: q, area: 'erros-spb' }));

export function ErrosSpbView() {
  const [q, setQ] = useState('');
  const [prefixo, setPrefixo] = useState<string>('todos');
  const lista = useMemo(
    () => ERROS_SPB.filter((e) => (prefixo === 'todos' || e.codigo.startsWith(prefixo)) && (!q.trim() || matches(q, e.codigo, e.descricao))),
    [q, prefixo],
  );
  return (
    <Stack spacing={2}>
      <Alert severity="info">{RETORNO_COM_ERRO.texto} <em>({RETORNO_COM_ERRO.fonte})</em></Alert>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
        <TextField
          label="Buscar código ou descrição"
          placeholder="Ex.: ESTR0005, saldo, horário"
          value={q}
          onChange={(e) => { setQ(e.target.value); trackBusca(e.target.value); }}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { 'data-testid': 'busca-erros-spb' } }}
        />
        <ToggleButtonGroup exclusive size="small" value={prefixo} onChange={(_, v) => v && setPrefixo(v)} aria-label="Grupo do erro">
          <ToggleButton value="todos">Todos</ToggleButton>
          {Object.keys(PREFIXO_ERRO).map((p) => <ToggleButton key={p} value={p}>{p}</ToggleButton>)}
        </ToggleButtonGroup>
      </Stack>
      <Typography variant="body2" color="text.secondary" role="status" data-testid="total-erros-spb">{lista.length} códigos</Typography>
      <Table size="small" aria-label="Códigos de erro">
        <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Descrição</TableCell></TableRow></TableHead>
        <TableBody>
          {lista.map((e) => (
            <TableRow key={e.codigo}>
              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
                <MuiLink component={Link} href={`/spb/erros/${e.codigo.toLowerCase()}/`}>{e.codigo}</MuiLink>
              </TableCell>
              <TableCell>{e.descricao}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant="body2" color="text.secondary">
        Fonte: <MuiLink href={FONTES_SPB.erros.url}>{FONTES_SPB.erros.titulo}</MuiLink> ({FONTES_SPB.erros.arquivo}), só os códigos vigentes dos grupos EGEN, ESTR e EPAG.
      </Typography>
    </Stack>
  );
}
