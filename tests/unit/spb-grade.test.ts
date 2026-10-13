import { describe, expect, it } from 'vitest';
import { GRADE } from '@/lib/spb/catalogo';
import { situacao, tipoDoDia, ultimoDiaUtilDoAno } from '@/lib/spb/grade';

const STR02 = GRADE.find((g) => g.grade === 'STR02')!; // STR0008 (TED)
const AGE01 = GRADE.find((g) => g.grade === 'AGE01')!; // agendamento
const em = (iso: string) => new Date(iso); // sempre com fuso explícito

describe('grade de horários da TED (fuso de Brasília)', () => {
  it('tipo do dia: útil, sábado, domingo, 24/12 e último dia útil do ano', () => {
    expect(tipoDoDia(em('2026-10-13T10:00:00-03:00'))).toBe('util');
    expect(tipoDoDia(em('2026-10-17T10:00:00-03:00'))).toBe('sabadoFeriado');
    expect(tipoDoDia(em('2026-10-18T10:00:00-03:00'))).toBe('domingo');
    expect(tipoDoDia(em('2026-12-24T10:00:00-03:00'))).toBe('natal');
    expect(tipoDoDia(em('2026-12-31T10:00:00-03:00'))).toBe('ultimoDia');
    // 31/12/2027 é sexta; 31/12/2028 é domingo → último dia útil 29/12/2028
    expect(ultimoDiaUtilDoAno(2027)).toBe(31);
    expect(ultimoDiaUtilDoAno(2028)).toBe(29);
    expect(tipoDoDia(em('2028-12-29T10:00:00-03:00'))).toBe('ultimoDia');
  });

  it('o fuso de quem abre não importa: 02:00 UTC de terça ainda é segunda em Brasília', () => {
    expect(tipoDoDia(em('2026-10-20T02:00:00Z'))).toBe('util'); // segunda 23:00 em Brasília
    expect(tipoDoDia(em('2026-10-18T02:00:00Z'))).toBe('sabadoFeriado'); // sábado 23:00
  });

  it('valor-limite da janela 06:30–17:30', () => {
    expect(situacao(STR02, em('2026-10-13T06:29:00-03:00'))).toMatchObject({ aberto: false, texto: 'abre às 06:30' });
    expect(situacao(STR02, em('2026-10-13T06:30:00-03:00'))).toMatchObject({ aberto: true, texto: 'aberto até 17:30' });
    expect(situacao(STR02, em('2026-10-13T17:29:00-03:00')).aberto).toBe(true);
    expect(situacao(STR02, em('2026-10-13T17:30:00-03:00'))).toMatchObject({ aberto: false, texto: 'fechou às 17:30' });
  });

  it('24/12 fecha 12:30; último dia útil 12:00; fim de semana não funciona', () => {
    expect(situacao(STR02, em('2026-12-24T12:15:00-03:00')).aberto).toBe(true);
    expect(situacao(STR02, em('2026-12-24T12:31:00-03:00')).texto).toBe('fechou às 12:30');
    expect(situacao(STR02, em('2026-12-31T12:00:00-03:00')).aberto).toBe(false);
    expect(situacao(STR02, em('2026-10-17T10:00:00-03:00'))).toMatchObject({ aberto: false, janela: null, texto: 'não funciona em sábado' });
  });

  it('agendamento (AGE01) até 23:59:59, inclusive domingo a partir de 12:00', () => {
    expect(situacao(AGE01, em('2026-10-13T23:59:30-03:00')).aberto).toBe(true);
    expect(situacao(AGE01, em('2026-10-18T11:59:00-03:00')).texto).toBe('abre às 12:00');
    expect(situacao(AGE01, em('2026-10-18T12:00:00-03:00')).aberto).toBe(true);
  });
});
