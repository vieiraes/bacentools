'use client';

import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { filtrarLeads, leadsParaCsv, PERFIS, type LeadRow, type Perfil, type TipoLead } from '@/lib/leads';
import type { Admin } from '@/services/firebase';

type Fase = { s: 'carregando' } | { s: 'fora' } | { s: 'negado'; u: Admin } | { s: 'ok'; u: Admin; rows: LeadRow[] } | { s: 'erro'; msg: string };

const fb = () => import('@/services/firebase');
const dataBr = (d?: Date) => (d ? d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) : '');
const perfilLabel = (p?: Perfil) => PERFIS.find((x) => x.value === p)?.label ?? '';

export function AdminLeads() {
  const [fase, setFase] = useState<Fase>({ s: 'carregando' });
  const [tipo, setTipo] = useState<TipoLead | 'todos'>('todos');
  const [perfil, setPerfil] = useState<Perfil | 'todos'>('todos');
  const [texto, setTexto] = useState('');

  useEffect(() => {
    let parar: (() => void) | undefined;
    let vivo = true;
    fb()
      .then((f) =>
        f.observarLogin(async (u) => {
          if (!u) return vivo && setFase({ s: 'fora' });
          try {
            const rows = await f.listarLeads();
            if (vivo) setFase({ s: 'ok', u, rows });
          } catch (e) {
            // as regras do Firestore recusam quem não é o administrador
            if (vivo) setFase((e as { code?: string }).code === 'permission-denied' ? { s: 'negado', u } : { s: 'erro', msg: String(e) });
          }
        }),
      )
      .then((p) => { parar = p; })
      .catch((e) => setFase({ s: 'erro', msg: String(e) }));
    return () => { vivo = false; parar?.(); };
  }, []);

  const rows = useMemo(() => (fase.s === 'ok' ? fase.rows : []), [fase]);
  const vistos = useMemo(() => filtrarLeads(rows, { tipo, perfil, texto }), [rows, tipo, perfil, texto]);

  function exportar() {
    const url = URL.createObjectURL(new Blob([leadsParaCsv(vistos)], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `leads-bacentools-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function excluir(r: LeadRow) {
    if (fase.s !== 'ok' || !window.confirm(`Excluir o contato ${r.email}? (pedido de exclusão pela LGPD)`)) return;
    await (await fb()).excluirLead(r.id);
    setFase({ ...fase, rows: fase.rows.filter((x) => x.id !== r.id) });
  }

  const entrar = async () => (await fb()).entrarComGoogle().catch((e) => setFase({ s: 'erro', msg: String(e) }));
  const sair = async () => (await fb()).sair();

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h1">Painel de leads</Typography>
        {(fase.s === 'ok' || fase.s === 'negado') && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">{fase.u.email}</Typography>
            <Button onClick={sair}>Sair</Button>
          </Stack>
        )}
      </Stack>

      {fase.s === 'carregando' && <Typography>Carregando…</Typography>}
      {fase.s === 'fora' && (
        <Paper sx={{ p: 3 }}>
          <Typography sx={{ mb: 2 }}>Área restrita ao administrador do BacenTools.</Typography>
          <Button variant="contained" onClick={entrar} data-testid="admin-login">Entrar com Google</Button>
        </Paper>
      )}
      {fase.s === 'negado' && <Alert severity="warning">A conta {fase.u.email} não tem acesso a este painel.</Alert>}
      {fase.s === 'erro' && <Alert severity="error">Não consegui carregar: {fase.msg}</Alert>}

      {fase.s === 'ok' && (
        <>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Chip label={`Total: ${rows.length}`} />
            <Chip color="primary" label={`Newsletter: ${rows.filter((r) => r.tipo === 'newsletter').length}`} />
            <Chip color="secondary" label={`Contato: ${rows.filter((r) => r.tipo === 'contato').length}`} />
            {PERFIS.map((p) => <Chip key={p.value} variant="outlined" label={`${p.label}: ${rows.filter((r) => r.perfil === p.value).length}`} />)}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoLead | 'todos')} sx={{ minWidth: 160 }}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="newsletter">Newsletter</MenuItem>
              <MenuItem value="contato">Contato</MenuItem>
            </TextField>
            <TextField select label="Perfil" value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil | 'todos')} sx={{ minWidth: 200 }}>
              <MenuItem value="todos">Todos</MenuItem>
              {PERFIS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </TextField>
            <TextField label="Buscar" value={texto} onChange={(e) => setTexto(e.target.value)} fullWidth />
            <Button variant="contained" onClick={exportar} disabled={!vistos.length} sx={{ whiteSpace: 'nowrap' }}>Exportar CSV</Button>
          </Stack>
          <TableContainer component={Paper}>
            <Table size="small" aria-label="Leads">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell><TableCell>Tipo</TableCell><TableCell>Nome</TableCell><TableCell>E-mail</TableCell>
                  <TableCell>Perfil / empresa</TableCell><TableCell>Mensagem</TableCell><TableCell>Origem</TableCell><TableCell><Box component="span" sx={{ position: 'absolute', left: -9999 }}>Ações</Box></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vistos.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dataBr(r.criadoEm)}</TableCell>
                    <TableCell>{r.tipo}</TableCell>
                    <TableCell>{r.nome}</TableCell>
                    <TableCell><a href={`mailto:${r.email}`}>{r.email}</a></TableCell>
                    <TableCell>{perfilLabel(r.perfil) || r.empresa}</TableCell>
                    <TableCell sx={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{r.mensagem}</TableCell>
                    <TableCell>{r.origem}</TableCell>
                    <TableCell><IconButton aria-label={`Excluir ${r.email}`} onClick={() => excluir(r)}><DeleteIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
                {!vistos.length && <TableRow><TableCell colSpan={8}>Nenhum lead.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Stack>
  );
}
