import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { comCrcCorrigido, crc16, decodificarBrCode, EXEMPLOS, lerTlv, tipoDaChave } from '@/lib/brcode/brcode';

const falhas = (t: string) => decodificarBrCode(t).verificacoes.filter((v) => !v.ok).map((v) => v.id);

/** Monta um BR Code a partir de pares [id, valor] e fecha com o CRC certo. */
function montar(pares: [string, string][]): string {
  const corpo = pares.map(([id, v]) => `${id}${String(v.length).padStart(2, '0')}${v}`).join('') + '6304';
  return corpo + crc16(corpo);
}
const conta = (...sub: [string, string][]) => sub.map(([id, v]) => `${id}${String(v.length).padStart(2, '0')}${v}`).join('');

describe('BR Code: exemplos oficiais do Manual de Padrões para Iniciação do Pix 2.10.0', () => {
  it('estático (seção 2.6.3): chave aleatória, sem valor, txid "***", CRC 1D3D', () => {
    const r = decodificarBrCode(EXEMPLOS.estatico);
    expect(r.valido).toBe(true);
    expect(r.tipo).toBe('estatico');
    expect(r.crc).toEqual({ informado: '1D3D', calculado: '1D3D', ok: true });
    expect(r.campos).toMatchObject({ chave: '123e4567-e12b-12d1-a456-426655440000', tipoChave: 'aleatoria', nome: 'Fulano de Tal', cidade: 'BRASILIA', txid: '***', usoUnico: false });
    expect(r.campos.valor).toBeUndefined();
    expect(r.verificacoes.every((v) => v.ok)).toBe(true);
  });

  it('dinâmico (seção 2.7.2): URL sem protocolo, uso único (01=12), CRC 64E4', () => {
    const r = decodificarBrCode(EXEMPLOS.dinamico);
    expect(r.valido).toBe(true);
    expect(r.tipo).toBe('dinamico');
    expect(r.crc.calculado).toBe('64E4');
    expect(r.campos).toMatchObject({ url: 'pix.example.com/8b3da2f39a4140d1a91abd93113bd441', usoUnico: true });
    expect(r.verificacoes.find((v) => v.id === 'iniciacao')?.mensagem).toMatch(/não deve ser pago mais de uma vez/);
  });

  it('árvore: sub-elementos do 26 e do 62 com a posição no texto', () => {
    const r = decodificarBrCode(EXEMPLOS.estatico);
    const c26 = r.elementos.find((e) => e.id === '26')!;
    expect(c26.filhos?.map((f) => [f.id, f.nome])).toEqual([['00', 'GUI'], ['01', 'chave']]);
    expect(EXEMPLOS.estatico.slice(c26.filhos![1].pos, c26.filhos![1].pos + 4)).toBe('0136');
    expect(r.elementos.find((e) => e.id === '62')?.filhos?.[0]).toMatchObject({ id: '05', valor: '***' });
  });

  it('cópia com quebras de linha (PDF, e-mail) é aceita', () => {
    const quebrado = EXEMPLOS.estatico.slice(0, 50) + '\r\n' + EXEMPLOS.estatico.slice(50) + '\n';
    expect(decodificarBrCode(quebrado).valido).toBe(true);
  });
});

describe('BR Code: erros que o validador aponta', () => {
  it('regressão: "6304" dentro da chave não engana o CRC (bug da versão da extensão)', () => {
    const t = montar([['00', '01'], ['26', conta(['00', 'br.gov.bcb.pix'], ['01', 'ana6304@ex.com'])], ['52', '0000'], ['53', '986'], ['58', 'BR'], ['59', 'Ana'], ['60', 'SP'], ['62', conta(['05', '***'])]]);
    const r = decodificarBrCode(t);
    expect(r.crc.ok).toBe(true);
    expect(r.valido).toBe(true);
  });

  it('CRC errado: mostra o calculado e a cópia corrigida passa', () => {
    const errado = EXEMPLOS.estatico.slice(0, -4) + 'FFFF';
    expect(falhas(errado)).toEqual(['crc']);
    expect(decodificarBrCode(errado).crc).toEqual({ informado: 'FFFF', calculado: '1D3D', ok: false });
    expect(comCrcCorrigido(errado)).toBe(EXEMPLOS.estatico);
    expect(comCrcCorrigido('000201')).toBeNull();
  });

  it('CRC em minúsculas é aceito', () => {
    expect(decodificarBrCode(EXEMPLOS.estatico.slice(0, -4) + '1d3d').crc.ok).toBe(true);
  });

  it('tamanho que passa do fim e ID não numérico: erro com a posição', () => {
    expect(lerTlv('0002010599abc').erro).toEqual({ pos: 6, mensagem: 'O ID 05 diz ter 99 caracteres, mas só restam 3' });
    expect(lerTlv('0002XY02ab').erro?.mensagem).toMatch(/posição 7/);
    const r = decodificarBrCode('texto qualquer');
    expect(r.valido).toBe(false);
    expect(r.tipo).toBe('desconhecido');
  });

  it('sem GUI do Pix, moeda e país errados, sem nome, sem txid e sem CRC no fim', () => {
    const t = '000201' + '2616' + conta(['00', 'br.com.outro']) + '5204000053038405802US6008BRASILIA';
    expect(falhas(t)).toEqual(['gui', 'moeda', 'pais', 'nome', 'txid-presente', 'crc']);
  });

  it('txid com caractere proibido e longo demais; chave em formato desconhecido', () => {
    const base = (txid: string, chave = '+5561912345678') =>
      montar([['00', '01'], ['26', conta(['00', 'BR.GOV.BCB.PIX'], ['01', chave])], ['52', '0000'], ['53', '986'], ['58', 'BR'], ['59', 'Ana'], ['60', 'SP'], ['62', conta(['05', txid])]]);
    expect(falhas(base('pedido-123'))).toEqual(['txid-formato']);
    expect(falhas(base('a'.repeat(26)))).toEqual(['txid-formato']);
    expect(falhas(base('a'.repeat(25)))).toEqual([]);
    expect(falhas(base('***', 'fulano'))).toEqual(['chave-formato']);
  });

  it('valor-limite da chave (77) e do infoAdicional (72)', () => {
    const t = (chave: string, info?: string) =>
      montar([['00', '01'], ['26', conta(['00', 'br.gov.bcb.pix'], ['01', chave], ...(info ? [['02', info] as [string, string]] : []))], ['52', '0000'], ['53', '986'], ['58', 'BR'], ['59', 'Ana'], ['60', 'SP'], ['62', conta(['05', '***'])]]);
    const email77 = `${'a'.repeat(65)}@exemplo.com`;
    expect(email77).toHaveLength(77);
    expect(falhas(t(email77))).toEqual([]);
    // chave e infoAdicional disputam os 99 caracteres do ID 26 (seção 2.6.1): 72 só cabe com chave de 1 caractere
    expect(falhas(t('x', 'i'.repeat(72)))).toEqual(['chave-formato']);
    expect(falhas(t('', 'i'.repeat(73)))).toEqual(['chave-tamanho', 'chave-formato', 'info-tamanho']);
  });

  it('dinâmico com protocolo na URL e valor no BR Code; Pix Saque com fss; composto com recorrência', () => {
    const din = montar([['00', '01'], ['26', conta(['00', 'br.gov.bcb.pix'], ['25', 'https://psp.com/cob/abc'])], ['52', '0000'], ['53', '986'], ['54', '10.00'], ['58', 'BR'], ['59', 'Ana'], ['60', 'SP'], ['62', conta(['05', '***'])]]);
    expect(falhas(din)).toEqual(['url', 'dinamico-valor']);
    expect(decodificarBrCode(din).valido).toBe(false);

    const saque = montar([['00', '01'], ['26', conta(['00', 'br.gov.bcb.pix'], ['01', '12345678900'], ['03', '12345678'])], ['52', '0000'], ['53', '986'], ['54', '1,5'], ['58', 'BR'], ['59', 'Ana'], ['60', 'SP'], ['62', conta(['05', '***'])]]);
    const r = decodificarBrCode(saque);
    expect(r.campos).toMatchObject({ fss: '12345678', tipoChave: 'cpf' });
    expect(falhas(saque)).toEqual(['valor']);
    expect(r.valido).toBe(true); // valor fora do formato é aviso

    const comp = montar([['00', '01'], ['26', conta(['00', 'br.gov.bcb.pix'], ['01', '00038166000105'])], ['52', '0000'], ['53', '986'], ['58', 'BR'], ['59', 'Ana'], ['60', 'SP'], ['62', conta(['05', '***'])], ['80', conta(['00', 'br.gov.bcb.pix'], ['25', 'psp.com/rec/xyz'])]]);
    expect(decodificarBrCode(comp)).toMatchObject({ tipo: 'composto', valido: true, campos: { urlRecorrencia: 'psp.com/rec/xyz', tipoChave: 'cnpj' } });
  });

  it('GUI do Pix sem chave nem URL; outro arranjo no 27 é ignorado; ID 01 desconhecido é aviso', () => {
    const t = montar([['00', '01'], ['01', '99'], ['26', conta(['00', 'br.gov.bcb.pix'])], ['27', conta(['00', 'br.com.outro'], ['01', 'x'])], ['52', '0000'], ['53', '986'], ['58', 'BR'], ['59', 'Ana'], ['60', 'SP'], ['62', conta(['05', '***'])]]);
    expect(falhas(t)).toEqual(['iniciacao', 'conteudo']);
  });
});

describe('BR Code: cobrança com vencimento como as de bancos em homologação', () => {
  // Mesmo formato de códigos reais de /cobv/ (URL de 77 caracteres, valor no BR Code, uso único); dados trocados por genéricos
  const cobv = (url: string, valor = '10.16') =>
    montar([['00', '01'], ['01', '12'], ['26', conta(['00', 'br.gov.bcb.pix'], ['25', url])], ['52', '0000'], ['53', '986'], ['54', valor], ['58', 'BR'], ['59', 'EMPRESA EXEMPLO'], ['60', 'Sao Paulo'], ['62', conta(['05', '***'])]]);
  const url77 = 'api.psp.example.com/pix/qrs1/v2/cobv/' + 'k'.repeat(40);

  it('URL com exatamente 77 caracteres é válida; o valor no BR Code vira aviso', () => {
    expect(url77).toHaveLength(77);
    const r = decodificarBrCode(cobv(url77));
    expect(r).toMatchObject({ tipo: 'dinamico', valido: true, campos: { url: url77, valor: '10.16', usoUnico: true } });
    expect(r.verificacoes.filter((v) => !v.ok).map((v) => [v.id, v.nivel, v.mensagem])).toEqual([
      ['dinamico-valor', 'aviso', 'Traz valor (ID 54 = 10.16), mas no QR Code dinâmico o app pagador deve ignorá-lo e usar o valor do payload da URL'],
    ]);
  });

  it('URL com 78 caracteres nem cabe no ID 26 (máximo 99 = 18 do GUI + 4 + 77): o código é recusado', () => {
    expect(decodificarBrCode(cobv(url77 + 'k')).valido).toBe(false);
  });
});

describe('tipo da chave (Manual, seção 2.5.1)', () => {
  it.each([
    ['fulano_da_silva.recebedor@example.com', 'email'],
    ['12345678900', 'cpf'],
    ['00038166000105', 'cnpj'],
    ['12ABC34501DE35', 'cnpj'],
    ['+5561912345678', 'telefone'],
    ['123e4567-e12b-12d1-a456-426655440000', 'aleatoria'],
    ['123e4567e12b12d1a456426655440000', 'desconhecido'],
  ])('%s → %s', (chave, tipo) => expect(tipoDaChave(chave)).toBe(tipo));
});

describe('propriedades', () => {
  it('nunca lança, para qualquer texto colado', () => {
    fc.assert(fc.property(fc.string({ maxLength: 300 }), (s) => { decodificarBrCode(s); }), { numRuns: 500 });
  });

  it('montar e decodificar devolve a mesma chave e o CRC sempre confere', () => {
    const chave = fc.stringMatching(/^[a-z0-9._]{1,40}@[a-z]{2,10}\.com$/);
    fc.assert(fc.property(chave, fc.stringMatching(/^[A-Za-z0-9]{1,25}$/), (c, txid) => {
      const t = montar([['00', '01'], ['26', conta(['00', 'br.gov.bcb.pix'], ['01', c])], ['52', '0000'], ['53', '986'], ['58', 'BR'], ['59', 'Ana'], ['60', 'SP'], ['62', conta(['05', txid])]]);
      const r = decodificarBrCode(t);
      expect(r.campos.chave).toBe(c);
      expect(r.campos.txid).toBe(txid);
      expect(r.valido).toBe(true);
    }), { numRuns: 200 });
  });
});
