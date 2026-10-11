'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { gerarBrCode, LIMITES, type DadosQr } from '@/lib/brcode/gerar';
import { ROTULO_CHAVE } from '@/lib/brcode/brcode';
import { track } from '@/lib/analytics';

const VAZIO: DadosQr = { chave: '', nome: '', cidade: '', valor: '', txid: '', infoAdicional: '' };

export function GeradorView() {
  const [d, setD] = useState<DadosQr>(VAZIO);
  const [tocado, setTocado] = useState(false);
  const [svg, setSvg] = useState('');
  const [copiado, setCopiado] = useState(false);
  const r = useMemo(() => gerarBrCode(d), [d]);
  const codigo = r.ok ? r.codigo : '';

  useEffect(() => {
    if (!codigo) return setSvg('');
    let vivo = true;
    import('qrcode').then((q) => q.toString(codigo, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 })).then((s) => vivo && setSvg(s));
    return () => { vivo = false; };
  }, [codigo]);

  const campo = (k: keyof DadosQr) => ({
    value: d[k] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setTocado(true); setD({ ...d, [k]: e.target.value }); },
    error: tocado && !r.ok && !!r.erros[k] && !!d[k],
    helperText: (tocado && !r.ok && d[k] && r.erros[k]) || undefined,
    fullWidth: true,
    slotProps: { htmlInput: { 'data-testid': `gerador-${k}` } },
  });

  async function copiar() {
    await navigator.clipboard?.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
    track('generate_brcode', { action: 'copiar', key_type: r.ok ? r.tipoChave : undefined, item_id: d.valor ? 'com_valor' : 'sem_valor' });
  }

  async function baixarPng() {
    const q = await import('qrcode');
    const url = await q.toDataURL(codigo, { errorCorrectionLevel: 'M', margin: 2, width: 1024 });
    Object.assign(document.createElement('a'), { href: url, download: 'qrcode-pix.png' }).click();
    track('generate_brcode', { action: 'baixar_png', key_type: r.ok ? r.tipoChave : undefined });
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardContent>
            <Stack spacing={2} component="form" aria-label="Dados do QR Code" onSubmit={(e) => e.preventDefault()}>
              <TextField label="Chave Pix" placeholder="e-mail, CPF, CNPJ, celular ou chave aleatória" required {...campo('chave')} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Nome de quem recebe" required {...campo('nome')} helperText={campo('nome').helperText ?? `Até ${LIMITES.nome} caracteres, sem acentos`} />
                <TextField label="Cidade" required {...campo('cidade')} helperText={campo('cidade').helperText ?? `Até ${LIMITES.cidade} caracteres`} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Valor (opcional)" placeholder="10,50" inputMode="decimal" {...campo('valor')} helperText={campo('valor').helperText ?? 'Vazio: quem paga digita o valor'} />
                <TextField label="txid (opcional)" placeholder="PEDIDO123" {...campo('txid')} helperText={campo('txid').helperText ?? 'Para conciliar: letras e números, até 25'} />
              </Stack>
              <TextField label="Informação adicional (opcional)" {...campo('infoAdicional')} helperText={campo('infoAdicional').helperText ?? 'Aparece para quem paga, como uma descrição'} />
              <Box>
                <Button onClick={() => { setTocado(false); setD({ chave: '123e4567-e12b-12d1-a456-426655440000', nome: 'Fulano de Tal', cidade: 'BRASILIA', valor: '', txid: '', infoAdicional: '' }); }} size="small" variant="outlined">
                  Preencher com o exemplo do manual
                </Button>
                {tocado && <Button size="small" sx={{ ml: 1 }} onClick={() => { setTocado(false); setD(VAZIO); }}>Limpar</Button>}
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Alert severity="warning" sx={{ mt: 2 }}>
          O QR Code gerado é real: se alguém pagar, o dinheiro vai para a chave informada. Para testes, use uma chave sua.
          O nome que aparece para quem paga é o cadastrado no DICT, não o digitado aqui (seção 2.6.3, nota 26).
        </Alert>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }} sx={{ minWidth: 0 }}>
        <Card sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
          <CardContent>
            {r.ok ? (
              <Stack spacing={2} data-testid="gerador-resultado">
                <Box
                  role="img"
                  aria-label="QR Code Pix gerado"
                  sx={{ mx: 'auto', width: '100%', maxWidth: 280, aspectRatio: '1', bgcolor: '#fff', '& svg': { width: '100%', height: '100%', display: 'block' } }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <Typography variant="body2" color="text.secondary" align="center">
                  Chave do tipo {ROTULO_CHAVE[r.tipoChave]}{d.valor ? '' : ', sem valor fixo'}.
                </Typography>
                {r.avisos.map((a) => <Alert key={a} severity="info">{a}</Alert>)}
                <TextField label="Pix Copia e Cola" value={codigo} multiline fullWidth slotProps={{ htmlInput: { readOnly: true, 'data-testid': 'gerador-codigo', style: { fontFamily: 'monospace', fontSize: 13 } } }} />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button variant="contained" onClick={copiar}>{copiado ? 'Copiado!' : 'Copiar código'}</Button>
                  <Button variant="outlined" onClick={baixarPng}>Baixar PNG</Button>
                  <Button component={Link} href={`/decodificador-pix/?codigo=${encodeURIComponent(codigo)}`}>Conferir no decodificador</Button>
                </Stack>
              </Stack>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }} data-testid="gerador-vazio">
                <Typography color="text.secondary">Preencha chave, nome e cidade para gerar o QR Code.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Tudo é feito no seu navegador: nada do que você digita é enviado. Limites de nome, cidade e valor: especificação EMV® QRCPS-MPM, citada pelo manual do BCB (nota 25).
        </Typography>
      </Grid>
    </Grid>
  );
}
