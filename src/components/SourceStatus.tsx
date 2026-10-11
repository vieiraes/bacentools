'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import type { Sourced } from '@/lib/sources/fetchers';
import { track } from '@/lib/analytics';

/** Mostra de onde veio o dado (cópia do dia, quando a fonte caiu) e o erro com botão de tentar de novo. */
export function SourceStatus({ result, error, onRetry, source }: { result?: Sourced<unknown>; error?: Error | null; onRetry: () => void; source: string }) {
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={onRetry}>Tentar de novo</Button>}>
        Não foi possível carregar os dados de {source}: {error.message}
      </Alert>
    );
  }
  if (result?.origin === 'snapshot') {
    track('source_fallback', { source });
    return (
      <Alert severity="warning" sx={{ mb: 2 }} role="status">
        {source} não respondeu agora. Mostrando a cópia de {new Date(result.snapshotAt!).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.
      </Alert>
    );
  }
  return null;
}
