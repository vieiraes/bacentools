'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  COUNTING, PARTICIPANT_BUCKETS, USER_BUCKETS, available, policyForKey,
  type Bucket, type KeyType, type ParticipantCategory,
} from '@/lib/domain/dict';
import { USERS, useSimulation, type LogEntry } from './store';
import { track } from '@/lib/analytics';

const KEY_TYPES: KeyType[] = ['CPF', 'CNPJ', 'EVP', 'EMAIL', 'PHONE'];
const CATEGORIES = Object.keys(PARTICIPANT_BUCKETS) as ParticipantCategory[];
const SPEEDS = [1, 10, 60, 600];
const num = (n: number) => n.toLocaleString('pt-BR');

function Gauge({ id, title, policy, bucket, active }: { id: string; title: string; policy: string; bucket: Bucket; active: boolean }) {
  const tokens = available(bucket);
  const pct = (tokens / bucket.capacity) * 100;
  const color = tokens === 0 ? 'error' : pct < 20 ? 'warning' : 'success';
  return (
    <Card data-testid={`bucket-${id}`} sx={{ height: '100%', borderWidth: 2, borderStyle: active ? 'solid' : 'dashed', borderColor: tokens === 0 ? 'error.main' : active ? 'primary.main' : 'divider' }}>
      <CardContent>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{policy}</Typography>
        <Typography sx={{ fontSize: '2rem', fontWeight: 800, my: 1, fontVariantNumeric: 'tabular-nums' }}>
          <span data-testid={`tokens-${id}`}>{num(tokens)}</span>{' '}
          <Typography component="span" color="text.secondary" sx={{ fontWeight: 600 }}>/ {num(bucket.capacity)} fichas</Typography>
        </Typography>
        <LinearProgress variant="determinate" value={pct} color={color} aria-label={`${title}: ${tokens} de ${bucket.capacity} fichas`} sx={{ height: 10, borderRadius: 5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          repõe {num(bucket.refillPerMinute)}/min
          {tokens === 0 && <Typography component="strong" variant="body2" color="error" sx={{ fontWeight: 700 }}> · vazio: a próxima consulta recebe 429</Typography>}
        </Typography>
      </CardContent>
    </Card>
  );
}

const statusColor = (s: LogEntry['status']) => (s === 200 || s === 'PAGO' ? 'success' : s === 404 ? 'warning' : 'error');

export function SimulatorView() {
  const sim = useSimulation();
  const [userId, setUserId] = useState(USERS[0].id);
  const [keyType, setKeyType] = useState<KeyType>('CPF');
  const user = sim.state.users[userId];
  const activePolicy = policyForKey(keyType);

  return (
    <>
      <Alert severity="info" sx={{ mb: 3 }}>
        Cada consulta de chave Pix no DICT gasta fichas de três baldes: dois do usuário (um para EMAIL/PHONE, outro para CPF/CNPJ/EVP) e um da instituição.
        Sem fichas, a resposta é <strong>HTTP 429</strong>. O Pix enviado devolve parte das fichas.
      </Alert>

      <Paper component="section" aria-labelledby="cenario" sx={{ p: 2, mb: 2 }}>
        <Typography id="cenario" variant="h2" sx={{ mb: 2 }}>Cenário</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField select fullWidth label="Quem consulta" value={userId} onChange={(e) => setUserId(e.target.value)} slotProps={{ htmlInput: { 'data-testid': 'user' } }}>
              {USERS.map((u) => <MenuItem key={u.id} value={u.id}>{u.name} ({u.personType})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField select fullWidth label="Tipo de chave" value={keyType} onChange={(e) => setKeyType(e.target.value as KeyType)} slotProps={{ htmlInput: { 'data-testid': 'key-type' } }}>
              {KEY_TYPES.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField select fullWidth label={`Categoria do participante (ISPB ${sim.state.ispb})`} value={sim.state.category} onChange={(e) => sim.changeCategory(e.target.value as ParticipantCategory)} slotProps={{ htmlInput: { 'data-testid': 'category' } }}>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c} · {num(PARTICIPANT_BUCKETS[c].capacity)} fichas</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField select fullWidth label="Velocidade do relógio" value={sim.speed} onChange={(e) => sim.setSpeed(Number(e.target.value))} slotProps={{ htmlInput: { 'data-testid': 'speed' } }}>
              {SPEEDS.map((v) => <MenuItem key={v} value={v}>{v === 1 ? 'tempo real' : `${v}× mais rápido`}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Button variant="contained" data-testid="consult-found" onClick={() => { sim.consult(userId, keyType, true); track('simulator_action', { action: 'consulta_200', key_type: keyType }); }}>Consultar chave que existe (200)</Button>
          <Button variant="contained" color="warning" data-testid="consult-not-found" onClick={() => { sim.consult(userId, keyType, false); track('simulator_action', { action: 'consulta_404', key_type: keyType }); }}>Consultar chave que não existe (404)</Button>
          <Button variant="contained" color="success" data-testid="pay" disabled={!sim.lastConsultation} onClick={() => { sim.pay(); track('simulator_action', { action: 'pix_enviado' }); }}>Enviar Pix da última consulta</Button>
          <Button variant="outlined" data-testid="reset" onClick={sim.reset}>Recomeçar</Button>
        </Box>
      </Paper>

      <Grid container spacing={2} component="section" aria-label="Baldes de fichas" sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}><Gauge id="user-v1" title="Usuário · EMAIL e PHONE" policy="ENTRIES_READ_USER_ANTISCAN" bucket={user.buckets.ENTRIES_READ_USER_ANTISCAN} active={activePolicy === 'ENTRIES_READ_USER_ANTISCAN'} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><Gauge id="user-v2" title="Usuário · CPF, CNPJ e EVP" policy="ENTRIES_READ_USER_ANTISCAN_V2" bucket={user.buckets.ENTRIES_READ_USER_ANTISCAN_V2} active={activePolicy === 'ENTRIES_READ_USER_ANTISCAN_V2'} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><Gauge id="participant" title={`Participante · categoria ${sim.state.category}`} policy="ENTRIES_READ_PARTICIPANT_ANTISCAN" bucket={sim.state.participant} active /></Grid>
      </Grid>

      <Paper component="section" aria-labelledby="respostas" sx={{ p: 2, mb: 2 }}>
        <Typography id="respostas" variant="h2" sx={{ mb: 1 }}>Respostas</Typography>
        {sim.log.length === 0 && <Typography color="text.secondary">Nenhuma operação ainda.</Typography>}
        <Box component="ol" aria-live="polite" aria-label="Histórico de respostas" tabIndex={0} data-testid="log" sx={{ listStyle: 'none', p: 0, m: 0, maxHeight: 360, overflow: 'auto', display: 'grid', gap: 1 }}>
          {sim.log.map((e) => (
            <Box component="li" key={e.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '72px 1fr', sm: '84px 1fr auto' }, gap: 1, alignItems: 'center', p: 1, borderLeft: 5, borderColor: `${statusColor(e.status)}.main`, bgcolor: 'grey.50', borderRadius: 1, overflowWrap: 'anywhere' }}>
              <Chip size="small" color={statusColor(e.status)} label={<span data-testid="status">{e.status}</span>} />
              <Typography variant="body2"><strong>{e.action}</strong><br />{e.detail}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ gridColumn: { xs: 2, sm: 'auto' } }}>{new Date(e.at).toLocaleTimeString('pt-BR')}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper component="section" aria-labelledby="regra" sx={{ p: 2 }}>
        <Typography id="regra" variant="h2" sx={{ mb: 1 }}>A regra</Typography>
        <TableContainer tabIndex={0} role="region" aria-label="Tabela da regra (role para os lados no celular)">
          <Table size="small" sx={{ minWidth: 520 }}>
            <caption>Quanto cada evento mexe em cada balde</caption>
            <TableHead><TableRow><TableCell>Evento</TableCell><TableCell>Usuário PF</TableCell><TableCell>Usuário PJ</TableCell><TableCell>Participante</TableCell></TableRow></TableHead>
            <TableBody>
              <TableRow><TableCell component="th" scope="row">Consulta com chave encontrada (200)</TableCell><TableCell>−{COUNTING.user.found}</TableCell><TableCell>−{COUNTING.user.found}</TableCell><TableCell>−{COUNTING.participant.found}</TableCell></TableRow>
              <TableRow><TableCell component="th" scope="row">Consulta com chave inexistente (404)</TableCell><TableCell>−{COUNTING.user.notFound}</TableCell><TableCell>−{COUNTING.user.notFound}</TableCell><TableCell>−{COUNTING.participant.notFound}</TableCell></TableRow>
              <TableRow><TableCell component="th" scope="row">Pix enviado (mesmo endToEndId)</TableCell><TableCell>+{COUNTING.user.paymentRefund.PF}</TableCell><TableCell>+{COUNTING.user.paymentRefund.PJ}</TableCell><TableCell>+{COUNTING.participant.paymentRefund}</TableCell></TableRow>
              <TableRow><TableCell component="th" scope="row">Tamanho do balde</TableCell><TableCell>{USER_BUCKETS.PF.capacity}</TableCell><TableCell>{num(USER_BUCKETS.PJ.capacity)}</TableCell><TableCell>50 a 50.000 (categoria H a A)</TableCell></TableRow>
              <TableRow><TableCell component="th" scope="row">Reposição</TableCell><TableCell>{USER_BUCKETS.PF.refillPerMinute}/min</TableCell><TableCell>{USER_BUCKETS.PJ.refillPerMinute}/min</TableCell><TableCell>2 a 25.000/min</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Hipótese do simulador: a especificação não define saldo negativo, então uma cobrança maior que o saldo zera o balde.
          Fonte: especificação da API do DICT, seção “Limitação de requisições” (<Link href="https://developers.openpix.com.br/en/dict">cópia pública</Link>) e{' '}
          <Link href="https://www.bcb.gov.br/content/estabilidadefinanceira/pix/changelog.html">changelog do BCB</Link>. Simulação educativa.
        </Typography>
      </Paper>
    </>
  );
}
