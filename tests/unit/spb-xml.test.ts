import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { DOMParser } from '@xmldom/xmldom';
import { validateXML } from 'xmllint-wasm';
import { ISPB_BCB, NAMESPACE, descricaoCodigo, emUtf16be, gerarNuop, montarXml, validarXml, type ParserXml } from '@/lib/spb/xml';

const parser = new DOMParser() as unknown as ParserXml;
const xsd = (n: string) => readFileSync(`tests/fixtures/xsd/${n}.XSD`, 'utf8');
/** Valida no libxml2 (o mesmo validador de muitos sistemas) contra o XSD oficial do BCB. */
async function contraXsdOficial(xml: string, n: string) {
  const r = await validateXML({ xml: [{ fileName: 'msg.xml', contents: xml }], schema: [{ fileName: `${n}.XSD`, contents: xsd(n) }] });
  return { valid: r.valid, erros: r.errors.map((e) => e.message) };
}

const env = { emissor: '60701190', destinatario: ISPB_BCB, nuop: gerarNuop('60701190', new Date('2026-10-13T12:00:00-03:00'), 42) };
const TED = {
  NumCtrlIF: 'TED20261013000042', ISPBIFDebtd: '60701190', AgDebtd: '1234', TpCtDebtd: 'CC', CtDebtd: '123456', TpPessoaDebtd: 'F', CNPJ_CPFCliDebtd: '12345678909', NomCliDebtd: 'Ana Souza',
  ISPBIFCredtd: '00000000', AgCredtd: '4321', TpCtCredtd: 'CC', CtCredtd: '654321', TpPessoaCredtd: 'F', CNPJ_CPFCliCredtd: '11144477735', NomCliCredtd: 'Bia Lima',
  VlrLanc: '1500.00', FinlddCli: '10', DtMovto: '2026-10-13',
};
const erros = (r: ReturnType<typeof validarXml>) => r.achados.filter((a) => a.nivel === 'erro').map((a) => a.codigo ?? a.mensagem.slice(0, 8));

describe('NUOp e codificação (Catálogo 5.13, Vol. I, p. 11 e 13)', () => {
  it('ISPB do emissor + AAAAMMDD (Brasília) + 7 dígitos', () => {
    expect(env.nuop).toBe('60701190202610130000042');
    expect(gerarNuop('60701190', new Date('2026-10-14T01:00:00Z'), 12_345_678)).toBe('60701190202610132345678'); // 22h em Brasília, sequencial cortado em 7
  });
  it('UTF-16 BE com BOM', () => {
    expect(Array.from(emUtf16be('Aé'))).toEqual([0xfe, 0xff, 0x00, 0x41, 0x00, 0xe9]);
  });
});

describe('montar o XML da TED', () => {
  it('STR0008 montada passa no XSD oficial do BCB e no validador do site', async () => {
    const xml = montarXml('STR0008', TED, env);
    expect(xml).toContain(`<DOC xmlns="${NAMESPACE('STR0008')}">`);
    expect(xml).toContain('<CodMsg>STR0008</CodMsg>');
    expect(xml).not.toContain('Grupo_STR0008_Split'); // grupo vazio fica de fora
    expect(await contraXsdOficial(xml, 'STR0008')).toEqual({ valid: true, erros: [] });
    expect(validarXml(xml, parser)).toMatchObject({ ok: true, codigo: 'STR0008', achados: [] });
  });

  it('com Split (PJ ↔ PJ) e STR0010 de devolução também passam no XSD oficial', async () => {
    const pj = { ...TED, TpPessoaDebtd: 'J', CNPJ_CPFCliDebtd: '00038166000105', TpPessoaCredtd: 'J', CNPJ_CPFCliCredtd: '12ABC34501DE35', VlrCBS: '10.00', VlrIBS: '20.00', CodDocFis: 'NFE123' };
    const xml = montarXml('STR0008', pj, env);
    expect(xml).toContain('<Grupo_STR0008_Split>');
    expect(await contraXsdOficial(xml, 'STR0008')).toEqual({ valid: true, erros: [] });
    expect(validarXml(xml, parser).ok).toBe(true);

    const dev = montarXml('STR0010', { NumCtrlIF: 'DEV1', ISPBIFDebtd: '00000000', ISPBIFCredtd: '60701190', VlrLanc: '1500.00', CodDevTransf: '2', NumCtrlSTROr: 'STR20261013000000001', DtMovto: '2026-10-13' }, env);
    expect(await contraXsdOficial(dev, 'STR0010')).toEqual({ valid: true, erros: [] });
    expect(validarXml(dev, parser).ok).toBe(true);
  });

  it('prova contrária: o XSD oficial recusa o que o validador do site recusa (campo faltando, valor com vírgula)', async () => {
    const xml = montarXml('STR0008', TED, env);
    const semNome = xml.replace(/<NomCliDebtd>.*<\/NomCliDebtd>\n/, '');
    const virgula = xml.replace('1500.00', '1500,00');
    for (const ruim of [semNome, virgula]) {
      expect((await contraXsdOficial(ruim, 'STR0008')).valid).toBe(false);
      expect(validarXml(ruim, parser).ok).toBe(false);
    }
  });

  it('caracteres especiais são escapados; mensagem desconhecida não monta', () => {
    expect(montarXml('STR0008', { ...TED, NomCliDebtd: 'Ana & Cia <ME>' }, env)).toContain('Ana &amp; Cia &lt;ME&gt;');
    expect(() => montarXml('STR9999', {}, env)).toThrow('não está no catálogo');
  });

  it('propriedade: qualquer valor e nome válidos montam um XML que o validador aceita', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 99_999_999 }),
      fc.stringMatching(/^[A-Za-zÀ-ÿ ]{1,60}$/).filter((s) => s.trim().length > 0),
      (centavos, nome) => {
        const xml = montarXml('STR0008', { ...TED, VlrLanc: (centavos / 100).toFixed(2), NomCliCredtd: nome.trim() }, env);
        expect(validarXml(xml, parser).achados.filter((a) => a.nivel === 'erro')).toEqual([]);
      },
    ), { numRuns: 150 });
  });
});

describe('validar: estrutura e XSD (erros que voltam na GEN0004)', () => {
  const ok = montarXml('STR0008', TED, env);

  it('XML mal formado → EGEN0001; sem BCMSG → EGEN0002; sem SISMSG → EGEN0003', () => {
    expect(erros(validarXml('<DOC><BCMSG>', parser))).toEqual(['EGEN0001']);
    expect(erros(validarXml(ok.replace(/<BCMSG>[\s\S]*<\/BCMSG>/, ''), parser))).toEqual(['EGEN0002']);
    expect(erros(validarXml(ok.replace(/<SISMSG>[\s\S]*<\/SISMSG>/, ''), parser))).toEqual(['EGEN0003']);
    expect(validarXml('<ROOT/>', parser).achados[0].codigo).toBe('EGEN0043');
  });

  it('namespace errado (EGEN0035), domínio de sistema errado (EGEN0036), NUOp de outro ISPB (EGEN0012) ou com data impossível (EGEN0013)', () => {
    expect(erros(validarXml(ok.replace(NAMESPACE('STR0008'), NAMESPACE('STR0009')), parser))).toEqual(['EGEN0035']);
    expect(erros(validarXml(ok.replace('<DomSist>SPB01', '<DomSist>MES01'), parser))).toEqual(['EGEN0036']);
    expect(erros(validarXml(ok.replace(env.nuop, '00000000202610130000042'), parser))).toEqual(['EGEN0012']);
    expect(erros(validarXml(ok.replace(env.nuop, '60701190202602300000042'), parser))).toEqual(['EGEN0013']);
  });

  it('campo obrigatório ausente (EGEN0017), campo estranho (EGEN0018), fora de ordem (EGEN0043)', () => {
    expect(erros(validarXml(ok.replace(/<NomCliDebtd>.*<\/NomCliDebtd>\n/, ''), parser))).toEqual(['EGEN0017']);
    expect(erros(validarXml(ok.replace('</DtMovto>', '</DtMovto>\n<Extra>1</Extra>'), parser))).toEqual(['EGEN0018']);
    const trocado = ok.replace(/(\s*<VlrLanc>.*<\/VlrLanc>)(\s*<FinlddCli>.*<\/FinlddCli>)/, '$2$1');
    expect(erros(validarXml(trocado, parser))).toContain('EGEN0043');
  });

  it('grupo OU: nem conta nem conta de pagamento → falta um dos dois', () => {
    const r = validarXml(ok.replace(/<CtDebtd>.*<\/CtDebtd>\n/, ''), parser);
    expect(r.achados[0]).toMatchObject({ codigo: 'EGEN0017', mensagem: expect.stringContaining('<CtDebtd> ou <CtPgtoDebtd>') });
  });

  it('tipos do XSD: valor com vírgula, ISPB curto, data inválida, nome longo demais (EGEN0043)', () => {
    for (const [de, para] of [['1500.00', '1500,00'], ['<ISPBIFCredtd>00000000', '<ISPBIFCredtd>0000'], ['2026-10-13</DtMovto>', '2026-02-30</DtMovto>'], ['Bia Lima', 'B'.repeat(81)]]) {
      expect(erros(validarXml(ok.replace(de, para), parser)), para).toEqual(['EGEN0043']);
    }
  });

  it('caractere fora do Latin-1 (aspas curvas) é recusado', () => {
    const r = validarXml(ok.replace('Bia Lima', 'Bia “Lima”'), parser);
    expect(r.ok).toBe(false);
    expect(r.achados[0].mensagem).toContain('U+201C');
  });

  it('mensagem que a ferramenta não conhece', () => {
    expect(validarXml(ok.replace(/STR0008/g, 'STR0004'), parser).achados[0].mensagem).toContain('não é uma das mensagens da TED');
  });
});

describe('validar: domínios e regras (erros que voltam com sufixo E)', () => {
  const montar = (extra: Record<string, string>) => validarXml(montarXml('STR0008', { ...TED, ...extra }, env), parser);

  it('domínio: tipo de conta desativado (CI) → ESTR0147; finalidade inexistente → EGEN0023; lê o significado', () => {
    expect(erros(montar({ TpCtDebtd: 'CI' }))).toEqual(['ESTR0147']);
    expect(erros(montar({ FinlddCli: '77777' }))).toEqual(['EGEN0023']);
    expect(montar({}).campos.find((c) => c.caminho.endsWith('/FinlddCli'))?.significado).toBe('Crédito em Conta');
  });

  it('RSTR0034: finalidade 99999 sem histórico → ESTR0146; com histórico passa', () => {
    expect(erros(montar({ FinlddCli: '99999' }))).toEqual(['ESTR0146']);
    expect(montar({ FinlddCli: '99999', Hist: 'Reembolso de despesas' }).ok).toBe(true);
  });

  it('RSTR0035: conta corrente sem agência → ESTR0032 (débito) e ESTR0033 (crédito)', () => {
    expect(erros(montar({ AgDebtd: '', AgCredtd: '' }))).toEqual(['ESTR0032', 'ESTR0033']);
  });

  it('RSTR0036: tipo PG precisa da conta de pagamento, e conta de pagamento só com PG', () => {
    const pg = montar({ TpCtDebtd: 'PG', AgDebtd: '', CtDebtd: '', CtPgtoDebtd: '987654' });
    expect(pg.ok).toBe(true);
    expect(montar({ TpCtDebtd: 'PG', AgDebtd: '' }).achados.some((a) => a.mensagem.startsWith('RSTR0036'))).toBe(true);
    expect(montar({ CtDebtd: '', CtPgtoDebtd: '987654' }).achados.some((a) => a.mensagem.includes('só vale com tipo de conta PG'))).toBe(true);
  });

  it('RSTR0039 e RSTR0040: Split maior que o valor, e Split entre pessoas físicas', () => {
    const pj = { TpPessoaDebtd: 'J', CNPJ_CPFCliDebtd: '00038166000105', TpPessoaCredtd: 'J', CNPJ_CPFCliCredtd: '12ABC34501DE35', CodDocFis: 'NF1' };
    expect(montar({ ...pj, VlrCBS: '1000.00', VlrIBS: '600.00' }).achados.map((a) => a.mensagem.slice(0, 8))).toEqual(['RSTR0039']);
    expect(montar({ VlrCBS: '1.00', VlrIBS: '1.00', CodDocFis: 'NF1' }).achados.map((a) => a.mensagem.slice(0, 8))).toEqual(['RSTR0040']);
  });

  it('aviso (não erro): CPF com dígito errado', () => {
    const r = montar({ CNPJ_CPFCliCredtd: '11144477700' });
    expect(r.ok).toBe(true);
    expect(r.achados).toEqual([expect.objectContaining({ nivel: 'aviso', campo: 'STR0008/CNPJ_CPFCliCredtd' })]);
  });

  it('descrição oficial do código sugerido', () => {
    expect(descricaoCodigo('EGEN0017')).toBe('XML Inválido. Campo Obrigatório Ausente');
    expect(descricaoCodigo(undefined)).toBeUndefined();
  });
});
