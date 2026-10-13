'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DOMINIOS, EVENTOS, FONTES_SPB, PARTICIPANTE, formatoDoTipo, mensagemPorCodigo, type Campo } from '@/lib/spb/catalogo';
import { FLUXO2, GRUPOS, MULTIPLICIDADE, ROTULO_DOMINIO } from '@/lib/spb/textos';
import { track } from '@/lib/analytics';

const ROTULO_EVENTO: Record<string, string> = {
  STR0008: 'TED no STR',
  STR0010: 'Devolução no STR',
  PAG0108: 'TED no SITRAF',
  PAG0111: 'Devolução no SITRAF',
};
const PAPEL_MSG = (codigo: string) => (codigo.endsWith('R1') ? 'Resposta ao emissor (R1)' : codigo.endsWith('R2') ? 'Aviso ao destinatário (R2)' : 'Requisição');

function Linhas({ campos, nivel = 0 }: { campos: Campo[]; nivel?: number }) {
  return campos.map((c) => {
    const dominio = c.tipo && DOMINIOS[c.tipo.nome] ? c.tipo.nome : undefined;
    return (
      <Fragment key={`${nivel}-${c.tag}`}>
        <TableRow data-tag={c.tag}>
          <TableCell sx={{ pl: 2 + nivel * 3, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {nivel ? '└ ' : ''}&lt;{c.tag}&gt;
          </TableCell>
          <TableCell>
            <strong>{c.nome}</strong>
            {c.descricao && c.descricao !== c.nome && <Typography variant="body2" color="text.secondary">{c.descricao}</Typography>}
          </TableCell>
          <TableCell sx={{ whiteSpace: 'nowrap' }}>
            [{c.obrigatorio ? 1 : 0}..{c.repete ?? 1}]
            {c.ou && <Chip size="small" label={`OU ${c.ou}`} color="secondary" variant="outlined" sx={{ ml: 0.5 }} />}
          </TableCell>
          <TableCell sx={{ overflowWrap: 'anywhere' }}>
            {c.fixo ? <>sempre <code>{c.fixo}</code></> : formatoDoTipo(c.tipo)}
            {dominio && (
              <Box>
                <MuiLink component={Link} href={`/spb/dominios/#${dominio}`}>{ROTULO_DOMINIO[dominio] ?? dominio}: {DOMINIOS[dominio].length} valores</MuiLink>
              </Box>
            )}
          </TableCell>
        </TableRow>
        {c.campos && <Linhas campos={c.campos} nivel={nivel + 1} />}
      </Fragment>
    );
  });
}

function TabelaCampos({ campos, rotulo }: { campos: Campo[]; rotulo: string }) {
  return (
    <TableContainer tabIndex={0} role="region" aria-label={`${rotulo} (role para o lado)`}>
      <Table size="small" aria-label={rotulo}>
        <TableHead>
          <TableRow>
            <TableCell>Tag</TableCell>
            <TableCell>Campo</TableCell>
            <TableCell>Mult.</TableCell>
            <TableCell>Formato</TableCell>
          </TableRow>
        </TableHead>
        <TableBody><Linhas campos={campos} /></TableBody>
      </Table>
    </TableContainer>
  );
}

export function MensagensView() {
  const [codigo, setCodigo] = useState('STR0008');
  // lê o #código ao abrir e quando o endereço muda na mesma página (link para outra mensagem)
  useEffect(() => {
    const ler = () => {
      const h = decodeURIComponent(window.location.hash.slice(1)).toUpperCase();
      if (h && mensagemPorCodigo(h)) setCodigo(h);
    };
    ler();
    window.addEventListener('hashchange', ler);
    return () => window.removeEventListener('hashchange', ler);
  }, []);
  const escolher = (c: string) => {
    setCodigo(c);
    history.replaceState(null, '', `#${c}`);
    track('select_content', { content_type: 'mensagem_spb', item_id: c });
  };

  const { evento, mensagem } = mensagemPorCodigo(codigo)!;
  const requisicao = mensagem.codigo === evento.codigo;
  const versao = FONTES_SPB.catalogo[FONTES_SPB.versao];

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1.5 }} role="group" aria-label="Evento">
          {EVENTOS.map((e) => (
            <Chip
              key={e.codigo}
              label={`${e.codigo} · ${ROTULO_EVENTO[e.codigo]}`}
              color={e.codigo === evento.codigo ? 'primary' : 'default'}
              variant={e.codigo === evento.codigo ? 'filled' : 'outlined'}
              aria-pressed={e.codigo === evento.codigo}
              onClick={() => escolher(e.codigo)}
              data-testid={`evento-${e.codigo}`}
            />
          ))}
        </Stack>
        <ToggleButtonGroup exclusive size="small" value={mensagem.codigo} onChange={(_, v) => v && escolher(v)} aria-label="Mensagem do evento" sx={{ flexWrap: 'wrap' }}>
          {evento.mensagens.map((m) => (
            <ToggleButton key={m.codigo} value={m.codigo} data-testid={`msg-${m.codigo}`}>
              {m.codigo} · {PAPEL_MSG(m.codigo)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Card data-testid="mensagem">
        <CardContent>
          <Typography variant="h2">{mensagem.codigo}: {mensagem.titulo}</Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
            <Chip size="small" label={`De: ${PARTICIPANTE[mensagem.emissor] ?? mensagem.emissor}`} />
            <Chip size="small" label={`Para: ${PARTICIPANTE[mensagem.destinatario] ?? mensagem.destinatario}`} />
            <Chip size="small" variant="outlined" label={`Evento ${evento.codigo}: ${evento.fluxo}`} />
            <Chip size="small" variant="outlined" label="Domínio de sistema SPB01" />
          </Stack>
          <Typography sx={{ mt: 1.5 }}>{evento.descricao}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {GRUPOS[evento.grupo].resumo.texto} <em>({GRUPOS[evento.grupo].resumo.fonte})</em>
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h2" sx={{ mb: 1 }}>Campos ({mensagem.campos.length} no primeiro nível)</Typography>
          <TabelaCampos campos={mensagem.campos} rotulo={`Campos da ${mensagem.codigo}`} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {MULTIPLICIDADE.texto} <em>({MULTIPLICIDADE.fonte})</em>
          </Typography>
        </CardContent>
      </Card>

      {requisicao && evento.regras.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h2" sx={{ mb: 1 }}>Regras do evento {evento.codigo}</Typography>
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', '@media (min-width: 600px)': { gridTemplateColumns: '110px minmax(0, 1fr)', columnGap: 2 }, rowGap: 1, '& dt': { fontFamily: 'monospace', fontWeight: 700 }, '& dd': { m: 0 } }}>
              {evento.regras.map((r) => <Fragment key={r.codigo}><dt>{r.codigo}</dt><dd>{r.texto}</dd></Fragment>)}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Textos do Dicionário de Regras, Catálogo {FONTES_SPB.versao}, Volume IV.</Typography>
          </CardContent>
        </Card>
      )}

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h3" component="h2" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Envelope BCMSG (vai em toda mensagem)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ mb: 1 }}>
            Toda mensagem é um documento <code>&lt;DOC&gt;</code> com o envelope <code>&lt;BCMSG&gt;</code> (quem envia, para quem, domínio do sistema e o número único da operação, NUOp) e a mensagem em <code>&lt;SISMSG&gt;</code>.
          </Typography>
          <TabelaCampos campos={evento.bcmsg} rotulo="Campos do BCMSG" />
        </AccordionDetails>
      </Accordion>

      <Alert severity="info">
        <strong>{evento.fluxo}:</strong> {FLUXO2.texto} <em>({FLUXO2.fonte})</em>
      </Alert>

      <Typography variant="body2" color="text.secondary">
        Fonte: <MuiLink href={versao.xsd}>XSD oficiais do Catálogo de Serviços do SFN {FONTES_SPB.versao}</MuiLink> (arquivo <code>{evento.xsd}</code>) e{' '}
        <MuiLink href={versao.volumes[evento.volume]}>Volume {evento.volume}</MuiLink>.
        {FONTES_SPB.tedIgualNaVersaoAnterior && ` Esta mensagem é igual na versão ${FONTES_SPB.versaoAnterior}.`}
      </Typography>
    </Stack>
  );
}
