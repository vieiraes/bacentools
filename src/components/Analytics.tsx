'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Button from '@mui/material/Button';
import Link from 'next/link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  EVENTO_ABRIR_AVISO_COOKIES,
  abrirAvisoCookies,
  desligarAnalytics,
  gravarConsentimento,
  lerConsentimento,
  registrarVisita,
  track,
  type Consentimento,
} from '@/lib/analytics';

/**
 * Aviso de cookies e contagem de visitas. O Google Analytics só carrega depois do "Aceitar";
 * recusar é tão fácil quanto aceitar, e a escolha muda pelo rodapé ("Preferências de cookies").
 */
export function Analytics() {
  const pathname = usePathname();
  // começa fechado: a página é estática e o localStorage só existe no navegador
  const [atual, setAtual] = useState<Consentimento | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const c = lerConsentimento();
    setAtual(c);
    setAberto(c === null);
    const abrir = () => setAberto(true);
    window.addEventListener(EVENTO_ABRIR_AVISO_COOKIES, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_AVISO_COOKIES, abrir);
  }, []);

  // window.location.pathname mantém a barra final das URLs do site (/bancos/), igual aos relatórios antigos
  useEffect(() => { registrarVisita(window.location.pathname); }, [pathname]);

  const escolher = (escolha: Consentimento) => {
    gravarConsentimento(escolha);
    if (escolha === 'aceito') {
      registrarVisita(window.location.pathname);
      track('consent_choice', { choice: 'granted' });
    } else {
      desligarAnalytics();
    }
    setAtual(escolha);
    setAberto(false);
  };

  if (!aberto) return null;
  return (
    <Paper
      role="dialog"
      aria-labelledby="consent-titulo"
      elevation={6}
      variant="elevation"
      sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 560, mx: 'auto', p: 2, zIndex: 1400 }}
      data-testid="consent"
    >
      <Typography id="consent-titulo" variant="subtitle2" component="p" sx={{ mb: 0.5 }}>Cookies e contagem de visitas</Typography>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        Se você aceitar, o Google Analytics conta as visitas e o uso das ferramentas, sem dados pessoais, para decidirmos as próximas.
        Sem o aceite, nada do Google é carregado. Não há anúncios e nenhum dado é vendido. <Link href="/privacidade/">Saiba mais</Link>.
      </Typography>
      {atual && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} data-testid="consent-atual">
          Sua escolha atual: {atual === 'aceito' ? 'contagem de visitas permitida' : 'contagem de visitas recusada'}.
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <Button onClick={() => escolher('recusado')} data-testid="consent-deny">Recusar</Button>
        <Button variant="contained" onClick={() => escolher('aceito')} data-testid="consent-accept">Aceitar</Button>
      </Stack>
    </Paper>
  );
}

/** Botão que reabre o aviso de cookies (rodapé e página de privacidade). */
export function BotaoPreferenciasCookies({ children = 'Preferências de cookies' }: { children?: string }) {
  return (
    <Button
      variant="text"
      size="small"
      onClick={abrirAvisoCookies}
      sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', font: 'inherit', textDecoration: 'underline', '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' } }}
      data-testid="preferencias-cookies"
    >
      {children}
    </Button>
  );
}
