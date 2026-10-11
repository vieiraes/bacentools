'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GridColDef } from '@mui/x-data-grid';
import { LazyDataTable } from '@/components/LazyDataTable';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { SearchField } from '@/components/SearchField';
import { SourceStatus } from '@/components/SourceStatus';
import { CopyButton } from '@/components/CopyButton';
import { fetchBanks } from '@/lib/sources/fetchers';
import type { Bank } from '@/lib/sources/schemas';
import { formatCompe, matches, plural } from '@/lib/domain/text';

const columns: GridColDef<Bank>[] = [
  {
    field: 'logoUrl', headerName: '', width: 56, sortable: false, filterable: false, disableColumnMenu: true,
    renderCell: ({ row }) => <Avatar src={row.logoUrl ?? undefined} alt="" sx={{ width: 28, height: 28, bgcolor: 'grey.200', fontSize: 12, color: 'text.secondary' }} slotProps={{ img: { loading: 'lazy' } }}>{row.name.slice(0, 2)}</Avatar>,
  },
  { field: 'code', headerName: 'COMPE', width: 90, valueFormatter: (v: number | null) => formatCompe(v) ?? '—' },
  {
    field: 'ispb', headerName: 'ISPB', width: 140,
    renderCell: ({ value }) => <Box sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 0.5 }}>{value}<CopyButton value={value} label="Copiar ISPB" /></Box>,
  },
  { field: 'name', headerName: 'Nome', flex: 1, minWidth: 200 },
  { field: 'fullName', headerName: 'Razão social', flex: 1.4, minWidth: 260 },
  { field: 'city', headerName: 'Sede', width: 170, valueGetter: (_v, row) => (row.city ? `${row.city}${row.state ? `/${row.state}` : ''}` : '') },
];

export function BanksView() {
  const q = useQuery({ queryKey: ['banks'], queryFn: () => fetchBanks() });
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const rows = useMemo(
    () => (q.data?.data ?? []).filter((b) => matches(deferred, b.name, b.fullName, b.ispb, b.code, formatCompe(b.code), b.city)),
    [q.data, deferred],
  );

  return (
    <>
      <SourceStatus result={q.data} error={q.error} onRetry={() => q.refetch()} source="a BrasilAPI" />
      <Box sx={{ mb: 2 }}>
        <SearchField area="bancos" value={search} onChange={setSearch} label="Buscar banco" placeholder="Nome, COMPE (ex.: 260) ou ISPB (ex.: 18236120)" />
      </Box>
      <Typography role="status" variant="body2" color="text.secondary" sx={{ mb: 1 }} data-testid="result-count">
        {q.isPending ? 'Carregando…' : plural(rows.length, 'instituição', 'instituições')}
      </Typography>
      <Paper sx={{ width: '100%' }}>
        <LazyDataTable
          rows={rows}
          columns={columns}
          getRowId={(r) => r.ispb + (r.code ?? '')}
          loading={q.isPending}
          aria-label="Lista de bancos"
        
        />
      </Paper>
    </>
  );
}
