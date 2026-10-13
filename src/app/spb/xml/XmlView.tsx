'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { DOMINIOS, eventoPorCodigo, formatoDoTipo, type Campo } from '@/lib/spb/catalogo';
import { ROTULO_DOMINIO } from '@/lib/spb/textos';
import { ISPB_BCB, dataBrasilia, descricaoCodigo, emUtf16be, gerarNuop, montarXml, validarXml, type Validacao } from '@/lib/spb/xml';
import { debounced, track } from '@/lib/analytics';

type Montavel = 'STR0008' | 'STR0010';
const hoje = () => { const d = dataBrasilia(new Date()); return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`; };
const EXEMPLO: Record<Montavel, Record<string, string>> = {
  STR0008: {
    NumCtrlIF: 'TED0001', ISPBIFDebtd: '60701190', AgDebtd: '1234', TpCtDebtd: 'CC', CtDebtd: '123456', TpPessoaDebtd: 'F', CNPJ_CPFCliDebtd: '12345678909', NomCliDebtd: 'Ana Souza',
    ISPBIFCredtd: '00000000', AgCredtd: '4321', TpCtCredtd: 'CC', CtCredtd: '654321', TpPessoaCredtd: 'F', CNPJ_CPFCliCredtd: '11144477735', NomCliCredtd: 'Bia Lima',
    VlrLanc: '1500.00', FinlddCli: '10',
  },
  STR0010: { NumCtrlIF: 'DEV0001', ISPBIFDebtd: '00000000', ISPBIFCredtd: '60701190', VlrLanc: '1500.00', CodDevTransf: '2', NumCtrlSTROr: 'STR20261013000000001' },
};
/** true só depois que a página abriu no navegador (o validador usa o DOMParser do navegador). */
function useNoNavegador() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}

const trackValidar = debounced((ok: boolean, codigo?: string) => track('decode', { area: 'xml-spb', item_id: codigo, result: ok ? 'valido' : 'invalido' }));

function Achados({ r }: { r: Validacao }) {
  if (!r.achados.length) return <Alert severity="success" data-testid="xml-veredito">XML válido: estrutura, tipos e regras conferidos ({r.codigo}).</Alert>;
  const erros = r.achados.filter((a) => a.nivel === 'erro').length;
  return (
    <Box>
      <Alert severity={erros ? 'error' : 'warning'} data-testid="xml-veredito">
        {erros ? `${erros} erro(s): o prestador recusaria esta mensagem.` : 'Sem erros, só avisos.'}
      </Alert>
      <List dense data-testid="xml-achados">
        {r.achados.map((a, i) => (
          <ListItem key={i} disableGutters alignItems="flex-start" data-codigo={a.codigo}>
            <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>{a.nivel === 'erro' ? <ErrorIcon color="error" fontSize="small" /> : <WarningIcon color="warning" fontSize="small" />}</ListItemIcon>
            <ListItemText
              primary={a.mensagem}
              slotProps={{ primary: { sx: { overflowWrap: 'anywhere' } } }}
              secondary={
                <>
                  {a.retorno && <>Voltaria {a.retorno === 'GEN0004' ? 'na GEN0004 (erro de transmissão)' : `como ${r.codigo ?? 'a mensagem'}E (erro de conteúdo)`}. </>}
                  {a.codigo && <>Código provável, pela descrição: <MuiLink component={Link} href={`/spb/erros/${a.codigo.toLowerCase()}/`}>{a.codigo}</MuiLink> ({descricaoCodigo(a.codigo)}). </>}
                  <em>{a.fonte}</em>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

function CampoForm({ c, valores, set }: { c: Campo; valores: Record<string, string>; set: (tag: string, v: string) => void }) {
  if (c.fixo) return null;
  if (c.campos) {
    return (
      <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{c.nome} (opcional: só entra no XML se algum campo for preenchido)</Typography>
        <Stack spacing={1.5}>{c.campos.map((x) => <CampoForm key={x.tag} c={x} valores={valores} set={set} />)}</Stack>
      </Box>
    );
  }
  const dominio = c.tipo && DOMINIOS[c.tipo.nome];
  const comum = {
    id: `campo-${c.tag}`, label: `${c.nome} <${c.tag}>${c.obrigatorio ? ' *' : ''}`, value: valores[c.tag] ?? '', fullWidth: true, size: 'small' as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(c.tag, e.target.value),
    helperText: `${c.ou ? `Grupo OU ${c.ou}: preencha só um. ` : ''}${dominio ? (ROTULO_DOMINIO[c.tipo!.nome] ?? '') : formatoDoTipo(c.tipo)}`,
    slotProps: { htmlInput: { 'data-testid': `campo-${c.tag}` } },
  };
  if (dominio) {
    return (
      <TextField select {...comum}>
        <MenuItem value="">(vazio)</MenuItem>
        {dominio.map((d) => <MenuItem key={d.codigo} value={d.codigo}>{d.codigo} · {d.descricao}</MenuItem>)}
      </TextField>
    );
  }
  return <TextField {...comum} />;
}

function Montar({ aoValidar }: { aoValidar: (xml: string) => void }) {
  const [codigo, setCodigo] = useState<Montavel>('STR0008');
  const [valores, setValores] = useState<Record<string, string>>({ ...EXEMPLO.STR0008, DtMovto: '' });
  const [env, setEnv] = useState({ emissor: '', destinatario: ISPB_BCB, nuop: '' });
  const [copiado, setCopiado] = useState(false);
  // data e NUOp só no navegador (evita divergência de hidratação)
  useEffect(() => {
    setValores((v) => ({ ...v, DtMovto: v.DtMovto || hoje() }));
    setEnv((e) => ({ ...e, emissor: '60701190', nuop: gerarNuop('60701190', new Date(), Math.floor(Math.random() * 1e7)) }));
  }, []);
  const evento = eventoPorCodigo(codigo)!;
  const set = (tag: string, v: string) => setValores((x) => ({ ...x, [tag]: v }));
  const xml = useMemo(() => montarXml(codigo, valores, env), [codigo, valores, env]);
  const navegador = useNoNavegador();
  const r = useMemo(() => (navegador ? validarXml(xml, new DOMParser()) : null), [navegador, xml]);

  const trocar = (c: Montavel) => { setCodigo(c); setValores({ ...EXEMPLO[c], DtMovto: hoje() }); };
  const baixar = () => {
    const blob = new Blob([emUtf16be(xml)], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `${codigo}-${env.nuop}.xml` }).click();
    URL.revokeObjectURL(url);
    track('file_download', { file_name: `${codigo}.xml`, area: 'xml-spb' });
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={1.5}>
          <TextField select size="small" label="Mensagem" value={codigo} onChange={(e) => trocar(e.target.value as Montavel)} slotProps={{ htmlInput: { 'data-testid': 'xml-mensagem' } }}>
            <MenuItem value="STR0008">STR0008 · TED entre contas de clientes</MenuItem>
            <MenuItem value="STR0010">STR0010 · Devolução de transferência indevida</MenuItem>
          </TextField>
          <Typography variant="subtitle2" sx={{ pt: 1 }}>Envelope (BCMSG)</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField size="small" fullWidth label="ISPB do emissor" value={env.emissor} onChange={(e) => setEnv({ ...env, emissor: e.target.value })} />
            <TextField size="small" fullWidth label="ISPB do destinatário" value={env.destinatario} onChange={(e) => setEnv({ ...env, destinatario: e.target.value })} helperText="STR: Banco Central (00038166)" />
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField size="small" fullWidth label="NUOp" value={env.nuop} onChange={(e) => setEnv({ ...env, nuop: e.target.value })} helperText="ISPB do emissor + AAAAMMDD + 7 dígitos" />
            <Button size="small" onClick={() => setEnv({ ...env, nuop: gerarNuop(env.emissor, new Date(), Math.floor(Math.random() * 1e7)) })}>Novo</Button>
          </Stack>
          <Typography variant="subtitle2" sx={{ pt: 1 }}>{codigo} (SISMSG)</Typography>
          {evento.mensagens[0].campos.map((c) => <CampoForm key={c.tag} c={c} valores={valores} set={set} />)}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
        <Box sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
          <TextField label="XML" value={xml} multiline maxRows={14} fullWidth slotProps={{ htmlInput: { readOnly: true, 'data-testid': 'xml-saida', style: { fontFamily: 'monospace', fontSize: 12 } } }} />
          <Stack direction="row" spacing={1} useFlexGap sx={{ my: 1.5, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={async () => { await navigator.clipboard?.writeText(xml); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }}>{copiado ? 'Copiado!' : 'Copiar XML'}</Button>
            <Button variant="outlined" onClick={baixar}>Baixar (UTF-16 BE)</Button>
            <Button onClick={() => aoValidar(xml)}>Abrir no validador</Button>
          </Stack>
          {r && <Achados r={r} />}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            O arquivo baixado vem em UTF-16 BE com BOM, a codificação das mensagens do domínio SPB01 (Catálogo 5.13, Volume I, p. 11). Nada sai do seu navegador.
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
}

function Validar({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState(inicial);
  useEffect(() => setTexto(inicial), [inicial]);
  const navegador = useNoNavegador();
  const r = useMemo(() => (navegador && texto.trim() ? validarXml(texto, new DOMParser()) : null), [navegador, texto]);
  useEffect(() => { if (r) trackValidar(r.ok, r.codigo); }, [r]);
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="Cole o XML da mensagem"
          placeholder={'<?xml version="1.0"?>\n<DOC xmlns="http://www.bcb.gov.br/SPB/STR0008.xsd">…'}
          multiline minRows={14} fullWidth value={texto} onChange={(e) => setTexto(e.target.value)}
          slotProps={{ htmlInput: { 'data-testid': 'xml-entrada', spellCheck: false, style: { fontFamily: 'monospace', fontSize: 12 } } }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Aceita STR0008, STR0010, PAG0108, PAG0111 e as respostas R1/R2. Tudo é conferido no seu navegador.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
        {r ? (
          <Stack spacing={2}>
            <Achados r={r} />
            {r.campos.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h3" component="h2" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 1 }}>O que tem dentro</Typography>
                  <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', '@media (min-width: 600px)': { gridTemplateColumns: '180px minmax(0, 1fr)', columnGap: 2 }, rowGap: 0.5, '& dt': { fontWeight: 700 }, '& dd': { m: 0, overflowWrap: 'anywhere' } }}>
                    {r.campos.map((c) => (
                      <Fragment key={c.caminho}><dt>{c.nome}</dt><dd><code>{c.valor}</code>{c.significado && <> · {c.significado}</>}</dd></Fragment>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        ) : (
          <Alert severity="info">Cole um XML ao lado, ou monte um na aba “Montar”.</Alert>
        )}
      </Grid>
    </Grid>
  );
}

export function XmlView() {
  const [aba, setAba] = useState(0);
  const [paraValidar, setParaValidar] = useState('');
  return (
    <Stack spacing={2}>
      <Tabs value={aba} onChange={(_, v) => setAba(v)} aria-label="Montar ou validar">
        <Tab label="Montar" id="aba-montar" aria-controls="painel-montar" data-testid="aba-montar" />
        <Tab label="Validar" id="aba-validar" aria-controls="painel-validar" data-testid="aba-validar" />
      </Tabs>
      <Box role="tabpanel" id="painel-montar" aria-labelledby="aba-montar" hidden={aba !== 0}>{aba === 0 && <Montar aoValidar={(x) => { setParaValidar(x); setAba(1); }} />}</Box>
      <Box role="tabpanel" id="painel-validar" aria-labelledby="aba-validar" hidden={aba !== 1}>{aba === 1 && <Validar inicial={paraValidar} />}</Box>
    </Stack>
  );
}
