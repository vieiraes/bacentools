'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { SearchField } from '@/components/SearchField';
import { fetchInformes } from '@/lib/sources/fetchers';
import type { InformeTipo } from '@/lib/sources/schemas';
import { formatBytes, matches, plural } from '@/lib/domain/text';
import { track } from '@/lib/analytics';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—');

export function InformesView() {
  const [tipo, setTipo] = useState<InformeTipo>('SPI');
  const [ano, setAno] = useState(CURRENT_YEAR);
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const q = useQuery({ queryKey: ['informes', tipo, ano], queryFn: () => fetchInformes(tipo, ano) });
  const rows = useMemo(() => (q.data ?? []).filter((i) => matches(deferred, i.title, i.fileName)), [q.data, deferred]);

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2, alignItems: "center" }}>
        <Grid size={{ xs: 12, sm: 'auto' }}>
          <ToggleButtonGroup exclusive color="primary" value={tipo} onChange={(_e, v) => { if (v) { setTipo(v); track('select_content', { content_type: 'informe_tipo', item_id: v }); } }} aria-label="Sistema">
            <ToggleButton value="SPI">SPI (Pix)</ToggleButton>
            <ToggleButton value="STR">STR</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
        <Grid size={{ xs: 12, sm: 3, md: 2 }}>
          <TextField select fullWidth label="Ano" value={ano} onChange={(e) => { setAno(Number(e.target.value)); track('select_content', { content_type: 'informe_ano', item_id: String(e.target.value) }); }} slotProps={{ htmlInput: { 'data-testid': 'year' } }}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 'grow' }}>
          <SearchField area="informes" value={search} onChange={setSearch} label="Filtrar informes" placeholder="Número ou título (ex.: 018)" />
        </Grid>
      </Grid>

      {q.error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => q.refetch()}>Tentar de novo</Button>}>
          Não foi possível carregar os informes do Banco Central: {q.error.message}
        </Alert>
      )}
      <Typography role="status" variant="body2" color="text.secondary" sx={{ mb: 1 }} data-testid="result-count">
        {q.isPending ? 'Carregando…' : `${plural(rows.length, 'informe', 'informes')} do ${tipo} em ${ano}`}
      </Typography>
      <Paper>
        <List aria-label={`Informes do ${tipo} em ${ano}`} data-testid="informes">
          {q.isPending && Array.from({ length: 5 }, (_, i) => <ListItem key={i}><Skeleton width="60%" /></ListItem>)}
          {!q.isPending && rows.length === 0 && !q.error && <ListItem><ListItemText primary="Nenhum informe encontrado." /></ListItem>}
          {rows.map((i) => (
            <ListItem key={i.id} divider secondaryAction={
              <Button href={i.pdfUrl} target="_blank" rel="noopener" startIcon={<PictureAsPdfIcon aria-hidden />} aria-label={`Abrir PDF do ${i.title}`} onClick={() => track('file_download', { file_name: i.fileName, link_url: i.pdfUrl, area: 'informes' })}>
                PDF{i.sizeBytes ? ` · ${formatBytes(i.sizeBytes)}` : ''}
              </Button>
            } sx={{ pr: { xs: 16, sm: 20 } }}>
              <ListItemText primary={i.title} secondary={`Referência ${fmt(i.referenceDate)} · publicado em ${fmt(i.publishedAt)}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </>
  );
}
