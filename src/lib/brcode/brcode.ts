// Decodificador e validador do BR Code do Pix (QR Code e Pix Copia e Cola).
// Cada verificação cita o trecho do Manual de Padrões para Iniciação do Pix (BCB) de onde a regra saiu.
// Portado e corrigido da extensão "QA Tools" do mesmo autor (ver o teste de regressão do CRC).

export const FONTE_BRCODE = {
  titulo: 'Manual de Padrões para Iniciação do Pix',
  versao: '2.10.0',
  url: 'https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf',
} as const;

export const GUI_PIX = 'br.gov.bcb.pix';

/** Os dois exemplos oficiais do manual (seções 2.6.3 e 2.7.2). */
export const EXEMPLOS = {
  estatico: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
  dinamico: '00020101021226700014br.gov.bcb.pix2548pix.example.com/8b3da2f39a4140d1a91abd93113bd4415204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***630464E4',
} as const;

const NOMES_RAIZ: Record<string, string> = {
  '00': 'Payload Format Indicator',
  '01': 'Point of Initiation Method',
  '52': 'Merchant Category Code',
  '53': 'Transaction Currency',
  '54': 'Transaction Amount',
  '58': 'Country Code',
  '59': 'Merchant Name',
  '60': 'Merchant City',
  '61': 'Postal Code',
  '62': 'Additional Data Field Template',
  '63': 'CRC16',
};
const NOMES_PIX: Record<string, string> = { '00': 'GUI', '01': 'chave', '02': 'infoAdicional', '03': 'fss', '25': 'URL' };
const NOMES_62: Record<string, string> = { '05': 'Reference Label (txid)' };

export interface Elemento {
  id: string;
  nome: string;
  tamanho: number;
  valor: string;
  /** posição do ID no texto (para apontar o erro) */
  pos: number;
  filhos?: Elemento[];
}

export interface Verificacao {
  id: string;
  ok: boolean;
  nivel: 'erro' | 'aviso';
  mensagem: string;
  /** seção do manual (FONTE_BRCODE) ou outra referência */
  fonte: string;
}

export type TipoQr = 'estatico' | 'dinamico' | 'composto' | 'desconhecido';
export type TipoChave = 'email' | 'cpf' | 'cnpj' | 'telefone' | 'aleatoria' | 'desconhecido';

export interface BrCode {
  texto: string;
  elementos: Elemento[];
  tipo: TipoQr;
  campos: {
    chave?: string;
    tipoChave?: TipoChave;
    infoAdicional?: string;
    fss?: string;
    url?: string;
    urlRecorrencia?: string;
    valor?: string;
    nome?: string;
    cidade?: string;
    txid?: string;
    usoUnico: boolean;
  };
  crc: { informado?: string; calculado?: string; ok: boolean };
  verificacoes: Verificacao[];
  /** true se nenhuma verificação de nível "erro" falhou */
  valido: boolean;
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), como diz a nota 28 do manual. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

interface Leitura { elementos: Elemento[]; erro?: { pos: number; mensagem: string } }

/** Lê a sequência ID(2) + tamanho(2) + valor. Não lança: devolve o erro com a posição. */
export function lerTlv(texto: string, base = 0, nomes: Record<string, string> = {}): Leitura {
  const elementos: Elemento[] = [];
  let pos = 0;
  while (pos < texto.length) {
    const id = texto.slice(pos, pos + 2);
    const tam = texto.slice(pos + 2, pos + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(tam)) {
      return { elementos, erro: { pos: base + pos, mensagem: `Esperava ID e tamanho com 2 dígitos cada na posição ${base + pos + 1}, encontrei "${texto.slice(pos, pos + 4)}"` } };
    }
    const tamanho = Number(tam);
    if (pos + 4 + tamanho > texto.length) {
      return { elementos, erro: { pos: base + pos, mensagem: `O ID ${id} diz ter ${tamanho} caracteres, mas só restam ${texto.length - pos - 4}` } };
    }
    elementos.push({ id, nome: nomes[id] ?? `ID ${id}`, tamanho, valor: texto.slice(pos + 4, pos + 4 + tamanho), pos: base + pos });
    pos += 4 + tamanho;
  }
  return { elementos };
}

const ehContaPix = (n: number) => n >= 26 && n <= 51;
const ehReservado = (n: number) => n >= 80 && n <= 99;

export function tipoDaChave(chave: string): TipoChave {
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(chave)) return 'email';
  if (/^\d{11}$/.test(chave)) return 'cpf';
  if (/^[0-9A-Z]{12}\d{2}$/.test(chave)) return 'cnpj'; // CNPJ numérico ou alfanumérico (exemplo 12ABC34501DE35 do manual)
  if (/^\+55\d{10,11}$/.test(chave)) return 'telefone';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave)) return 'aleatoria';
  return 'desconhecido';
}

export function decodificarBrCode(entrada: string): BrCode {
  // Pix Copia e Cola colado de PDF/e-mail costuma trazer quebras de linha: elas não fazem parte do código
  const texto = entrada.replace(/[\r\n]+/g, '').trim();
  const v: Verificacao[] = [];
  const add = (id: string, ok: boolean, mensagem: string, fonte: string, nivel: Verificacao['nivel'] = 'erro') => v.push({ id, ok, nivel, mensagem, fonte });

  const raiz = lerTlv(texto, 0, NOMES_RAIZ);
  add('estrutura', !raiz.erro, raiz.erro ? raiz.erro.mensagem : 'Estrutura ID + tamanho + valor bem formada', 'Seção 2.6.3 (sequência ID, tamanho e valor)');

  const elementos = raiz.elementos;
  const pega = (id: string) => elementos.find((e) => e.id === id);
  let guiOk = false;
  let chave: string | undefined, infoAdicional: string | undefined, fss: string | undefined, url: string | undefined, urlRecorrencia: string | undefined;

  for (const e of elementos) {
    const n = Number(e.id);
    if (ehContaPix(n) || ehReservado(n)) {
      const sub = lerTlv(e.valor, e.pos + 4, NOMES_PIX);
      e.filhos = sub.elementos;
      e.nome = ehContaPix(n) ? 'Merchant Account Information' : 'Unreserved Templates';
      const gui = sub.elementos.find((s) => s.id === '00');
      if (gui?.valor.toLowerCase() !== GUI_PIX) continue; // outro arranjo: não é do Pix
      if (ehContaPix(n)) {
        guiOk = true;
        chave ??= sub.elementos.find((s) => s.id === '01')?.valor;
        infoAdicional ??= sub.elementos.find((s) => s.id === '02')?.valor;
        fss ??= sub.elementos.find((s) => s.id === '03')?.valor;
        url ??= sub.elementos.find((s) => s.id === '25')?.valor;
      } else {
        urlRecorrencia ??= sub.elementos.find((s) => s.id === '25')?.valor;
      }
    } else if (e.id === '62') {
      e.filhos = lerTlv(e.valor, e.pos + 4, NOMES_62).elementos;
    }
  }

  const tipo: TipoQr = urlRecorrencia ? 'composto' : url ? 'dinamico' : chave !== undefined ? 'estatico' : 'desconhecido';
  const txid = pega('62')?.filhos?.find((s) => s.id === '05')?.valor;
  const iniciacao = pega('01')?.valor;

  // Cabeçalho e campos nativos do BR Code
  add('formato', elementos[0]?.id === '00' && elementos[0].valor === '01', 'Começa com o ID 00 (Payload Format Indicator) valendo "01"', 'Seções 2.6.3 e 2.7.2 (exemplos)');
  add('gui', guiOk, `Tem um ID entre 26 e 51 com o GUI "${GUI_PIX}"`, 'Seção 2.5 (GUI do Pix, não diferencia maiúsculas)');
  add('moeda', pega('53')?.valor === '986', 'Moeda 986 (real)', 'Seções 2.6.3 e 2.7.2 (exemplos)');
  add('pais', pega('58')?.valor === 'BR', 'País BR', 'Seções 2.6.3 e 2.7.2 (exemplos)');
  add('nome', !!pega('59')?.valor, 'Nome do recebedor (ID 59) presente', 'Seção 2.6.3 (Merchant Name é obrigatório no BR Code)');
  add('mcc', !!pega('52'), 'Merchant Category Code (ID 52) presente ("0000" quando não informado)', 'Seções 2.6.3 e 2.7.2 (exemplos)');
  if (iniciacao !== undefined) {
    add('iniciacao', iniciacao === '11' || iniciacao === '12', iniciacao === '12' ? 'ID 01 = "12": este QR Code não deve ser pago mais de uma vez' : 'ID 01 (Point of Initiation Method) com valor reconhecido', 'Seção 2.7.2 (nota 48)', 'aviso');
  }

  // txid (62-05)
  add('txid-presente', txid !== undefined, 'Campo 62-05 (txid) presente; "***" quando não usado', 'Seção 2.6, nota 21 ("sempre presente em um BR Code") e nota 25');
  if (txid !== undefined) {
    add('txid-formato', txid === '***' || /^[a-zA-Z0-9]{1,25}$/.test(txid), 'txid com até 25 letras e dígitos, ou "***"', 'Seção 2.6.2');
  }

  // Campos do Pix (26..51)
  if (chave !== undefined) {
    const tc = tipoDaChave(chave);
    add('chave-tamanho', chave.length >= 1 && chave.length <= 77, `Chave com ${chave.length} caracteres (de 1 a 77)`, 'Seções 2.6 e 2.6.1');
    add('chave-formato', tc !== 'desconhecido', tc === 'desconhecido' ? 'A chave não está em nenhum formato do DICT (e-mail, CPF, CNPJ, +55 celular ou aleatória com hífens)' : `Chave no formato de ${ROTULO_CHAVE[tc]}`, 'Seção 2.5.1');
  }
  if (infoAdicional !== undefined) add('info-tamanho', infoAdicional.length <= 72, `infoAdicional com ${infoAdicional.length} caracteres (máximo 72)`, 'Seção 2.6');
  if (fss !== undefined) add('fss', /^[0-9A-Z]{8}$/.test(fss), 'fss com 8 caracteres (ISPB do facilitador): QR Code de Pix Saque', 'Seções 2.6 e 2.6.1');
  for (const [id, u] of [['url', url], ['url-rec', urlRecorrencia]] as const) {
    if (u === undefined) continue;
    add(id, !/^[a-z]+:\/\//i.test(u) && u.length <= 77 && u.includes('/'), `URL "${u}" sem prefixo de protocolo e com até 77 caracteres`, 'Seção 2.5.2');
  }
  if (tipo === 'dinamico' || tipo === 'composto') {
    const v54 = pega('54')?.valor;
    add('dinamico-valor', v54 === undefined, v54 === undefined ? 'Sem valor (ID 54) no BR Code: o valor vem do payload da URL' : `Traz valor (ID 54 = ${v54}), mas no QR Code dinâmico o app pagador deve ignorá-lo e usar o valor do payload da URL`, 'Seção 2.7 (valor e txid do BR Code dinâmico são ignorados)', 'aviso');
  }
  if (tipo === 'desconhecido' && guiOk) add('conteudo', false, 'Tem o GUI do Pix, mas nem chave (01) nem URL (25)', 'Seções 2.6 e 2.7');
  if (pega('54')) add('valor', /^\d+(\.\d{1,2})?$/.test(pega('54')!.valor), `Valor "${pega('54')!.valor}" com ponto decimal e até 2 casas`, 'Seção 2.6 (ID 54, Transaction Amount)', 'aviso');

  // CRC: tem de ser o último elemento, ID 63 com 4 caracteres, calculado sobre tudo até "6304" inclusive
  const ultimo = elementos.at(-1);
  let crc: BrCode['crc'] = { ok: false };
  if (ultimo?.id === '63' && ultimo.tamanho === 4 && !raiz.erro) {
    const calculado = crc16(texto.slice(0, ultimo.pos + 4));
    crc = { informado: ultimo.valor.toUpperCase(), calculado, ok: calculado === ultimo.valor.toUpperCase() };
    add('crc', crc.ok, crc.ok ? `CRC ${calculado} confere` : `CRC informado ${crc.informado}, mas o calculado é ${calculado}`, 'Seção 2.6.3, nota 28 (polinômio 0x1021, inicial 0xFFFF, incluindo "6304")');
  } else {
    add('crc', false, 'O último elemento precisa ser o CRC (ID 63, tamanho 04)', 'Seção 2.6.3, nota 28');
  }

  return {
    texto,
    elementos,
    tipo,
    campos: { chave, tipoChave: chave !== undefined ? tipoDaChave(chave) : undefined, infoAdicional, fss, url, urlRecorrencia, valor: pega('54')?.valor, nome: pega('59')?.valor, cidade: pega('60')?.valor, txid, usoUnico: iniciacao === '12' },
    crc,
    verificacoes: v,
    valido: v.every((x) => x.ok || x.nivel === 'aviso'),
  };
}

/** Recalcula o CRC: útil para quem montou o código à mão e só errou o final. */
export function comCrcCorrigido(entrada: string): string | null {
  const r = decodificarBrCode(entrada);
  const ultimo = r.elementos.at(-1);
  if (ultimo?.id !== '63' || ultimo.tamanho !== 4) return null;
  const base = r.texto.slice(0, ultimo.pos + 4);
  return base + crc16(base);
}

export const ROTULO_CHAVE: Record<TipoChave, string> = {
  email: 'e-mail',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  telefone: 'celular',
  aleatoria: 'chave aleatória',
  desconhecido: 'formato desconhecido',
};

export const ROTULO_TIPO: Record<TipoQr, string> = {
  estatico: 'QR Code estático',
  dinamico: 'QR Code dinâmico',
  composto: 'QR Code composto (com recorrência)',
  desconhecido: 'Não reconhecido',
};
