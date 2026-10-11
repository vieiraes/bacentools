'use client';

import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { decodificarId, FONTES_ID } from '@/lib/identificadores';
import { fetchPixParticipants } from '@/lib/sources/fetchers';
import { debounced, track } from '@/lib/analytics';

const trackDecode = debounced((tipo: string, valido: boolean) => track('decode', { area: 'identificador', item_id: tipo, result: valido ? 'valido' : 'invalido' }));

const EXEMPLOS = [
  { rotulo: 'EndToEndId', valor: 'E00000000202610111430abcDEF12345' },
  { rotulo: 'Devolução (RtrId)', valor: 'D00000000202610111445k1x2Y3z4W5v' },
  { rotulo: 'UUID v7', valor: '019dd3a0-2b40-7000-8000-000000000000' },
];

export function IdentificadoresView() {
  const [texto, setTexto] = useState('');
  const r = useMemo(() => (texto.trim() ? decodificarId(texto) : null), [texto]);
  const precisaParticipantes = r?.tipo === 'endtoend' || r?.tipo === 'devolucao';
  const participantes = useQuery({ queryKey: ['pix-participants'], queryFn: () => fetchPixParticipants(), enabled: precisaParticipantes });
  const instituicao = precisaParticipantes ? participantes.data?.data.find((p) => p.ispb === r.ispb) : undefined;

  const mudar = (t: string) => {
    setTexto(t);
    if (t.trim()) {
      const d = decodificarId(t);
      trackDecode(d.tipo, d.valido);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <TextField
            label="EndToEndId, RtrId ou UUID"
            placeholder="E00000000202610111430abcDEF12345"
            fullWidth
            value={texto}
            onChange={(e) => mudar(e.target.value)}
            slotProps={{ htmlInput: { 'data-testid': 'id-input', spellCheck: false, style: { fontFamily: 'monospace' } } }}
          />
          <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            {EXEMPLOS.map((e) => <Button key={e.rotulo} size="small" variant="outlined" onClick={() => mudar(e.valor)}>{e.rotulo}</Button>)}
          </Stack>
        </CardContent>
      </Card>

      {r && (
        <Card data-testid="id-resultado">
          <CardContent>
            {r.erros.length > 0 ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{r.erros.map((e) => <li key={e}>{e}</li>)}</ul>
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>Formato válido.</Alert>
            )}
            {r.campos.length > 0 && (
              <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', '@media (min-width: 600px)': { gridTemplateColumns: '190px minmax(0, 1fr)', columnGap: 2 }, rowGap: 0.75, '& dt': { fontWeight: 700 }, '& dd': { m: 0, overflowWrap: 'anywhere' } }}>
                {r.campos.map((c) => (
                  <Fragment key={c.rotulo}>
                    <dt>{c.rotulo}</dt>
                    <dd>
                      <span style={{ fontFamily: 'monospace' }}>{c.valor}</span>
                      {c.rotulo === 'Agente que gerou' && precisaParticipantes && (
                        <Typography component="span" sx={{ ml: 1 }} data-testid="id-instituicao">
                          {instituicao ? `· ${instituicao.name}` : participantes.isLoading ? '· procurando…' : participantes.isError ? '' : '· não é um ISPB da lista do Pix (pode ser a raiz do CNPJ de um iniciador)'}
                        </Typography>
                      )}
                      {c.dica && <Typography variant="body2" color="text.secondary">{c.dica}</Typography>}
                    </dd>
                  </Fragment>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Typography variant="body2" color="text.secondary">
        Fontes: {FONTES_ID.e2e}; {FONTES_ID.rtr}; {FONTES_ID.uuid}. Instituições pela lista de participantes do Pix (BrasilAPI, dados do BCB).
      </Typography>
    </Stack>
  );
}
