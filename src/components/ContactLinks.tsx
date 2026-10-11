'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import GitHubIcon from '@mui/icons-material/GitHub';
import { track } from '@/lib/analytics';
import { CRIADOR } from '@/lib/tools';

/** Canais públicos do criador. Cada clique vira o evento contact_click (conversão no GA4). */
export function ContactLinks() {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <Button variant="outlined" startIcon={<GitHubIcon />} href={CRIADOR.github} target="_blank" rel="noopener" onClick={() => track('contact_click', { channel: 'github' })}>
        GitHub
      </Button>
      <Button variant="outlined" href="#contato" onClick={() => track('contact_click', { channel: 'formulario' })}>
        Falar comigo
      </Button>
    </Stack>
  );
}
