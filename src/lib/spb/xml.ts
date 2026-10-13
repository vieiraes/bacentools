// Montar e validar o XML das mensagens da TED (STR0008, STR0010, PAG0108, PAG0111 e respostas), no navegador.
// Regras de estrutura vêm dos XSD oficiais (src/data/spb/mensagens.json); regras de negócio do Dicionário de Regras;
// formato do documento do Catálogo 5.13, Volume I, "Codificação das Mensagens" e "Estrutura da Mensagem" (p. 11 a 13).
import { cnpjValido, cpfValido } from '@/lib/brcode/gerar';
import { DOMINIOS, EVENTOS, erroSpbPorCodigo, mensagemPorCodigo, type Campo, type EventoSpb, type MensagemSpb } from './catalogo';
import { ROTULO_DOMINIO } from './textos';

export const NAMESPACE = (codigo: string) => `http://www.bcb.gov.br/SPB/${codigo}.xsd`;
/** ISPB do Banco Central, destinatário das mensagens do STR (lista de bancos da BrasilAPI, dados do BCB). */
export const ISPB_BCB = '00038166';

const FONTE_ESTRUTURA = 'Catálogo 5.13, Volume I, Estrutura da Mensagem (p. 12–13)';
const FONTE_CARACTERES = 'Catálogo 5.13, Volume I, Codificação das Mensagens (p. 11)';
const FONTE_ERRO = 'Catálogo 5.13, Volume I, Retorno de Mensagens com Erro (p. 27)';
const FONTE_XSD = 'XSD oficial da mensagem (Catálogo 5.13)';
const FONTE_REGRAS = 'Catálogo 5.13, Volume IV, Dicionário de Regras';

// ---------- montar ----------

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** "AAAAMMDD" da data em Brasília. */
export function dataBrasilia(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).replace(/-/g, '');
}

/** NUOp no formato XXXXXXXXAAAAMMDDSSSSSSS (SPB01): ISPB do emissor + data + sequencial de 7 dígitos (Vol. I, p. 13). */
export function gerarNuop(ispbEmissor: string, data: Date, sequencial: number): string {
  return `${ispbEmissor}${dataBrasilia(data)}${String(Math.trunc(Math.abs(sequencial)) % 10_000_000).padStart(7, '0')}`;
}

export interface Envelope { emissor: string; destinatario: string; nuop: string; domSist?: string }

function linhas(campos: Campo[], valores: Record<string, string>, nivel: number): string[] {
  const pad = '  '.repeat(nivel);
  const out: string[] = [];
  for (const c of campos) {
    if (c.campos) {
      const dentro = linhas(c.campos, valores, nivel + 1);
      if (dentro.length) out.push(`${pad}<${c.tag}>`, ...dentro, `${pad}</${c.tag}>`);
      continue;
    }
    const v = c.fixo ?? valores[c.tag]?.trim();
    if (v) out.push(`${pad}<${c.tag}>${escapar(v)}</${c.tag}>`);
  }
  return out;
}

/** Monta o documento DOC/BCMSG/SISMSG. Campos vazios ficam de fora; um grupo só entra se algum campo dele foi preenchido. */
export function montarXml(codigo: string, valores: Record<string, string>, env: Envelope): string {
  const achado = mensagemPorCodigo(codigo);
  if (!achado) throw new Error(`Mensagem ${codigo} não está no catálogo da TED`);
  const { evento, mensagem } = achado;
  const bcmsg = linhas(evento.bcmsg, { IdentdEmissor: env.emissor, IdentdDestinatario: env.destinatario, DomSist: env.domSist ?? 'SPB01', NUOp: env.nuop }, 2);
  return [
    '<?xml version="1.0"?>',
    `<DOC xmlns="${NAMESPACE(evento.codigo)}">`,
    '  <BCMSG>', ...bcmsg, '  </BCMSG>',
    '  <SISMSG>', `    <${mensagem.codigo}>`, ...linhas(mensagem.campos, valores, 3), `    </${mensagem.codigo}>`, '  </SISMSG>',
    '</DOC>',
    '',
  ].join('\n');
}

/** UTF-16 BE com BOM, a codificação das mensagens do domínio SPB01 (Vol. I, p. 11). */
export function emUtf16be(texto: string): Uint8Array {
  const out = new Uint8Array(2 + texto.length * 2);
  out[0] = 0xfe; out[1] = 0xff;
  for (let i = 0; i < texto.length; i++) { const c = texto.charCodeAt(i); out[2 + i * 2] = c >> 8; out[3 + i * 2] = c & 0xff; }
  return out;
}

// ---------- validar ----------

export interface Achado {
  nivel: 'erro' | 'aviso';
  /** caminho do campo, ex.: "STR0008/Grupo_STR0008_Split/VlrCBS" */
  campo?: string;
  mensagem: string;
  /** como o erro voltaria: GEN0004 (transmissão) ou a própria mensagem com sufixo E (conteúdo) */
  retorno?: 'GEN0004' | 'E';
  /** código da Relação de Erros cuja descrição corresponde ao problema */
  codigo?: string;
  fonte: string;
}

export interface CampoLido { caminho: string; nome: string; valor: string; significado?: string }

export interface Validacao {
  ok: boolean;
  codigo?: string;
  evento?: EventoSpb;
  mensagem?: MensagemSpb;
  achados: Achado[];
  campos: CampoLido[];
}

/** Qualquer DOMParser (o do navegador ou o @xmldom/xmldom nos testes). */
export interface ParserXml { parseFromString(texto: string, tipo: string): Document }

const CARACTERE_VALIDO = /^[\u0009\u000A\u000D -~\u0085 -ÿ]*$/;
const elementos = (no: Element) => Array.from(no.childNodes).filter((n): n is Element => n.nodeType === 1);
const nomeLocal = (e: Element) => e.localName ?? e.nodeName.replace(/^.*:/, '');
const textoDe = (e: Element) => (e.textContent ?? '').trim();

function erroTipo(c: Campo, v: string): string | null {
  const t = c.tipo;
  if (c.fixo !== undefined) return v === c.fixo ? null : `deve ser “${c.fixo}”`;
  if (!t) return null;
  if (t.base === 'integer') {
    if (!/^-?\d+$/.test(v)) return 'deve ser um número inteiro';
    if (t.totalDigits && v.replace(/^-?0*/, '').length > t.totalDigits) return `até ${t.totalDigits} dígitos`;
    return null;
  }
  if (t.base === 'decimal') {
    const m = /^-?(\d+)(?:\.(\d+))?$/.exec(v);
    if (!m) return 'deve ser um número com ponto como separador decimal (ex.: 1500.00)';
    const inteiros = m[1].replace(/^0+(?=\d)/, '');
    if (t.fractionDigits !== undefined && (m[2]?.length ?? 0) > t.fractionDigits) return `até ${t.fractionDigits} casas decimais`;
    if (t.totalDigits && inteiros.length + (m[2]?.length ?? 0) > t.totalDigits) return `até ${t.totalDigits} dígitos no total`;
    if (t.minInclusive !== undefined && Number(v) < t.minInclusive) return `não pode ser menor que ${t.minInclusive}`;
    return null;
  }
  if (t.base === 'date') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d && d.getUTCDate() === +m![3] && d.getUTCMonth() === +m![2] - 1 ? null : 'data no formato AAAA-MM-DD';
  }
  if (t.base === 'time') return /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(v) ? null : 'hora no formato HH:MM:SS';
  if (t.base === 'dateTime') return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v) ? null : 'data e hora no formato AAAA-MM-DDTHH:MM:SS';
  if (t.minLength !== undefined && v.length < t.minLength) return `pelo menos ${t.minLength} caracteres`;
  if (t.maxLength !== undefined && v.length > t.maxLength) return `até ${t.maxLength} caracteres (tem ${v.length})`;
  if (t.pattern && !new RegExp(`^(?:${t.pattern})$`).test(v)) return `fora do padrão ${t.pattern}`;
  if (t.valores && !t.valores.includes(v)) return `deve ser ${t.valores.join(' ou ')}`;
  return null;
}

/** Compara a sequência de elementos do XML com a do XSD (ordem, obrigatórios, grupos OU, repetição). */
function conferir(campos: Campo[], els: Element[], caminho: string, achados: Achado[], lidos: CampoLido[]) {
  let i = 0;
  for (let k = 0; k < campos.length; k++) {
    const c = campos[k];
    if (c.ou) {
      const grupo = campos.filter((x) => x.ou === c.ou);
      k += grupo.length - 1;
      const el = els[i];
      const escolhido = el && grupo.find((g) => g.tag === nomeLocal(el));
      if (escolhido) { i++; valor(escolhido, el, `${caminho}/${escolhido.tag}`, achados, lidos); }
      else if (grupo.every((g) => g.obrigatorio)) {
        achados.push({ nivel: 'erro', campo: caminho, mensagem: `Falta um destes campos (só um): ${grupo.map((g) => `<${g.tag}>`).join(' ou ')}`, retorno: 'GEN0004', codigo: 'EGEN0017', fonte: FONTE_XSD });
      }
      continue;
    }
    let n = 0;
    while (els[i] && nomeLocal(els[i]) === c.tag) { valor(c, els[i], `${caminho}/${c.tag}`, achados, lidos); i++; n++; }
    if (n === 0 && c.obrigatorio) achados.push({ nivel: 'erro', campo: `${caminho}/${c.tag}`, mensagem: `Campo obrigatório ausente: <${c.tag}> (${c.nome})`, retorno: 'GEN0004', codigo: 'EGEN0017', fonte: FONTE_XSD });
    const max = c.repete === 'n' ? Infinity : Number(c.repete ?? 1);
    if (n > max) achados.push({ nivel: 'erro', campo: `${caminho}/${c.tag}`, mensagem: `<${c.tag}> aparece ${n} vezes; o máximo é ${max}`, retorno: 'GEN0004', codigo: 'EGEN0049', fonte: FONTE_XSD });
  }
  for (const sobra of els.slice(i)) {
    const conhecido = campos.some((c) => c.tag === nomeLocal(sobra) || campos.some((x) => x.ou && x.tag === nomeLocal(sobra)));
    achados.push({
      nivel: 'erro', campo: `${caminho}/${nomeLocal(sobra)}`,
      mensagem: conhecido ? `<${nomeLocal(sobra)}> está fora de ordem ou repetido (a ordem dos campos é a do XSD)` : `<${nomeLocal(sobra)}> não faz parte desta mensagem`,
      retorno: 'GEN0004', codigo: conhecido ? 'EGEN0043' : 'EGEN0018', fonte: FONTE_XSD,
    });
  }
}

function valor(c: Campo, el: Element, caminho: string, achados: Achado[], lidos: CampoLido[]) {
  if (c.campos) { conferir(c.campos, elementos(el), caminho, achados, lidos); return; }
  const v = textoDe(el);
  const dominio = c.tipo && DOMINIOS[c.tipo.nome];
  const item = dominio?.find((d) => d.codigo === (c.tipo?.base === 'integer' ? String(Number(v)) : v));
  lidos.push({ caminho, nome: c.nome, valor: v, significado: item?.descricao });
  const e = erroTipo(c, v);
  if (e) { achados.push({ nivel: 'erro', campo: caminho, mensagem: `<${c.tag}> = “${v}”: ${e}`, retorno: 'GEN0004', codigo: 'EGEN0043', fonte: FONTE_XSD }); return; }
  if (dominio && !item) {
    achados.push({
      nivel: 'erro', campo: caminho, mensagem: `<${c.tag}> = “${v}” não é um código vigente de ${ROTULO_DOMINIO[c.tipo!.nome] ?? c.tipo!.nome}`,
      retorno: 'E', codigo: c.tipo!.nome === 'TpCt' ? 'ESTR0147' : 'EGEN0023', fonte: 'Dicionário de Domínios (só valores vigentes)',
    });
  }
}

const v = (lidos: CampoLido[], tag: string) => lidos.find((l) => l.caminho.endsWith(`/${tag}`))?.valor;

/** Regras do Dicionário de Regras que dá para conferir só com a mensagem. */
function regras(evento: EventoSpb, msg: string, lidos: CampoLido[], achados: Achado[]) {
  const tem = (r: string) => evento.regras.some((x) => x.codigo === r) && msg === evento.codigo;
  const add = (regra: string, mensagem: string, codigo?: string, campo?: string) =>
    achados.push({ nivel: 'erro', campo: campo && `${msg}/${campo}`, mensagem: `${regra}: ${mensagem}`, retorno: 'E', codigo, fonte: FONTE_REGRAS });
  if (tem('RSTR0034') && Number(v(lidos, 'FinlddCli')) === 99999 && !v(lidos, 'Hist')) add('RSTR0034', 'finalidade 99999 (Outros) exige a descrição no campo Histórico', 'ESTR0146', 'Hist');
  for (const lado of ['Debtd', 'Credtd'] as const) {
    const tp = v(lidos, `TpCt${lado}`);
    if (!tp) continue;
    const ag = v(lidos, `Ag${lado}`);
    if (tem('RSTR0035') && tp !== 'PG' && !ag) add('RSTR0035', `tipo de conta ${tp} exige a agência (<Ag${lado}>)`, lado === 'Debtd' ? 'ESTR0032' : 'ESTR0033', `Ag${lado}`);
    if (tem('RSTR0036') && tp === 'PG' && !v(lidos, `CtPgto${lado}`)) add('RSTR0036', `conta de pagamento (PG) exige <CtPgto${lado}>, não <Ct${lado}>`, undefined, `CtPgto${lado}`);
    if (tem('RSTR0036') && tp !== 'PG' && v(lidos, `CtPgto${lado}`)) add('RSTR0036', `<CtPgto${lado}> só vale com tipo de conta PG (conta de pagamento)`, undefined, `CtPgto${lado}`);
  }
  const cbs = v(lidos, 'VlrCBS');
  const ibs = v(lidos, 'VlrIBS');
  if (tem('RSTR0039') && cbs && ibs && Number(cbs) + Number(ibs) > Number(v(lidos, 'VlrLanc') ?? 0)) add('RSTR0039', 'Valor CBS + Valor IBS é maior que o Valor Lançamento');
  if (tem('RSTR0040') && (cbs || ibs) && !(v(lidos, 'TpPessoaDebtd') === 'J' && v(lidos, 'TpPessoaCredtd') === 'J')) add('RSTR0040', 'o grupo Split só pode ser usado quando as duas pessoas são jurídicas (J)');
}

/** Avisos que o catálogo não exige do STR, mas que um QA quer saber. */
function avisos(msg: string, lidos: CampoLido[], achados: Achado[]) {
  for (const lado of ['Debtd', 'Credtd'] as const) {
    const doc = v(lidos, `CNPJ_CPFCli${lado}`);
    const tp = v(lidos, `TpPessoa${lado}`);
    if (!doc || !tp) continue;
    const okDoc = tp === 'F' ? doc.length === 11 && cpfValido(doc) : tp === 'J' ? cnpjValido(doc.toUpperCase().padStart(14, '0')) : true;
    if (!okDoc) achados.push({ nivel: 'aviso', campo: `${msg}/CNPJ_CPFCli${lado}`, mensagem: `${tp === 'F' ? 'CPF' : 'CNPJ'} ${doc} com dígito verificador que não confere (o catálogo não diz se o STR confere; é aviso)`, fonte: 'Cálculo dos dígitos verificadores (Receita Federal)' });
  }
}

export function validarXml(entrada: string, parser: ParserXml): Validacao {
  const achados: Achado[] = [];
  const campos: CampoLido[] = [];
  const texto = entrada.replace(/^﻿/, '').trim();
  const fim = (extra: Partial<Validacao> = {}): Validacao => ({ ok: !achados.some((a) => a.nivel === 'erro'), achados, campos, ...extra });

  if (!CARACTERE_VALIDO.test(texto)) {
    const ruim = [...texto].find((ch) => !CARACTERE_VALIDO.test(ch))!;
    achados.push({ nivel: 'erro', mensagem: `Caractere fora do permitido: “${ruim}” (U+${ruim.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}). Só ASCII e Latin-1 (acentos do português são aceitos; emoji e aspas curvas não).`, retorno: 'GEN0004', fonte: FONTE_CARACTERES });
  }
  let doc: Document | null = null;
  try {
    doc = parser.parseFromString(texto, 'application/xml');
  } catch { /* o @xmldom lança em erro fatal */ }
  if (!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length) {
    achados.push({ nivel: 'erro', mensagem: 'XML mal formado: o documento não pode ser lido (tag sem fechar, caractere especial sem escapar…).', retorno: 'GEN0004', codigo: 'EGEN0001', fonte: FONTE_ERRO });
    return fim();
  }
  const raiz = doc.documentElement;
  if (nomeLocal(raiz) !== 'DOC') { achados.push({ nivel: 'erro', mensagem: `A raiz deve ser <DOC>, não <${nomeLocal(raiz)}>`, retorno: 'GEN0004', codigo: 'EGEN0043', fonte: FONTE_ESTRUTURA }); return fim(); }
  const filhos = elementos(raiz);
  const bc = filhos.find((e) => nomeLocal(e) === 'BCMSG');
  const sis = filhos.find((e) => nomeLocal(e) === 'SISMSG');
  if (!bc) achados.push({ nivel: 'erro', mensagem: 'Falta o segmento <BCMSG>', retorno: 'GEN0004', codigo: 'EGEN0002', fonte: FONTE_ESTRUTURA });
  if (!sis) { achados.push({ nivel: 'erro', mensagem: 'Falta o segmento <SISMSG>', retorno: 'GEN0004', codigo: 'EGEN0003', fonte: FONTE_ESTRUTURA }); return fim(); }

  const elMsg = elementos(sis)[0];
  const codigo = elMsg && nomeLocal(elMsg);
  const achado = codigo ? mensagemPorCodigo(codigo) : undefined;
  if (!achado) {
    achados.push({ nivel: 'erro', mensagem: `Mensagem ${codigo ?? '(vazia)'} não é uma das mensagens da TED que esta ferramenta conhece (${EVENTOS.map((e) => e.codigo).join(', ')} e respostas).`, fonte: 'BacenTools' });
    return fim({ codigo });
  }
  const { evento, mensagem } = achado;
  const ns = raiz.namespaceURI;
  if (ns !== NAMESPACE(evento.codigo)) achados.push({ nivel: 'erro', mensagem: `Namespace deve ser ${NAMESPACE(evento.codigo)}${ns ? `, não ${ns}` : ' (o atributo xmlns do <DOC> está faltando)'}`, retorno: 'GEN0004', codigo: 'EGEN0035', fonte: FONTE_ESTRUTURA });

  if (bc) {
    conferir(evento.bcmsg, elementos(bc), 'BCMSG', achados, campos);
    const emissor = v(campos, 'IdentdEmissor');
    const nuop = v(campos, 'NUOp');
    const dom = v(campos, 'DomSist');
    if (dom && dom !== 'SPB01') achados.push({ nivel: 'erro', campo: 'BCMSG/DomSist', mensagem: `Domínio de sistema ${dom}: as mensagens STR e PAG são do SPB01`, retorno: 'GEN0004', codigo: 'EGEN0036', fonte: 'Catálogo 5.13, Volumes I (p. 251) e II (p. 272)' });
    if (nuop && emissor && /^[0-9A-Z]{8}\d{15}$/.test(nuop)) {
      if (!nuop.startsWith(emissor)) achados.push({ nivel: 'erro', campo: 'BCMSG/NUOp', mensagem: `O NUOp deve começar com o ISPB do emissor (${emissor})`, retorno: 'GEN0004', codigo: 'EGEN0012', fonte: FONTE_ESTRUTURA });
      const d = nuop.slice(8, 16);
      const data = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8)));
      if (data.getUTCDate() !== +d.slice(6, 8) || data.getUTCMonth() !== +d.slice(4, 6) - 1) achados.push({ nivel: 'erro', campo: 'BCMSG/NUOp', mensagem: `A data no NUOp (${d}) não existe; o formato é ISPB + AAAAMMDD + sequencial`, retorno: 'GEN0004', codigo: 'EGEN0013', fonte: FONTE_ESTRUTURA });
    }
  }

  const els = elementos(elMsg);
  conferir(mensagem.campos, els, mensagem.codigo, achados, campos);
  regras(evento, mensagem.codigo, campos, achados);
  avisos(mensagem.codigo, campos, achados);
  return fim({ codigo: mensagem.codigo, evento, mensagem });
}

/** Descrição oficial do código de erro sugerido. */
export const descricaoCodigo = (c?: string) => (c ? erroSpbPorCodigo(c)?.descricao : undefined);
