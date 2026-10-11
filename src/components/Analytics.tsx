'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Link from 'next/link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { GA_ID, setConsent, storedConsent } from '@/lib/analytics';

/**
 * GA4 + Consent Mode v2. O padrão é "negado": sem cookies e sem identificador até o visitante aceitar.
 * Anúncios ficam sempre negados (o site não usa publicidade).
 */
export function Analytics() {
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    const c = storedConsent();
    if (c) {
      (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('consent', 'update', { analytics_storage: c });
    } else {
      setAsk(true);
    }
  }, []);

  const choose = (v: 'granted' | 'denied') => {
    setConsent(v);
    setAsk(false);
  };

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      {ask && (
        <Paper
          role="dialog"
          aria-label="Cookies e privacidade"
          elevation={6}
          variant="elevation"
          sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 560, mx: 'auto', p: 2, zIndex: 1400 }}
          data-testid="consent"
        >
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Usamos o Google Analytics para entender como o BacenTools é usado e decidir as próximas ferramentas. Nenhum dado é vendido e
            não há anúncios. <Link href="/privacidade/">Saiba mais</Link>.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button onClick={() => choose('denied')} data-testid="consent-deny">Recusar</Button>
            <Button variant="contained" onClick={() => choose('granted')} data-testid="consent-accept">Aceitar</Button>
          </Stack>
        </Paper>
      )}
    </>
  );
}
