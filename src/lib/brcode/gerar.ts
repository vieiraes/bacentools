// Gerador de BR Code estático (Pix Copia e Cola + QR Code), conferido pelo próprio decodificador antes de sair.
import { crc16, decodificarBrCode, GUI_PIX, tipoDaChave, type TipoChave } from './brcode';

export const LIMITES = {
  /** EMV® QRCPS-MPM (citada na nota 25 do Manual de Padrões): Merchant Name até 25 caracteres */
  nome: 25,
  /** EMV® QRCPS-MPM: Merchant City até 15 caracteres */
  cidade: 15,
  /** Manual de Padrões 2.6.2 */
  txid: 25,
  /** EMV® QRCPS-MPM: Transaction Amount até 13 caracteres */
  valor: 13,
} as const;

export interface DadosQr {
  chave: string;
  nome: string;
  cidade: string;
  valor?: string;
  txid?: string;
  infoAdicional?: string;
}

export type ResultadoGeracao =
  | { ok: true; codigo: string; chave: string; tipoChave: TipoChave; avisos: string[] }
  | { ok: false; erros: Partial<Record<keyof DadosQr, string>> };

/** Remove acentos e o que não for letra, dígito, espaço ou pontuação simples (o exemplo do manual usa "BRASILIA"). */
export function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 .,&'/-]/g, '').replace(/\s+/g, ' ').trim();
}

/** Deixa a chave como o DICT espera (seção 2.5.1): CPF/CNPJ sem pontuação, celular com +55. */
export function normalizarChave(entrada: string): string {
  const s = entrada.trim();
  if (s.includes('@')) return s;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return s.toLowerCase();
  const limpo = s.replace(/[\s().\-/]/g, '');
  if (/^\+55\d{10,11}$/.test(limpo)) return limpo;
  if (/^\(?\d{2}\)?\s?9\d{4}-?\d{4}$/.test(s.trim())) return `+55${limpo}`; // (61) 91234-5678
  if (/^[0-9A-Za-z]{14}$/.test(limpo) || /^\d{11}$/.test(limpo)) return limpo.toUpperCase();
  return s;
}

const peso = (c: string) => c.charCodeAt(0) - 48; // CNPJ alfanumérico: valor do caractere = código ASCII − 48

/** Dígitos verificadores de CPF (módulo 11). */
export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const dv = (n: number) => {
    const soma = [...cpf.slice(0, n)].reduce((s, c, i) => s + Number(c) * (n + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(cpf[9]) && dv(10) === Number(cpf[10]);
}

/** Dígitos verificadores de CNPJ, numérico ou alfanumérico (mesmo cálculo, com o valor ASCII − 48 de cada caractere). */
export function cnpjValido(cnpj: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const r = [...base].reduce((s, c, i) => s + peso(c) * pesos[i], 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(cnpj.slice(0, 12));
  const d2 = dv(cnpj.slice(0, 12) + d1);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

/** "1.234,50" ou "1234.5" → "1234.50"; vazio → undefined; inválido → null. */
export function normalizarValor(entrada?: string): string | undefined | null {
  const s = entrada?.trim().replace(/^R\$\s*/, '');
  if (!s) return undefined;
  // vírgula é decimal (10,50); vírgula como milhar só no formato americano completo (1,234.50)
  const br = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(s) ? s.replace(/,/g, '') : s.includes(',') ? 'x' : s;
  if (!/^\d+(\.\d{1,2})?$/.test(br)) return null;
  const n = Number(br);
  if (!(n > 0)) return null;
  return n.toFixed(2);
}

const tlv = (id: string, valor: string) => `${id}${String(valor.length).padStart(2, '0')}${valor}`;

export function gerarBrCode(d: DadosQr): ResultadoGeracao {
  const erros: Partial<Record<keyof DadosQr, string>> = {};
  const avisos: string[] = [];

  const chave = normalizarChave(d.chave);
  const tipoChave = tipoDaChave(chave);
  if (!chave) erros.chave = 'Informe a chave Pix';
  else if (tipoChave === 'desconhecido') erros.chave = 'Use e-mail, CPF, CNPJ, celular com DDD ou chave aleatória';
  else if (chave.length > 77) erros.chave = 'Chave com mais de 77 caracteres';
  if (tipoChave === 'cpf' && !cpfValido(chave)) avisos.push('Os dígitos verificadores do CPF não conferem: confira a chave.');
  if (tipoChave === 'cnpj' && !cnpjValido(chave)) avisos.push('Os dígitos verificadores do CNPJ não conferem: confira a chave.');

  const nome = semAcento(d.nome);
  if (!nome) erros.nome = 'Informe o nome de quem recebe';
  else if (nome.length > LIMITES.nome) erros.nome = `Até ${LIMITES.nome} caracteres (sem acentos: ${nome.length})`;
  const cidade = semAcento(d.cidade).toUpperCase();
  if (!cidade) erros.cidade = 'Informe a cidade';
  else if (cidade.length > LIMITES.cidade) erros.cidade = `Até ${LIMITES.cidade} caracteres (sem acentos: ${cidade.length})`;

  const valor = normalizarValor(d.valor);
  if (valor === null) erros.valor = 'Valor inválido (ex.: 10,50)';
  else if (valor && valor.length > LIMITES.valor) erros.valor = 'Valor alto demais';

  const txid = d.txid?.trim() || '***';
  if (txid !== '***' && !/^[a-zA-Z0-9]{1,25}$/.test(txid)) erros.txid = 'Só letras e números, sem espaço, até 25 caracteres';

  const info = d.infoAdicional?.trim() ? semAcento(d.infoAdicional) : '';
  // chave e infoAdicional disputam os 99 caracteres do ID 26 (seção 2.6.1)
  const sobra = 99 - (4 + GUI_PIX.length) - (4 + chave.length) - 4;
  if (info && info.length > sobra) erros.infoAdicional = `Com esta chave, cabem ${Math.max(sobra, 0)} caracteres (seção 2.6.1)`;

  if (Object.keys(erros).length) return { ok: false, erros };

  const conta = tlv('00', GUI_PIX) + tlv('01', chave) + (info ? tlv('02', info) : '');
  const corpo =
    tlv('00', '01') + tlv('26', conta) + tlv('52', '0000') + tlv('53', '986') + (valor ? tlv('54', valor) : '') +
    tlv('58', 'BR') + tlv('59', nome) + tlv('60', cidade) + tlv('62', tlv('05', txid)) + '6304';
  const codigo = corpo + crc16(corpo);

  // conferência final pelo mesmo validador do decodificador
  const conferido = decodificarBrCode(codigo);
  /* c8 ignore next */
  if (!conferido.valido) throw new Error(`Gerador produziu BR Code inválido: ${conferido.verificacoes.filter((v) => !v.ok).map((v) => v.id).join(', ')}`);

  if (d.nome.trim() !== nome || d.cidade.trim().toUpperCase() !== cidade) avisos.push('Acentos e símbolos foram removidos do nome e da cidade.');
  return { ok: true, codigo, chave, tipoChave, avisos };
}
