import { describe, expect, it } from 'vitest';
import { CATALOGO, DOMINIOS, ERROS_SPB, EVENTOS, FONTES_SPB, GRADE, descricaoDominio, erroSpbPorCodigo, eventoPorCodigo, formatoDoTipo, mensagemPorCodigo, percorrer, type Campo } from '@/lib/spb/catalogo';

const tags = (cs: Campo[]) => { const t: string[] = []; percorrer(cs, (c, cam) => t.push(cam.join('/'))); return t; };

describe('catálogo SPB gerado dos XSD oficiais (5.13)', () => {
  it('as quatro mensagens da TED, cada uma com requisição, R1 ao emissor e R2 ao destinatário (Fluxo2)', () => {
    expect(CATALOGO.versao).toBe('5.13');
    expect(EVENTOS.map((e) => [e.codigo, e.fluxo, e.mensagens.map((m) => m.codigo)])).toEqual([
      ['STR0008', 'Fluxo2', ['STR0008', 'STR0008R1', 'STR0008R2']],
      ['STR0010', 'Fluxo2', ['STR0010', 'STR0010R1', 'STR0010R2']],
      ['PAG0108', 'Fluxo2', ['PAG0108', 'PAG0108R1', 'PAG0108R2']],
      ['PAG0111', 'Fluxo2', ['PAG0111', 'PAG0111R1', 'PAG0111R2']],
    ]);
    const { mensagem } = mensagemPorCodigo('STR0008R2')!;
    expect([mensagem.emissor, mensagem.destinatario]).toEqual(['STR', 'IF-CREDITADA']);
    expect(mensagemPorCodigo('PAG0108R1')!.mensagem.emissor).toBe('Câmara PAG');
    expect(mensagemPorCodigo('XYZ0001')).toBeUndefined();
  });

  it('STR0008 bate com a tabela do Volume I (31 linhas): conta OU conta de pagamento, grupo Split com CBS, IBS e documento fiscal', () => {
    const str0008 = eventoPorCodigo('STR0008')!.mensagens[0];
    expect(tags(str0008.campos)).toHaveLength(30); // 31 linhas da tabela menos a linha de fechamento do grupo Split
    const ct = str0008.campos.filter((c) => c.tag === 'CtDebtd' || c.tag === 'CtPgtoDebtd');
    expect(ct.map((c) => c.ou)).toEqual([1, 1]);
    const split = str0008.campos.find((c) => c.tag === 'Grupo_STR0008_Split')!;
    expect(split.obrigatorio).toBe(false);
    expect(split.campos!.map((c) => c.tag)).toEqual(['VlrCBS', 'VlrIBS', 'CodDocFis']);
    expect(str0008.campos[0]).toMatchObject({ tag: 'CodMsg', fixo: 'STR0008' });
    expect(str0008.campos.find((c) => c.tag === 'ISPBIFDebtd')!.tipo).toMatchObject({ minLength: 8, maxLength: 8, pattern: '[0-9A-Z]{8}' });
  });

  it('regras com o texto do Dicionário de Regras (Volume IV)', () => {
    const r = eventoPorCodigo('STR0008')!.regras;
    expect(r.map((x) => x.codigo)).toEqual(['RSTR0027', 'RSTR0034', 'RSTR0035', 'RSTR0036', 'RSTR0039', 'RSTR0040']);
    expect(r.find((x) => x.codigo === 'RSTR0034')!.texto).toContain('99999');
    expect(r.find((x) => x.codigo === 'RSTR0040')!.texto).toMatch(/ambos Pessoa Jurídica\.$/);
  });

  it('envelope BCMSG: emissor, destinatário, domínio do sistema e NUOp (23 caracteres)', () => {
    const b = EVENTOS[0].bcmsg;
    expect(b.filter((c) => c.obrigatorio).map((c) => c.tag)).toEqual(['IdentdEmissor', 'IdentdDestinatario', 'DomSist', 'NUOp']);
    expect(b.find((c) => c.tag === 'NUOp')!.tipo).toMatchObject({ minLength: 23, maxLength: 23, pattern: '[0-9A-Z]{8}[0-9]{15}' });
  });

  it('domínios só vigentes, ordenados, e erros EGEN/ESTR/EPAG vigentes', () => {
    expect(DOMINIOS.TpCt.map((d) => d.codigo)).toEqual(['CC', 'CD', 'CG', 'PG', 'PP']); // CI foi desativada em 31/10/2011
    expect(descricaoDominio('FinlddCli', '99999')).toBeDefined();
    expect(descricaoDominio('FinlddCli', '00001')).toBeUndefined();
    expect(descricaoDominio('TpPessoa', 'J')).toBe('Pessoa Jurídica');
    expect(descricaoDominio('CodDevTransf', '2')).toBe('Agência ou Conta Destinatária do Crédito Inválida');
    expect(erroSpbPorCodigo('egen0001')?.descricao).toBe('XML Mal Formado');
    expect(new Set(ERROS_SPB.map((e) => e.codigo.slice(0, 4)))).toEqual(new Set(['EGEN', 'ESTR', 'EPAG']));
  });

  it('grade: TED (STR0008) das 06:30 às 17:30 em dia útil; devolução (STR0010) até 18:30', () => {
    expect(GRADE.find((g) => g.grade === 'STR02')).toMatchObject({ mensagens: ['STR0008'], util: { abre: '06:30', fecha: '17:30' }, natal: { fecha: '12:30' }, ultimoDia: { fecha: '12:00' }, sabadoFeriado: null });
    expect(GRADE.find((g) => g.grade === 'STR01')).toMatchObject({ mensagens: ['STR0010'], util: { abre: '06:30', fecha: '18:30' } });
  });

  it('versões: a TED é igual na 5.12; o Split entrou na 5.12', () => {
    expect(FONTES_SPB).toMatchObject({ versao: '5.13', versaoAnterior: '5.12', tedIgualNaVersaoAnterior: true, split: { versao: '5.12' }, producao: '2026-10-24' });
  });

  it('formato dos tipos para a tela', () => {
    expect(formatoDoTipo(undefined)).toBe('grupo');
    expect(formatoDoTipo({ nome: 'ISPB', base: 'string', minLength: 8, maxLength: 8, pattern: '[0-9A-Z]{8}' })).toBe('8 caracteres; padrão [0-9A-Z]{8}');
    expect(formatoDoTipo({ nome: 'H', base: 'string', minLength: 1, maxLength: 200 })).toBe('até 200 caracteres');
    expect(formatoDoTipo({ nome: 'C', base: 'string', minLength: 7, maxLength: 9 })).toBe('7 a 9 caracteres');
    expect(formatoDoTipo({ nome: 'V', base: 'decimal', totalDigits: 19, fractionDigits: 2 })).toBe('número até 19 dígitos, 2 decimais');
    expect(formatoDoTipo({ nome: 'I', base: 'integer', totalDigits: 5 })).toBe('inteiro até 5 dígitos');
    expect(formatoDoTipo({ nome: 'D', base: 'date' })).toBe('data AAAA-MM-DD');
    expect(formatoDoTipo({ nome: 'T', base: 'time' })).toBe('hora HH:MM:SS');
    expect(formatoDoTipo({ nome: 'DT', base: 'dateTime' })).toBe('data e hora AAAA-MM-DDTHH:MM:SS');
    expect(formatoDoTipo({ nome: 'S', base: 'string' })).toBe('string');
    expect(formatoDoTipo({ nome: 'E', base: 'string', valores: ['S', 'N'] })).toBe('string; valores: S, N');
  });
});
