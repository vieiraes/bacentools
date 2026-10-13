'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HubIcon from '@mui/icons-material/Hub';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { actorsOf, destinos, nodeStates, rotulo, type Actor, type Outcome, type Scenario } from './model';
import { track } from '@/lib/analytics';

const ICON: Record<Actor, typeof HubIcon> = {
  PAGADOR: AccountBalanceIcon, RECEBEDOR: AccountBalanceIcon, SPI: HubIcon, DICT: MenuBookIcon,
  IF_DEBITADA: AccountBalanceIcon, IF_CREDITADA: AccountBalanceIcon, STR: HubIcon, SITRAF: HubIcon,
};
const COLOR: Record<Outcome, 'success' | 'error' | 'warning'> = { ok: 'success', erro: 'error', espera: 'warning' };
const STEP_MS = 1500;

/**
 * Animação do caminho do Pix: a "caixinha" (mensagem, com dinheiro quando é pagamento) viaja entre os participantes.
 * Em cada chegada, o destino acende: verde (ok), vermelho com tremida (rejeição) ou amarelo (esperando).
 * Respeita "reduzir movimento" do sistema e tem modo passo a passo.
 */
export function FlowAnimation({ scenario, amount = 'R$ 150,00' }: { scenario: Scenario; amount?: string }) {
  const reduce = useReducedMotion();
  const small = useMediaQuery(useTheme().breakpoints.down('sm'));
  const NODE = small ? 52 : 84; // tamanho do participante
  const RAIL = NODE / 2; // altura do trilho (centro dos participantes)
  const LANE = NODE + (small ? 34 : 54); // faixa do texto da mensagem, abaixo dos nomes
  const actors = useMemo(() => actorsOf(scenario), [scenario]);
  const [step, setStep] = useState(-1); // -1 = antes de começar; steps.length = terminou
  const [playing, setPlaying] = useState(false);
  const steps = scenario.steps;
  const done = step >= steps.length - 1 && step >= 0;

  // reinicia quando troca o cenário
  useEffect(() => { setStep(-1); setPlaying(false); }, [scenario.id]);

  useEffect(() => {
    if (!playing) return;
    if (step >= steps.length - 1) { setPlaying(false); return; }
    const t = window.setTimeout(() => setStep((s) => s + 1), step < 0 ? 200 : STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step, steps.length]);

  const xOf = (a: Actor) => {
    const i = actors.indexOf(a);
    return actors.length === 1 ? 50 : 10 + (i * 80) / (actors.length - 1);
  };
  const cur = step >= 0 ? steps[step] : null;
  const states = useMemo(() => nodeStates(scenario, step), [scenario, step]);

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 } }} data-testid="flow">
      <Box sx={{ position: 'relative', height: LANE + 44, mx: 'auto' }} aria-hidden>
        {/* trilho */}
        <Box sx={{ position: 'absolute', top: RAIL - 2, left: '10%', right: '10%', height: 4, bgcolor: 'divider', borderRadius: 2 }} />
        {actors.map((a) => {
          const Icon = ICON[a];
          const raw = states[a];
          const warned = raw === 'avisado';
          const st = warned ? undefined : raw;
          const active = cur && (destinos(cur).includes(a) || cur.from === a);
          return (
            <motion.div
              key={a}
              style={{ position: 'absolute', left: `${xOf(a)}%`, top: 0, translateX: '-50%', textAlign: 'center', width: small ? 76 : 120 }}
              animate={st === 'erro' && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{
                mx: 'auto', width: NODE, height: NODE, borderRadius: 3, display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1,
                bgcolor: st ? `${COLOR[st]}.main` : warned ? '#fdecea' : 'background.paper', color: st ? '#fff' : warned ? 'error.dark' : 'primary.main',
                border: 3, borderColor: active ? 'primary.main' : st ? `${COLOR[st]}.main` : warned ? 'error.light' : 'divider',
                boxShadow: active ? 4 : 0, transition: 'all .3s',
              }}>
                <Icon sx={{ fontSize: small ? 26 : 40 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.1, fontSize: small ? 12 : undefined }}>{rotulo(scenario, a).title}</Typography>
              {!small && <Typography variant="caption" color="text.secondary">{rotulo(scenario, a).subtitle}</Typography>}
            </motion.div>
          );
        })}

        <AnimatePresence>
          {cur && destinos(cur).map((para, i) => (
            <motion.div
              key={`dot-${step}-${i}`}
              initial={{ left: `${xOf(cur.from)}%`, opacity: 0, scale: 0.4 }}
              animate={{ left: `${xOf(para)}%`, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.1 } }}
              transition={reduce ? { duration: 0 } : { duration: 1, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: RAIL - 17, translateX: '-50%', zIndex: 3 }}
            >
              {/* a moedinha/envelope que corre pelo trilho */}
              <Box sx={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: 3,
                bgcolor: cur.outcome ? `${COLOR[cur.outcome]}.main` : 'primary.main', color: '#fff', border: 2, borderColor: '#fff' }}>
                {cur.money ? '💸' : cur.outcome === 'erro' ? '✕' : cur.outcome === 'espera' ? '⏳' : '✉️'}
              </Box>
            </motion.div>
          ))}
          {cur && (
            <motion.div
              key={`label-${step}`}
              initial={{ left: `${Math.min(80, Math.max(20, xOf(cur.from)))}%`, opacity: 0 }}
              animate={{ left: `${Math.min(80, Math.max(20, destinos(cur).length > 1 ? xOf(cur.from) : (xOf(cur.from) + xOf(destinos(cur)[0])) / 2))}%`, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={reduce ? { duration: 0 } : { duration: 0.8, ease: 'easeOut', delay: 0.12 }}
              style={{ position: 'absolute', top: LANE, translateX: '-50%', zIndex: 2 }}
            >
              <Chip
                size={small ? 'small' : 'medium'}
                color={cur.outcome ? COLOR[cur.outcome] : 'primary'}
                variant={cur.outcome ? 'filled' : 'outlined'}
                label={`${cur.message}${cur.money ? ` · ${amount}` : ''}${cur.code ? ` · ${cur.code}` : ''}`}
                sx={{ fontWeight: 700, bgcolor: cur.outcome ? undefined : 'background.paper', maxWidth: small ? 200 : 360 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
        {!done ? (
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => { setPlaying(true); if (step < 0) track('scenario_play', { item_id: scenario.id, mode: 'auto' }); }} disabled={playing} data-testid="play">
            {step < 0 ? scenario.playLabel ?? 'Enviar o Pix' : 'Continuar'}
          </Button>
        ) : (
          <Button variant="contained" startIcon={<ReplayIcon />} onClick={() => { setStep(-1); setPlaying(true); }} data-testid="replay">De novo</Button>
        )}
        <Button variant="outlined" startIcon={<SkipNextIcon />} disabled={done || playing} onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} data-testid="next">
          Próximo passo
        </Button>
        {done && (
          <Chip data-testid="result"
            icon={steps.some((s) => s.outcome === 'erro') ? <CancelIcon /> : <CheckCircleIcon />}
            color={steps.some((s) => s.outcome === 'erro') ? 'error' : 'success'}
            label={steps.some((s) => s.outcome === 'erro') ? `${scenario.failLabel ?? 'Pix não concluído'}${steps.find((s) => s.code)?.code ? ` · ${steps.find((s) => s.code)!.code}` : ''}` : scenario.okLabel ?? 'Pix concluído'}
          />
        )}
      </Box>

      {/* passos em texto: a mesma informação da animação, para leitor de tela e para quem prefere ler */}
      <Box component="ol" aria-live="polite" aria-label="Passos do cenário" data-testid="steps" sx={{ mt: 2, mb: 0, pl: 3 }}>
        {steps.slice(0, step + 1).map((s, i) => (
          <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }} data-outcome={s.outcome ?? 'ok'}>
            <strong>{rotulo(scenario, s.from).title} → {destinos(s).map((d) => rotulo(scenario, d).title).join(' e ')}</strong> · <code>{s.message}</code>{s.code && <> · <strong>{s.code}</strong></>}: {s.label}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
}
