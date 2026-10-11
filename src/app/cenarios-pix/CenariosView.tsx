'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LazyDataTable } from '@/components/LazyDataTable';
import { FlowAnimation } from '@/features/fluxo-pix/FlowAnimation';
import { BASE, ERROS, ORIGEM_LABEL, TIPO_LABEL, slugDe, type ErroPix, type Origem } from '@/lib/pix-erros/catalogo';
import NextLink from 'next/link';
import { DESTAQUES, cenarioPorId, fonteDe, type CenarioPix } from '@/lib/pix-erros/cenarios';
import { matches } from '@/lib/domain/text';
import { debounced, track } from '@/lib/analytics';

const ATALHO: Record<string, string> = {
  sucesso: '✅ Pix concluído',
  'pacs002-AC07': 'AC07 · conta encerrada',
  'pacs002-AC06': 'AC06 · conta bloqueada',
  'pacs002-FRAD': 'FRAD · suspeita de fraude',
  'pacs002-AM04': 'AM04 · sem saldo na Conta PI',
  'pacs002-AB03': 'AB03 · tempo esgotado',
  admi002: 'admi.002 · mensagem inválida',
  'pacs004-MD06': 'MD06 · devolução',
  'dict-NotFound': 'DICT 404 · chave não existe',
  'dict-RateLimited': 'DICT 429 · limite de consultas',
};
const ORIGEM_COR: Record<Origem, 'primary' | 'secondary' | 'warning' | 'default'> = { SPI: 'primary', PSP_RECEBEDOR: 'warning', PSP_PAGADOR: 'secondary', DICT: 'default' };

const trackBusca = debounced((t: string) => t.trim().length >= 2 && track('search', { search_term: t.trim().slice(0, 60), area: 'catalogo-erros' }));

type Opcao = { id: string; label: string; grupo: string };
const OPCOES: Opcao[] = [
  { id: 'sucesso', label: 'Pix concluído (fluxo sem erro)', grupo: 'Fluxos' },
  { id: 'admi002', label: 'admi.002 · mensagem inválida ou assinatura', grupo: 'Fluxos' },
  ...ERROS.map((e) => ({ id: e.id, label: `${e.codigo} · ${e.descricao.split('. Participante')[0].slice(0, 90)}`, grupo: TIPO_LABEL[e.tipo] })),
];

function Ficha({ cenario }: { cenario: CenarioPix }) {
  const e = cenario.erro;
  const fontes = cenario.fonteIds.map(fonteDe).filter(Boolean);
  return (
    <Card data-testid="ficha">
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 1 }} useFlexGap>
          <Typography variant="h2" component="h2">{cenario.title}</Typography>
          {e && <Chip size="small" label={ORIGEM_LABEL[e.origem]} color={ORIGEM_COR[e.origem]} />}
          {e && <Chip size="small" variant="outlined" label={e.mensagemCurta} />}
        </Stack>
        <Typography sx={{ mb: 1.5 }}>{cenario.summary}</Typography>
        {e && (
          <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { sm: '200px 1fr' }, rowGap: 1, columnGap: 2, '& dt': { fontWeight: 700 }, '& dd': { m: 0 } }}>
            <dt>Definição do BCB</dt><dd>{e.descricao}</dd>
            {e.nomeIso && <><dt>Nome ISO 20022</dt><dd><code>{e.nomeIso}</code>{e.descricaoIso ? `: ${e.descricaoIso}` : ''}</dd></>}
            <dt>Onde aparece</dt><dd><code>{e.mensagem}</code></dd>
            {e.acaoRecomendada && <><dt>O que o app do pagador faz</dt><dd>{e.acaoRecomendada}</dd></>}
            {e.observacao && <><dt>Observação</dt><dd>{e.observacao}</dd></>}
          </Box>
        )}
        {e?.deducao && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            O vínculo deste cenário com o código é uma <strong>dedução</strong> da documentação: a fonte não descreve o caso com essas palavras.
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }} data-testid="fonte">
          Fonte oficial:{' '}
          {fontes.map((f, i) => (
            <span key={f!.id}>{i > 0 && ' · '}<Link href={f!.url} target="_blank" rel="noopener">{f!.titulo} (versão {f!.versao})</Link></span>
          ))}
          {e && <>. Local: {e.localNaFonte}.</>}
        </Typography>
        {e && <Link component={NextLink} href={`/erros-pix/${slugDe(e)}/`} sx={{ display: 'inline-block', mt: 1 }}>Página do {e.codigo} (para compartilhar)</Link>}
      </CardContent>
    </Card>
  );
}

const colunas: GridColDef<ErroPix>[] = [
  { field: 'codigo', headerName: 'Código', width: 150, renderCell: ({ value }) => <code style={{ fontWeight: 700 }}>{value}</code> },
  { field: 'mensagemCurta', headerName: 'Mensagem', width: 130 },
  { field: 'origem', headerName: 'Quem gera', width: 170, valueFormatter: (v: Origem) => ORIGEM_LABEL[v] },
  { field: 'descricao', headerName: 'Definição do BCB', flex: 1, minWidth: 320, valueFormatter: (v: string) => v.split('. Participante')[0] },
];

export function CenariosView() {
  const [id, setId] = useState('sucesso');
  const [busca, setBusca] = useState('');
  const [origem, setOrigem] = useState<'' | Origem>('');
  const cenario = useMemo(() => cenarioPorId(id) ?? cenarioPorId('sucesso')!, [id]);

  // link direto: /cenarios-pix/#pacs002-AC06
  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.slice(1));
    if (h && cenarioPorId(h)) setId(h);
  }, []);
  const escolher = (novo: string) => {
    setId(novo);
    track('select_content', { content_type: 'erro_pix', item_id: novo });
    history.replaceState(null, '', `#${novo}`);
  };

  const linhas = useMemo(() => ERROS.filter((e) => (!origem || e.origem === origem) && matches(busca, e.codigo, e.descricao, e.nomeIso, e.cenario)), [busca, origem]);
  const prazos = BASE.prazos.slice(0, 3);

  return (
    <>
      <Stack direction="row" spacing={1} useFlexGap role="group" aria-label="Cenários mais comuns"
        sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' }, overflowX: { xs: 'auto', sm: 'visible' }, pb: { xs: 1, sm: 0 }, mb: 2, mx: { xs: -1, sm: 0 }, px: { xs: 1, sm: 0 } }}>
        {DESTAQUES.map((d) => (
          <Chip key={d} label={ATALHO[d]} clickable sx={{ flexShrink: 0 }} color={d === id ? 'primary' : 'default'} variant={d === id ? 'filled' : 'outlined'}
            onClick={() => escolher(d)} aria-pressed={d === id} data-testid={`atalho-${d}`} />
        ))}
      </Stack>

      <Autocomplete
        options={OPCOES}
        groupBy={(o) => o.grupo}
        getOptionLabel={(o) => o.label}
        value={OPCOES.find((o) => o.id === id) ?? null}
        onChange={(_e, v) => v && escolher(v.id)}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        renderInput={(params) => <TextField {...params} label="Buscar qualquer código ou erro" placeholder="Ex.: AC03, conta, fraude, 429" />}
        sx={{ mb: 2 }}
      />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 7 }}><FlowAnimation scenario={cenario} /></Grid>
        <Grid size={{ xs: 12, lg: 5 }}><Ficha cenario={cenario} /></Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 4 }} component="section" aria-labelledby="prazos">
        <Typography id="prazos" variant="h2" sx={{ mb: 1 }}>Prazos que provocam erro</Typography>
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          {prazos.map((p) => (
            <Typography component="li" key={p.id} variant="body2" sx={{ mb: 0.5 }}>
              <strong>{p.valor}</strong>: {p.descricao} <Link href={fonteDe(p.fonteId)?.url} target="_blank" rel="noopener">({fonteDe(p.fonteId)?.titulo}, {p.localNaFonte})</Link>
            </Typography>
          ))}
        </Box>
      </Paper>

      <Box component="section" aria-labelledby="catalogo">
        <Typography id="catalogo" variant="h2" sx={{ mb: 1 }}>Catálogo completo ({ERROS.length} códigos)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Toque num código para ver o cenário animado, ou veja a <Link component={NextLink} href="/erros-pix/">lista de códigos de erro do Pix</Link>. Base levantada em {new Date(BASE.geradoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} nos documentos oficiais do BCB.
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField fullWidth label="Filtrar catálogo" value={busca} onChange={(e) => { setBusca(e.target.value); trackBusca(e.target.value); }} placeholder="Código, palavra da definição ou nome ISO" slotProps={{ htmlInput: { 'data-testid': 'filtro-catalogo' } }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select fullWidth label="Quem gera" value={origem} onChange={(e) => setOrigem(e.target.value as '' | Origem)}>
              <MenuItem value="">Todos</MenuItem>
              {(Object.keys(ORIGEM_LABEL) as Origem[]).filter((o) => ERROS.some((e) => e.origem === o)).map((o) => <MenuItem key={o} value={o}>{ORIGEM_LABEL[o]}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
        <Typography role="status" variant="body2" color="text.secondary" sx={{ mb: 1 }} data-testid="result-count">{linhas.length} códigos</Typography>
        <Paper>
          <LazyDataTable rows={linhas} columns={colunas} getRowId={(r) => r.id}
            onRowClick={(p) => { escolher(p.row.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }} aria-label="Catálogo de códigos de erro do Pix" />
        </Paper>
      </Box>
    </>
  );
}
