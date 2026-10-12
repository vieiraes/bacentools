'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { PERFIS, validarLead, type TipoLead } from '@/lib/leads';
import { track } from '@/lib/analytics';
import { RECAPTCHA_SITE_KEY } from '@/lib/protecao';

type Estado = 'editando' | 'enviando' | 'enviado' | 'falhou';

/**
 * Formulário de lead. "newsletter": e-mail + perfil (Mudou no Pix). "contato": nome, e-mail, empresa e mensagem.
 * O campo "site" é uma isca para robôs: fica fora da tela e de leitores de tela.
 */
export function LeadForm({ tipo, origem }: { tipo: TipoLead; origem: string }) {
  const [erros, setErros] = useState<Partial<Record<string, string>>>({});
  const [estado, setEstado] = useState<Estado>('editando');

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = validarLead({ ...Object.fromEntries(f), tipo, consentimento: f.get('consentimento') === 'on' }, origem);
    if (!r.ok) {
      setErros(r.erros);
      if (r.robo) setEstado('enviado'); // o robô acha que deu certo
      return;
    }
    setErros({});
    setEstado('enviando');
    try {
      const { salvarLead } = await import('@/services/firebase');
      await salvarLead(r.doc);
      setEstado('enviado');
      track('generate_lead', { lead_type: tipo, perfil: 'perfil' in r.doc ? r.doc.perfil : undefined, area: origem });
    } catch {
      setEstado('falhou');
    }
  }

  if (estado === 'enviado') {
    return (
      <Alert severity="success" data-testid={`lead-ok-${tipo}`}>
        {tipo === 'newsletter'
          ? 'Inscrição feita! Você vai receber um e-mail quando o Pix mudar (normas, catálogo de erros, informes do BCB).'
          : 'Mensagem enviada! Respondo no e-mail que você informou.'}
      </Alert>
    );
  }

  const id = (c: string) => `${tipo}-${c}`;
  return (
    <Box component="form" noValidate onSubmit={enviar} onFocus={() => { void import('@/services/firebase').then((f) => f.prepararProtecao()); }} aria-label={tipo === 'newsletter' ? 'Inscrição na newsletter' : 'Formulário de contato'} data-testid={`lead-form-${tipo}`}>
      <Stack spacing={2}>
        {tipo === 'contato' && (
          <TextField id={id('nome')} name="nome" label="Nome" autoComplete="name" required error={!!erros.nome} helperText={erros.nome} slotProps={{ htmlInput: { maxLength: 120 } }} />
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField id={id('email')} name="email" type="email" label="E-mail" autoComplete="email" required fullWidth error={!!erros.email} helperText={erros.email} slotProps={{ htmlInput: { maxLength: 254 } }} />
          {tipo === 'newsletter' ? (
            <TextField id={id('perfil')} name="perfil" select label="Você é" required defaultValue="" fullWidth error={!!erros.perfil} helperText={erros.perfil}>
              {PERFIS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </TextField>
          ) : (
            <TextField id={id('empresa')} name="empresa" label="Empresa (opcional)" autoComplete="organization" fullWidth error={!!erros.empresa} helperText={erros.empresa} slotProps={{ htmlInput: { maxLength: 120 } }} />
          )}
        </Stack>
        {tipo === 'contato' && (
          <TextField id={id('mensagem')} name="mensagem" label="Como posso ajudar?" multiline minRows={4} required error={!!erros.mensagem} helperText={erros.mensagem} slotProps={{ htmlInput: { maxLength: 2000 } }} />
        )}
        <Box aria-hidden="true" sx={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor={id('site')}>Não preencha este campo</label>
          <input id={id('site')} name="site" type="text" tabIndex={-1} autoComplete="off" />
        </Box>
        <Box>
          <FormControlLabel
            control={<Checkbox name="consentimento" />}
            label={
              <>
                {tipo === 'newsletter' ? 'Aceito receber e-mails do BacenTools' : 'Aceito ser contatado pelo e-mail informado'}, conforme a{' '}
                <Link href="/privacidade/">política de privacidade</Link>. Posso cancelar quando quiser.
              </>
            }
          />
          {erros.consentimento && <FormHelperText error>{erros.consentimento}</FormHelperText>}
        </Box>
        {RECAPTCHA_SITE_KEY && <FormHelperText>
          Protegido pelo reCAPTCHA do Google: valem a <a href="https://policies.google.com/privacy?hl=pt-BR">Política de Privacidade</a> e os{' '}
          <a href="https://policies.google.com/terms?hl=pt-BR">Termos de Serviço</a> do Google.
        </FormHelperText>}
        {estado === 'falhou' && <Alert severity="error">Não consegui enviar agora. Confira sua conexão e tente de novo.</Alert>}
        <Box>
          <Button type="submit" variant="contained" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando…' : tipo === 'newsletter' ? 'Quero receber' : 'Enviar mensagem'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
