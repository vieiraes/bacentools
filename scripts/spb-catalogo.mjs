// Gera os dados da área SPB/TED a partir dos arquivos oficiais do Banco Central.
// Roda à mão quando sai versão nova do Catálogo de Serviços do SFN; o resultado (src/data/spb/*.json) é versionado.
// Precisa de: unzip e pdftotext (poppler-utils) no sistema; fast-xml-parser e xlsx (devDependencies).
// Uso: node scripts/spb-catalogo.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import * as XLSX from 'xlsx';

const BCB = 'https://www.bcb.gov.br';
const CAT = `${BCB}/content/estabilidadefinanceira/cedsfn/Catalogos`;
const VERSOES = ['5.13', '5.12'];
const DOMINIOS_ARQ = 'Dom20261009.xls';
const ERROS_ARQ = 'Erros20260904.xls';
/** Eventos da TED: no STR (Banco Central) e no SITRAF (Núclea), com as devoluções. */
const EVENTOS = [
  { codigo: 'STR0008', grupo: 'STR', volume: 'I', papel: 'ted' },
  { codigo: 'STR0010', grupo: 'STR', volume: 'I', papel: 'devolucao' },
  { codigo: 'PAG0108', grupo: 'PAG', volume: 'II', papel: 'ted' },
  { codigo: 'PAG0111', grupo: 'PAG', volume: 'II', papel: 'devolucao' },
];
const PREFIXOS_ERRO = ['EGEN', 'ESTR', 'EPAG'];
const HOJE = new Date();

const CACHE = join(tmpdir(), 'bacentools-spb');
mkdirSync(CACHE, { recursive: true });
const SAIDA = new URL('../src/data/spb/', import.meta.url);
mkdirSync(SAIDA, { recursive: true });

async function baixar(url, nome) {
  const destino = join(CACHE, nome);
  if (!existsSync(destino)) {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (BacenTools)' } });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  }
  return destino;
}

const latin1 = (buf) => new TextDecoder('latin1').decode(buf);
const unzipArquivo = (zip, caminho) => execFileSync('unzip', ['-p', zip, caminho], { maxBuffer: 64 * 1024 * 1024 });
const pdfTexto = (pdf) => execFileSync('pdftotext', ['-layout', pdf, '-'], { maxBuffer: 256 * 1024 * 1024 }).toString('utf8');

// ---------- XSD ----------
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', preserveOrder: true, removeNSPrefix: false, trimValues: true });
const filhos = (no) => (no ? Object.values(no).find(Array.isArray) ?? [] : []);
const nomeNo = (no) => Object.keys(no).find((k) => k !== ':@');
const attrs = (no) => no[':@'] ?? {};
const texto = (no) => filhos(no).map((f) => f['#text'] ?? '').join('').trim();
function acha(no, nome) { return filhos(no).find((f) => nomeNo(f) === nome); }
function achaFundo(no, nome) {
  for (const f of filhos(no)) {
    if (nomeNo(f) === nome) return f;
    const r = achaFundo(f, nome);
    if (r) return r;
  }
  return undefined;
}

function lerXsd(conteudo) {
  const raiz = parser.parse(conteudo);
  const schema = raiz.find((n) => nomeNo(n) === 'xs:schema');
  const tiposSimples = {};
  const tiposComplexos = {};
  for (const f of filhos(schema)) {
    const n = nomeNo(f);
    if (n === 'xs:simpleType') tiposSimples[attrs(f).name] = f;
    if (n === 'xs:complexType') tiposComplexos[attrs(f).name] = f;
  }
  const doc = filhos(schema).find((f) => nomeNo(f) === 'xs:element' && attrs(f).name === 'DOC');
  const infEvento = achaFundo(doc, 'cat:InfEvento');
  const fluxo = infEvento ? texto(acha(infEvento, 'cat:TipoFluxo')) : undefined;
  const regras = infEvento ? filhos(infEvento).filter((f) => nomeNo(f) === 'cat:InfRegra').map((r) => texto(acha(r, 'cat:CodigoRegra'))) : [];

  function tipoSimples(nome) {
    const t = tiposSimples[nome];
    if (!t) return { nome, base: nome.replace(/^xs:/, '') };
    const descr = achaFundo(t, 'cat:DescricaoTipo');
    const r = acha(t, 'xs:restriction');
    const out = { nome, base: (attrs(r).base ?? '').replace(/^xs:/, '') };
    if (descr) out.descricao = texto(descr);
    for (const f of filhos(r)) {
      const k = nomeNo(f).replace(/^xs:/, '');
      const v = attrs(f).value;
      if (k === 'enumeration') (out.valores ??= []).push(v);
      else if (['minLength', 'maxLength', 'totalDigits', 'fractionDigits', 'minInclusive', 'maxInclusive', 'length'].includes(k)) out[k] = Number(v);
      else if (k === 'pattern') out.pattern = v;
    }
    return out;
  }

  let grupoOu = 0;
  function campos(seqOuChoice, ou) {
    const lista = [];
    for (const f of filhos(seqOuChoice)) {
      const n = nomeNo(f);
      if (n === 'xs:choice') {
        grupoOu += 1;
        lista.push(...campos(f, grupoOu));
        continue;
      }
      if (n === 'xs:sequence') { lista.push(...campos(f, ou)); continue; }
      if (n !== 'xs:element') continue;
      const a = attrs(f);
      const inf = achaFundo(f, 'cat:InfCampo');
      const campo = {
        tag: a.name,
        nome: inf ? texto(acha(inf, 'cat:NomeCampo')) : a.name,
        descricao: inf ? texto(acha(inf, 'cat:DescricaoCampo')) : undefined,
        obrigatorio: a.minOccurs !== '0',
      };
      if (a.maxOccurs && a.maxOccurs !== '1') campo.repete = a.maxOccurs === 'unbounded' ? 'n' : a.maxOccurs;
      if (a.fixed) campo.fixo = a.fixed;
      if (ou) campo.ou = ou;
      const complexo = tiposComplexos[a.type];
      if (complexo) campo.campos = campos(acha(complexo, 'xs:sequence') ?? complexo);
      else campo.tipo = tipoSimples(a.type);
      lista.push(campo);
    }
    return lista;
  }

  const sis = tiposComplexos.SISMSGComplexType;
  const escolha = acha(sis, 'xs:choice');
  const mensagens = filhos(escolha).filter((f) => nomeNo(f) === 'xs:element').map((el) => {
    const a = attrs(el);
    const inf = achaFundo(el, 'cat:InfMensagem');
    grupoOu = 0;
    const tipo = tiposComplexos[a.type];
    return {
      codigo: a.name,
      emissor: inf ? texto(acha(inf, 'cat:Emissor')) : undefined,
      destinatario: inf ? texto(acha(inf, 'cat:Destinatario')) : undefined,
      campos: campos(acha(tipo, 'xs:sequence')),
    };
  });
  grupoOu = 0;
  const bcmsg = campos(acha(tiposComplexos.BCMSGComplexType, 'xs:sequence'));
  return { fluxo, regras, mensagens, bcmsg };
}

// ---------- PDF: nomes de evento, nomes de mensagem e textos das regras ----------
function nomesDoVolume(txt) {
  const eventos = {};
  const mensagens = {};
  for (const m of txt.matchAll(/Evento\s+([A-Z]{3}\d{4})\s+-\s+(.+)\n\s*Descrição\s+(.+(?:\n {20,}.+)*)/g)) {
    eventos[m[1]] = { titulo: m[2].trim(), descricao: m[3].replace(/\s+/g, ' ').trim() };
  }
  for (const m of txt.matchAll(/Mensagem:\s+(.+)\n\s*Código Mensagem:\s+([A-Z]{3}\d{4}[A-Z0-9]*)/g)) mensagens[m[2]] = m[1].trim();
  return { eventos, mensagens };
}

function regrasDoVolumeIV(txt) {
  const regras = {};
  let atual = null;
  for (const linha of txt.split('\n')) {
    const m = /^\s{0,4}(R[A-Z]{3}\d{4})\s{2,}(.+)$/.exec(linha);
    if (m) { atual = m[1]; regras[atual] = m[2].trim(); continue; }
    if (!atual) continue;
    if (/^\s*$/.test(linha) || /Catálogo de Serviços do SFN|Dicionário de Regras|^\s*Código\s+Descrição/.test(linha)) { if (/^\s*$/.test(linha)) atual = null; continue; }
    if (/^\s{8,}\S/.test(linha)) regras[atual] += ' ' + linha.trim();
    else atual = null;
  }
  return regras;
}

// ---------- XLS ----------
function linhasXls(arquivo, abaComeca, bruto = false) {
  const wb = XLSX.read(readFileSync(arquivo), { type: 'buffer', cellDates: false });
  const aba = wb.SheetNames.find((n) => n.startsWith(abaComeca)) ?? wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[aba], { header: 1, raw: bruto, defval: '' });
}
/** Horário do Excel (fração do dia, ex.: 0.7291 = 17:30) → "17:30". 23:59:59 vira "23:59". */
const hora = (v) => {
  if (typeof v !== 'number') return null;
  const min = Math.floor(Math.round(v * 86400) / 60);
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
};
const dataBr = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(String(s).trim());
  if (!m) return null;
  const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return new Date(Date.UTC(ano, Number(m[2]) - 1, Number(m[1])));
};
const vigente = (desativacao) => {
  const d = dataBr(desativacao);
  return !d || d > HOJE;
};
const iso = (s) => dataBr(s)?.toISOString().slice(0, 10);

// ---------- execução ----------
const fontes = {
  catalogo: {},
  dominios: { titulo: 'Dicionário de Domínios do Catálogo de Serviços do SFN', arquivo: DOMINIOS_ARQ, url: `${CAT}/Documentos_auxiliares/Dicionario_dominios/${DOMINIOS_ARQ}` },
  erros: { titulo: 'Relação de Códigos de Erros do Catálogo de Serviços do SFN', arquivo: ERROS_ARQ, url: `${CAT}/Documentos_auxiliares/Relacao_erros/${ERROS_ARQ}` },
  grade: { titulo: 'Grades de horários do SPB', url: `${BCB}/content/estabilidadefinanceira/STR/Grade_horarios_SPB.XLS` },
};

const tiposUsados = new Set();
const porVersao = {};
for (const versao of VERSOES) {
  const v = versao.replace('.', '');
  const zip = await baixar(`${CAT}/XSDDOCV${v}.zip`, `XSDDOCV${v}.zip`);
  const vol = {};
  for (const n of ['I', 'II', 'IV']) vol[n] = pdfTexto(await baixar(`${CAT}/Catalogo_de_Servicos_do_SFN_Volume_${n}_Versao_${v}.pdf`, `vol${n}-${v}.pdf`));
  const nomes = { I: nomesDoVolume(vol.I), II: nomesDoVolume(vol.II) };
  const textosRegras = regrasDoVolumeIV(vol.IV);

  const eventos = EVENTOS.map((e) => {
    const xsd = lerXsd(latin1(unzipArquivo(zip, `${e.grupo}/${e.codigo}.XSD`)));
    const n = nomes[e.volume];
    for (const m of xsd.mensagens) {
      m.titulo = n.mensagens[m.codigo];
      const marcar = (cs) => cs.forEach((c) => { if (c.tipo) tiposUsados.add(c.tipo.nome); if (c.campos) marcar(c.campos); });
      marcar(m.campos);
    }
    return {
      ...e,
      titulo: n.eventos[e.codigo]?.titulo,
      descricao: n.eventos[e.codigo]?.descricao,
      fluxo: xsd.fluxo,
      regras: xsd.regras.map((codigo) => ({ codigo, texto: textosRegras[codigo] ?? null })),
      xsd: `${e.grupo}/${e.codigo}.XSD`,
      mensagens: xsd.mensagens,
      bcmsg: xsd.bcmsg,
    };
  });

  for (const e of eventos) {
    for (const r of e.regras) if (!r.texto) throw new Error(`${versao}: regra ${r.codigo} sem texto no Volume IV`);
    for (const m of e.mensagens) if (!m.titulo) console.warn(`${versao}: mensagem ${m.codigo} sem título no volume ${e.volume}`);
  }
  fontes.catalogo[versao] = {
    titulo: `Catálogo de Serviços do SFN, versão ${versao}`,
    xsd: `${CAT}/XSDDOCV${v}.zip`,
    volumes: Object.fromEntries(['I', 'II', 'IV'].map((n) => [n, `${CAT}/Catalogo_de_Servicos_do_SFN_Volume_${n}_Versao_${v}.pdf`])),
  };
  porVersao[versao] = eventos;
  if (versao === VERSOES[0]) writeFileSync(new URL('mensagens.json', SAIDA), JSON.stringify({ versao, eventos }, null, 1) + '\n');
  console.log(`✔ ${versao}: ${eventos.map((e) => `${e.codigo} (${e.mensagens.map((m) => m.codigo).join(', ')})`).join('; ')}`);
}

// a TED mudou entre as versões? (compara campos, tipos e regras; títulos de PDF não contam)
const essencia = (evs) => JSON.stringify(evs.map((e) => ({ c: e.codigo, f: e.fluxo, r: e.regras.map((r) => r.codigo), m: e.mensagens.map((m) => ({ c: m.codigo, e: m.emissor, d: m.destinatario, k: m.campos })) })));
const mudouDesdeAnterior = essencia(porVersao[VERSOES[0]]) !== essencia(porVersao[VERSOES[1]]);
console.log(mudouDesdeAnterior ? `⚠ a TED MUDOU entre ${VERSOES[1]} e ${VERSOES[0]}: revisar as telas` : `✔ TED igual nas versões ${VERSOES[1]} e ${VERSOES[0]}`);

// domínios: só os tipos usados pelas mensagens da TED, só os vigentes
const dom = linhasXls(await baixar(fontes.dominios.url, DOMINIOS_ARQ), 'Dicion');
const dominios = {};
for (const [tipo, codigo, descricao, , , ativProd, , desProd] of dom.slice(1)) {
  if (!tiposUsados.has(tipo) || !vigente(desProd)) continue;
  (dominios[tipo] ??= []).push({ codigo: String(codigo).trim(), descricao: String(descricao).trim(), desde: iso(ativProd) });
}
for (const lista of Object.values(dominios)) lista.sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true }));
writeFileSync(new URL('dominios.json', SAIDA), JSON.stringify(dominios, null, 1) + '\n');
console.log(`✔ domínios: ${Object.entries(dominios).map(([t, l]) => `${t} ${l.length}`).join(', ')}`);

// erros: EGEN, ESTR e EPAG vigentes
const err = linhasXls(await baixar(fontes.erros.url, ERROS_ARQ), 'Rela');
const erros = err.slice(1)
  .filter(([c, , , des]) => PREFIXOS_ERRO.some((p) => String(c).startsWith(p)) && vigente(des))
  .map(([codigo, descricao, ativ]) => ({ codigo: String(codigo).trim(), descricao: String(descricao).trim(), desde: iso(ativ) }))
  .sort((a, b) => a.codigo.localeCompare(b.codigo));
writeFileSync(new URL('erros.json', SAIDA), JSON.stringify(erros, null, 1) + '\n');
console.log(`✔ erros: ${PREFIXOS_ERRO.map((p) => `${p} ${erros.filter((e) => e.codigo.startsWith(p)).length}`).join(', ')}`);

// grade de horários: grades que contêm mensagens da TED
const gr = linhasXls(await baixar(fontes.grade.url, 'Grade_horarios_SPB.XLS'), 'Grade', true);
const COLS = { natal: [3, 4], ultimoDia: [5, 6], util: [7, 8], sabadoFeriado: [9, 10], domingo: [11, 12] };
const grades = [];
let atual = null;
for (const linha of gr.slice(3)) {
  if (String(linha[1]).trim()) {
    const janela = (i) => {
      const [a, f] = i.map((k) => hora(linha[k]));
      return a && f ? { abre: a, fecha: f } : null;
    };
    atual = { grade: String(linha[1]).trim(), mensagens: [], ...Object.fromEntries(Object.entries(COLS).map(([k, i]) => [k, janela(i)])) };
    grades.push(atual);
  }
  if (atual && /^[A-Z]{3}\d{4}/.test(String(linha[2]).trim())) atual.mensagens.push(String(linha[2]).trim());
}
const codigosTed = EVENTOS.map((e) => e.codigo);
const gradeTed = grades.filter((g) => g.mensagens.some((m) => codigosTed.includes(m))).map((g) => ({ ...g, mensagens: g.mensagens.filter((m) => codigosTed.includes(m)) }));
writeFileSync(new URL('grade.json', SAIDA), JSON.stringify(gradeTed, null, 1) + '\n');
console.log(`✔ grade: ${gradeTed.map((g) => `${g.grade} ${g.util?.abre ?? '-'}–${g.util?.fecha ?? '-'} [${g.mensagens.join(',')}]`).join('; ')}`);

writeFileSync(new URL('fontes.json', SAIDA), JSON.stringify({
  geradoEm: HOJE.toISOString().slice(0, 10),
  versao: VERSOES[0],
  // Comunicado nº 45.630/2026 (página "Comunicação eletrônica de dados" do BCB): produção MES/SPB em 24/10/2026
  producao: '2026-10-24',
  versaoAnterior: VERSOES[1],
  tedIgualNaVersaoAnterior: !mudouDesdeAnterior,
  // Planilha de Alterações 5.12 × 5.11 (abas "Evento e Regra" e "Regra"): grupo Split e regras RSTR0039/0040 incluídos na 5.12,
  // em produção desde 27/06/2026 (Comunicado nº 44.424/2025)
  split: { versao: '5.12', producao: '2026-06-27', fonte: `${CAT}/Alteracoes512v511.xls` },
  paginaCatalogos: `${BCB}/estabilidadefinanceira/comunicacaodados`,
  ...fontes,
}, null, 1) + '\n');
console.log('✔ fontes');
