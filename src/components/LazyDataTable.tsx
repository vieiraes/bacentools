'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@mui/material/Skeleton';

/**
 * O DataGrid só roda no navegador: fica fora da pré-renderização estática (o webpack do Next não lida com os
 * reexports "use client" internos do MUI X) e sai do pacote inicial da página.
 */
export const LazyDataTable = dynamic(() => import('./DataTable'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={480} aria-label="Carregando tabela" />,
}) as typeof import('./DataTable').default;
