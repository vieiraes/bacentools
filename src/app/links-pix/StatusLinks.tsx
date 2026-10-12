'use client';

import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import { dataHoraBr, STATUS_URL, type StatusLinks } from '@/lib/verificar-links';

const dataBr = (iso: string) => iso.split('-').reverse().join('/');

/** Resultado mais recente: lido do GitHub (atualiza sem novo deploy); se o GitHub falhar, a cópia publicada junto do site. */
async function carregar(): Promise<StatusLinks> {
  for (const url of [STATUS_URL, '/data/links-status.json']) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) return (await r.json()) as StatusLinks;
    } catch { /* tenta a próxima */ }
  }
  throw new Error('sem status');
}

const useStatus = () => useQuery({ queryKey: ['links-status'], queryFn: carregar, staleTime: 5 * 60_000 });

export function ResumoStatus({ revisadoEm }: { revisadoEm: string }) {
  const q = useStatus();
  const s = q.data;
  const revisado = `Lista revisada em ${dataBr(s?.revisadoEm ?? revisadoEm)}.`;
  if (!s) {
    return <Alert severity="info" sx={{ mt: 2 }} data-testid="links-status">{revisado} {q.isLoading ? 'Carregando a última verificação automática…' : 'Não consegui carregar a última verificação automática.'}</Alert>;
  }
  const n = s.quebrados.length;
  return (
    <Alert severity={n ? 'warning' : 'success'} sx={{ mt: 2 }} data-testid="links-status">
      <strong>Última verificação automática: {dataHoraBr(s.verificadoEm)}</strong> (horário de Brasília).{' '}
      {n ? `${n} de ${s.total} links com problema, marcados abaixo.` : `Todos os ${s.total} links funcionando.`} {revisado} Os links são conferidos
      toda segunda-feira.
    </Alert>
  );
}

export function MarcaQuebrado({ url }: { url: string }) {
  const q = useStatus();
  const quebrado = q.data?.quebrados.find((x) => x.url === url);
  if (!quebrado) return null;
  return <Chip size="small" color="warning" label={`Fora do ar na última verificação: ${quebrado.motivo}`} sx={{ maxWidth: '100%' }} />;
}
