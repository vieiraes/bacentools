'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from '@/theme/theme';

export function Providers({ children }: { children: ReactNode }) {
  // marca a página como hidratada (os testes E2E esperam por isso antes de interagir)
  useEffect(() => { document.documentElement.dataset.hydrated = 'true'; }, []);
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30 * 60_000, retry: 1 } },
  }));
  return (
    <AppRouterCacheProvider>
      <QueryClientProvider client={client}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </AppRouterCacheProvider>
  );
}
