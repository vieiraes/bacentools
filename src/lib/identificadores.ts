// Decodificador de identificadores do dia a dia do Pix: EndToEndId (pacs.008), RtrId de devolução (pacs.004) e UUID.
// Formatos do EndToEndId e do RtrId: Catálogo de Mensagens do SPI 5.13.2 (pacs.008 linha R16; pacs.004 linha R10).
// UUID: RFC 9562 (o UUID v7 traz a data em milissegundos nos 48 primeiros bits). Portado da extensão "QA Tools".

export interface Campo { rotulo: string; valor: string; dica?: string }

export type Identificador =
  | { tipo: 'endtoend' | 'devolucao'; valido: boolean; campos: Campo[]; erros: string[]; ispb: string; data?: Date }
  | { tipo: 'uuid'; valido: boolean; campos: Campo[]; erros: string[]; versao: number; data?: Date }
  | { tipo: 'desconhecido'; valido: false; campos: []; erros: string[] };

export const FONTES_ID = {
  e2e: 'Catálogo de Mensagens do SPI 5.13.2, pacs.008, EndToEndIdentification (linha R16)',
  rtr: 'Catálogo de Mensagens do SPI 5.13.2, pacs.004, ReturnIdentification (linha R10)',
  uuid: 'RFC 9562 (UUID), seções 4 e 5.7',
} as const;

/** "yyyyMMddHHmm" em UTC → Date, ou null se a data não existe (ex.: 31 de fevereiro, 25h). */
export function dataUtc(s: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(s);
  if (!m) return null;
  const [a, me, d, h, mi] = m.slice(1).map(Number);
  const dt = new Date(Date.UTC(a, me - 1, d, h, mi));
  const igual = dt.getUTCFullYear() === a && dt.getUTCMonth() === me - 1 && dt.getUTCDate() === d && dt.getUTCHours() === h && dt.getUTCMinutes() === mi;
  return igual ? dt : null;
}

const brasilia = (d: Date) => d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });

function idPix(texto: string): Identificador {
  const tipo = texto[0].toUpperCase() === 'E' ? 'endtoend' : 'devolucao';
  const erros: string[] = [];
  if (texto.length !== 32) erros.push(`Tem ${texto.length} caracteres; o formato exige 32`);
  if (!/^[ED]/.test(texto)) erros.push(`A primeira letra deve ser "${tipo === 'endtoend' ? 'E' : 'D'}" maiúscula (o campo diferencia maiúsculas)`);
  const agente = texto.slice(1, 9);
  const quando = texto.slice(9, 21);
  const seq = texto.slice(21);
  if (!/^[0-9A-Z]{8}$/.test(agente)) erros.push(`Agente "${agente}": deve ter 8 caracteres [0-9A-Z] (ISPB ou raiz do CNPJ do iniciador)`);
  const data = dataUtc(quando);
  if (!data) erros.push(`Data "${quando}" não existe no formato yyyyMMddHHmm`);
  if (!/^[a-zA-Z0-9]{11}$/.test(seq)) erros.push(`Sequencial "${seq}": deve ter 11 letras ou dígitos`);
  return {
    tipo,
    valido: erros.length === 0,
    erros,
    ispb: agente,
    data: data ?? undefined,
    campos: [
      { rotulo: 'Tipo', valor: tipo === 'endtoend' ? 'EndToEndId (idFimAFim) de um Pix' : 'RtrId (idOperacao) de uma devolução' },
      { rotulo: 'Agente que gerou', valor: agente, dica: 'ISPB do participante direto ou indireto, ou os 8 primeiros dígitos do CNPJ do iniciador' },
      { rotulo: 'Data e hora (UTC)', valor: data ? data.toISOString().slice(0, 16).replace('T', ' ') : quando },
      ...(data ? [{ rotulo: 'Horário de Brasília', valor: brasilia(data) }] : []),
      { rotulo: 'Sequencial', valor: seq, dica: 'Único dentro do mesmo minuto para o mesmo agente' },
    ],
  };
}

function uuid(texto: string): Identificador {
  const hex = texto.replace(/-/g, '').toLowerCase();
  const erros: string[] = [];
  if (!/^[0-9a-f]{32}$/.test(hex)) return { tipo: 'desconhecido', valido: false, campos: [], erros: ['UUID precisa de 32 dígitos hexadecimais'] };
  const versao = parseInt(hex[12], 16);
  const variante = parseInt(hex[16], 16);
  if (variante < 8 || variante > 0xb) erros.push(`Variante "${hex[16]}" não é a do RFC 9562 (esperado 8, 9, a ou b)`);
  const campos: Campo[] = [
    { rotulo: 'UUID', valor: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` },
    { rotulo: 'Versão', valor: `v${versao}${versao === 4 ? ' (aleatório)' : versao === 7 ? ' (ordenado pelo tempo)' : ''}` },
  ];
  let data: Date | undefined;
  if (versao === 7) {
    const ms = parseInt(hex.slice(0, 12), 16);
    data = new Date(ms);
    campos.push({ rotulo: 'Criado em (UTC)', valor: data.toISOString() }, { rotulo: 'Horário de Brasília', valor: brasilia(data) }, { rotulo: 'Milissegundos desde 1970', valor: String(ms) });
  } else if (versao < 1 || versao > 8) {
    erros.push(`Versão ${versao} não existe no RFC 9562`);
  }
  return { tipo: 'uuid', valido: erros.length === 0, erros, versao, data, campos };
}

/** Reconhece o tipo pelo formato e decodifica. */
export function decodificarId(entrada: string): Identificador {
  const texto = entrada.trim();
  // EndToEndId também pode ser só hexadecimal (E + dígitos + a-f): o que decide é a data yyyyMMddHHmm no meio
  if (/^[ED][0-9A-Z]{8}\d{12}/i.test(texto)) return idPix(texto);
  if (/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(texto)) return uuid(texto);
  if (/^[ED]/i.test(texto) && texto.length >= 20) return idPix(texto);
  return { tipo: 'desconhecido', valido: false, campos: [], erros: ['Não reconheci: cole um EndToEndId (E…), um RtrId de devolução (D…) ou um UUID'] };
}
