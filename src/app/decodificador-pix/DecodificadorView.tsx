'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { comCrcCorrigido, decodificarBrCode, EXEMPLOS, FONTE_BRCODE, ROTULO_CHAVE, ROTULO_TIPO, type Elemento } from '@/lib/brcode/brcode';
import { debounced, track } from '@/lib/analytics';

const trackDecode = debounced((valido: boolean, tipo: string) => track('decode', { area: 'brcode', item_id: tipo, result: valido ? 'valido' : 'invalido' }));

function Linhas({ elementos, nivel = 0 }: { elementos: Elemento[]; nivel?: number }) {
  return elementos.map((e) => (
    <Fragment key={`${nivel}-${e.pos}`}>
      <TableRow>
        <TableCell sx={{ pl: 2 + nivel * 3, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{nivel ? '└ ' : ''}{e.id}</TableCell>
        <TableCell>{e.nome}</TableCell>
        <TableCell align="right">{e.tamanho}</TableCell>
        <TableCell sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{e.filhos?.length ? '' : e.valor}</TableCell>
      </TableRow>
      {e.filhos && <Linhas elementos={e.filhos} nivel={nivel + 1} />}
    </Fragment>
  ));
}

export function DecodificadorView() {
  const [texto, setTexto] = useState('');
  // vindo do gerador: /decodificador-pix/?codigo=...
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('codigo');
    if (c) setTexto(c);
  }, []);
  const r = useMemo(() => (texto.trim() ? decodificarBrCode(texto) : null), [texto]);
  const corrigido = r && !r.crc.ok && r.crc.calculado ? comCrcCorrigido(texto) : null;

  const mudar = (t: string, origem = 'colado') => {
    setTexto(t);
    if (!t.trim()) return;
    const d = decodificarBrCode(t);
    if (origem === 'colado') trackDecode(d.valido, d.tipo);
    else track('select_content', { content_type: 'exemplo_brcode', item_id: origem });
  };

  const campos: [string, string | undefined][] = r
    ? [
        ['Tipo', ROTULO_TIPO[r.tipo]],
        ['Chave Pix', r.campos.chave && `${r.campos.chave} (${ROTULO_CHAVE[r.campos.tipoChave!]})`],
        ['URL do payload', r.campos.url],
        ['URL da recorrência', r.campos.urlRecorrencia],
        ['Valor', r.campos.valor && (Number.isFinite(Number(r.campos.valor)) ? Number(r.campos.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : r.campos.valor)],
        ['Nome no QR Code', r.campos.nome],
        ['Cidade', r.campos.cidade],
        ['txid', r.campos.txid],
        ['Informação adicional', r.campos.infoAdicional],
        ['Pix Saque (fss)', r.campos.fss && `ISPB do facilitador ${r.campos.fss}`],
        ['Uso único', r.campos.usoUnico ? 'Sim (ID 01 = 12)' : undefined],
        ['CRC', r.crc.informado && `${r.crc.informado}${r.crc.ok ? ' (confere)' : ` (o certo é ${r.crc.calculado})`}`],
      ]
    : [];

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <TextField
            label="Pix Copia e Cola (BR Code)"
            placeholder="00020126580014br.gov.bcb.pix…"
            multiline
            minRows={3}
            fullWidth
            value={texto}
            onChange={(e) => mudar(e.target.value)}
            slotProps={{ htmlInput: { 'data-testid': 'brcode-input', spellCheck: false, style: { fontFamily: 'monospace' } } }}
          />
          <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" onClick={() => mudar(EXEMPLOS.estatico, 'estatico')}>Exemplo estático do manual</Button>
            <Button size="small" variant="outlined" onClick={() => mudar(EXEMPLOS.dinamico, 'dinamico')}>Exemplo dinâmico do manual</Button>
            {texto && <Button size="small" onClick={() => setTexto('')}>Limpar</Button>}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Tudo roda no seu navegador: o código não é enviado a nenhum servidor e a URL do QR Code dinâmico não é acessada.
          </Typography>
        </CardContent>
      </Card>

      {r && (
        <>
          <Alert severity={r.valido ? 'success' : 'error'} data-testid="brcode-veredito">
            {r.valido
              ? `${ROTULO_TIPO[r.tipo]} válido segundo o Manual de Padrões do BCB.`
              : `Este código tem ${r.verificacoes.filter((v) => !v.ok && v.nivel === 'erro').length} problema(s). Veja abaixo o que corrigir.`}
            {corrigido && (
              <Box sx={{ mt: 1 }}>
                <Button size="small" variant="outlined" color="inherit" onClick={() => navigator.clipboard?.writeText(corrigido)}>
                  Copiar com o CRC corrigido
                </Button>
              </Box>
            )}
          </Alert>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h2" sx={{ mb: 1.5 }}>O que tem dentro</Typography>
                  <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', '@media (min-width: 600px)': { gridTemplateColumns: '150px minmax(0, 1fr)', columnGap: 2 }, rowGap: 0.75, '& dt': { fontWeight: 700 }, '& dd': { m: 0, overflowWrap: 'anywhere' } }}>
                    {campos.filter(([, v]) => v).map(([k, v]) => (
                      <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>
                    ))}
                  </Box>
                  {r.campos.nome && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      O app do pagador mostra o nome que está no DICT (estático) ou no payload da URL (dinâmico), não o nome escrito no QR Code (seção 2.6.3, nota 26).
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h2" sx={{ mb: 1 }}>Conferência campo a campo</Typography>
                  <List dense disablePadding data-testid="brcode-verificacoes">
                    {r.verificacoes.map((v) => (
                      <ListItem key={v.id} disableGutters alignItems="flex-start" data-ok={v.ok} data-id={v.id}>
                        <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                          {v.ok ? <CheckCircleIcon color="success" fontSize="small" titleAccess="ok" /> : v.nivel === 'erro' ? <ErrorIcon color="error" fontSize="small" titleAccess="erro" /> : <WarningIcon color="warning" fontSize="small" titleAccess="aviso" />}
                        </ListItemIcon>
                        <ListItemText primary={v.mensagem} secondary={v.fonte} slotProps={{ primary: { sx: { overflowWrap: 'anywhere' } } }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h2" sx={{ mb: 1 }}>Estrutura (ID, nome, tamanho, valor)</Typography>
              <TableContainer>
                <Table size="small" aria-label="Estrutura do BR Code">
                  <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Nome</TableCell><TableCell align="right">Tam.</TableCell><TableCell>Valor</TableCell></TableRow></TableHead>
                  <TableBody><Linhas elementos={r.elementos} /></TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      <Typography variant="body2" color="text.secondary">
        Fonte: <Link href={FONTE_BRCODE.url}>{FONTE_BRCODE.titulo}, versão {FONTE_BRCODE.versao}</Link> (Banco Central do Brasil), seções 2.5 a 2.8.
      </Typography>
    </Stack>
  );
}
