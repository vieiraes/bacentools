'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GridColDef } from '@mui/x-data-grid';
import { LazyDataTable } from '@/components/LazyDataTable';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { SearchField } from '@/components/SearchField';
import { SourceStatus } from '@/components/SourceStatus';
import { CopyButton } from '@/components/CopyButton';
import { fetchPixParticipants } from '@/lib/sources/fetchers';
import type { PixParticipant } from '@/lib/sources/schemas';
import { matches, plural } from '@/lib/domain/text';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—');

const columns: GridColDef<PixParticipant>[] = [
  { field: 'ispb', headerName: 'ISPB', width: 140, renderCell: ({ value }) => <Box sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 0.5 }}>{value}<CopyButton value={value} label="Copiar ISPB" /></Box> },
  { field: 'name', headerName: 'Instituição', flex: 1.4, minWidth: 260 },
  { field: 'modality', headerName: 'Modalidade', flex: 1, minWidth: 220 },
  {
    field: 'participation', headerName: 'Participação', width: 130,
    renderCell: ({ value }) => <Chip size="small" label={value} color={value === 'Direta' ? 'primary' : 'default'} variant={value === 'Direta' ? 'filled' : 'outlined'} />,
  },
  { field: 'startedAt', headerName: 'Início no Pix', width: 130, valueFormatter: (v: string | null) => fmtDate(v), sortComparator: (a, b) => String(a ?? '').localeCompare(String(b ?? '')) },
];

export function PixParticipantsView() {
  const q = useQuery({ queryKey: ['pix-participants'], queryFn: () => fetchPixParticipants() });
  const [search, setSearch] = useState('');
  const [modality, setModality] = useState('');
  const [participation, setParticipation] = useState('');
  const deferred = useDeferredValue(search);
  const all = useMemo(() => q.data?.data ?? [], [q.data]);
  const modalities = useMemo(() => [...new Set(all.map((p) => p.modality))].sort(), [all]);
  const rows = useMemo(
    () => all.filter((p) => (!modality || p.modality === modality) && (!participation || p.participation === participation) && matches(deferred, p.name, p.shortName, p.ispb)),
    [all, modality, participation, deferred],
  );

  return (
    <>
      <SourceStatus result={q.data} error={q.error} onRetry={() => q.refetch()} source="a BrasilAPI" />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SearchField value={search} onChange={setSearch} label="Buscar participante" placeholder="Nome ou ISPB" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField select fullWidth label="Modalidade" value={modality} onChange={(e) => setModality(e.target.value)} slotProps={{ htmlInput: { 'data-testid': 'modality' } }}>
            <MenuItem value="">Todas</MenuItem>
            {modalities.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField select fullWidth label="Participação" value={participation} onChange={(e) => setParticipation(e.target.value)}>
            <MenuItem value="">Direta e indireta</MenuItem>
            <MenuItem value="Direta">Direta</MenuItem>
            <MenuItem value="Indireta">Indireta</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      <Typography role="status" variant="body2" color="text.secondary" sx={{ mb: 1 }} data-testid="result-count">
        {q.isPending ? 'Carregando…' : plural(rows.length, 'participante', 'participantes')}
      </Typography>
      <Paper sx={{ width: '100%' }}>
        <LazyDataTable
          rows={rows}
          columns={columns}
          getRowId={(r) => r.ispb + r.modality}
          loading={q.isPending}
          aria-label="Lista de participantes do Pix"
        
        />
      </Paper>
    </>
  );
}
