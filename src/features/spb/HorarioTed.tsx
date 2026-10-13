'use client';

import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { GRADE, type GradeHorario } from '@/lib/spb/catalogo';
import { ROTULO_DIA, situacao, type Situacao } from '@/lib/spb/grade';

const USO: Record<string, string> = {
  STR02: 'TED no mesmo dia (STR0008)',
  STR01: 'Devolução de TED (STR0010)',
  AGE01: 'TED e devolução com data de agendamento',
};
const janela = (j: GradeHorario['util']) => (j ? `${j.abre} às ${j.fecha === '23:59' ? '23:59:59' : j.fecha}` : 'não funciona');
const ted = GRADE.find((g) => g.grade === 'STR02')!;

/** Horário da TED com base na Grade de horários do SPB. O "agora" só é calculado no navegador (evita divergência na hidratação). */
export function HorarioTed() {
  const [agora, setAgora] = useState<Situacao | null>(null);
  useEffect(() => {
    const atualizar = () => setAgora(situacao(ted, new Date()));
    atualizar();
    const t = setInterval(atualizar, 60_000);
    return () => clearInterval(t);
  }, []);

  const linhas = GRADE.filter((g) => USO[g.grade]);
  return (
    <Box>
      <Alert severity={agora?.aberto ? 'success' : 'info'} data-testid="ted-agora" sx={{ mb: 2 }}>
        {agora ? (
          <>
            <strong>TED no STR agora: {agora.aberto ? 'aberta' : 'fechada'}</strong> ({agora.texto}, horário de Brasília, {ROTULO_DIA[agora.tipoDia]}).
            {agora.tipoDia === 'util' && ' Em feriado nacional vale a coluna de sábados e feriados.'}
          </>
        ) : (
          'Calculando o horário de Brasília…'
        )}
      </Alert>
      {/* rola para o lado no celular: precisa de foco pelo teclado (WCAG) */}
      <TableContainer tabIndex={0} role="region" aria-label="Grade de horários (role para o lado)">
        <Table size="small" aria-label="Grade de horários da TED no STR">
          <TableHead>
            <TableRow>
              <TableCell>Grade</TableCell>
              <TableCell>Para quê</TableCell>
              <TableCell>Dias úteis</TableCell>
              <TableCell>24/12</TableCell>
              <TableCell>Último dia útil do ano</TableCell>
              <TableCell>Sábados e feriados</TableCell>
              <TableCell>Domingos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {linhas.map((g) => (
              <TableRow key={g.grade}>
                <TableCell><Chip size="small" label={g.grade} /></TableCell>
                <TableCell>{USO[g.grade]}</TableCell>
                <TableCell>{janela(g.util)}</TableCell>
                <TableCell>{janela(g.natal)}</TableCell>
                <TableCell>{janela(g.ultimoDia)}</TableCell>
                <TableCell>{janela(g.sabadoFeriado)}</TableCell>
                <TableCell>{janela(g.domingo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        “Para quê” é a mensagem da TED que aparece em cada grade; a grade AGE01 ser a do agendamento é dedução pelo nome e pelos campos Data e Hora
        Agendamento da STR0008. A TED liquidada no SITRAF (PAG0108) segue a grade da Núclea, que não está nesta planilha do BCB.
      </Typography>
    </Box>
  );
}
