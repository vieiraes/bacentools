import { z } from 'zod';
import rawMensagens from '@/data/spb/mensagens.json';
import rawDominios from '@/data/spb/dominios.json';
import rawErros from '@/data/spb/erros.json';
import rawGrade from '@/data/spb/grade.json';
import rawFontes from '@/data/spb/fontes.json';

// Dados da área SPB/TED, gerados por scripts/spb-catalogo.mjs a partir dos arquivos oficiais do BCB
// (XSD do Catálogo de Serviços do SFN, Dicionário de Domínios, Relação de Erros e Grade de horários do SPB).
// Validados com zod ao carregar: se o JSON quebrar, o build e os testes falham.

const TipoSchema = z.object({
  nome: z.string(),
  base: z.string(),
  descricao: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  length: z.number().optional(),
  totalDigits: z.number().optional(),
  fractionDigits: z.number().optional(),
  minInclusive: z.number().optional(),
  maxInclusive: z.number().optional(),
  pattern: z.string().optional(),
  valores: z.array(z.string()).optional(),
});
export type TipoCampo = z.infer<typeof TipoSchema>;

export interface Campo {
  tag: string;
  nome: string;
  descricao?: string;
  obrigatorio: boolean;
  repete?: string;
  fixo?: string;
  /** campos com o mesmo número formam um grupo "OU" (xs:choice): exatamente um deles */
  ou?: number;
  tipo?: TipoCampo;
  /** grupo (ex.: Grupo_STR0008_Split) */
  campos?: Campo[];
}
const CampoSchema: z.ZodType<Campo> = z.lazy(() =>
  z.object({
    tag: z.string().min(2),
    nome: z.string().min(2),
    descricao: z.string().optional(),
    obrigatorio: z.boolean(),
    repete: z.string().optional(),
    fixo: z.string().optional(),
    ou: z.number().int().optional(),
    tipo: TipoSchema.optional(),
    campos: z.array(CampoSchema).optional(),
  }),
);

const MensagemSchema = z.object({
  codigo: z.string().regex(/^[A-Z]{3}\d{4}(R1|R2|R3|E)?$/),
  titulo: z.string().min(5),
  emissor: z.string(),
  destinatario: z.string(),
  campos: z.array(CampoSchema).min(3),
});
export type MensagemSpb = z.infer<typeof MensagemSchema>;

const EventoSchema = z.object({
  codigo: z.string().regex(/^[A-Z]{3}\d{4}$/),
  grupo: z.enum(['STR', 'PAG']),
  volume: z.string(),
  papel: z.enum(['ted', 'devolucao']),
  titulo: z.string().min(5),
  descricao: z.string().min(5),
  fluxo: z.string(),
  regras: z.array(z.object({ codigo: z.string().regex(/^R[A-Z]{3}\d{4}$/), texto: z.string().min(10) })),
  xsd: z.string(),
  mensagens: z.array(MensagemSchema).min(1),
  bcmsg: z.array(CampoSchema).min(2),
});
export type EventoSpb = z.infer<typeof EventoSchema>;

const ItemSchema = z.object({ codigo: z.string().min(1), descricao: z.string().min(1), desde: z.string().optional() });
export type ItemDominio = z.infer<typeof ItemSchema>;

const Janela = z.object({ abre: z.string().regex(/^\d{2}:\d{2}$/), fecha: z.string().regex(/^\d{2}:\d{2}$/) }).nullable();
const GradeSchema = z.object({
  grade: z.string(),
  mensagens: z.array(z.string()),
  natal: Janela,
  ultimoDia: Janela,
  util: Janela,
  sabadoFeriado: Janela,
  domingo: Janela,
});
export type GradeHorario = z.infer<typeof GradeSchema>;

const FontesSchema = z.object({
  geradoEm: z.string(),
  versao: z.string(),
  producao: z.string(),
  versaoAnterior: z.string(),
  tedIgualNaVersaoAnterior: z.boolean(),
  split: z.object({ versao: z.string(), producao: z.string(), fonte: z.string().url() }),
  paginaCatalogos: z.string().url(),
  catalogo: z.record(z.string(), z.object({ titulo: z.string(), xsd: z.string().url(), volumes: z.record(z.string(), z.string().url()) })),
  dominios: z.object({ titulo: z.string(), arquivo: z.string(), url: z.string().url() }),
  erros: z.object({ titulo: z.string(), arquivo: z.string(), url: z.string().url() }),
  grade: z.object({ titulo: z.string(), url: z.string().url() }),
});

export const CATALOGO = z.object({ versao: z.string(), eventos: z.array(EventoSchema).length(4) }).parse(rawMensagens);
export const DOMINIOS = z.record(z.string(), z.array(ItemSchema).min(1)).parse(rawDominios);
export const ERROS_SPB = z.array(ItemSchema.extend({ codigo: z.string().regex(/^E(GEN|STR|PAG)\d{4}$/) })).min(100).parse(rawErros);
export const GRADE = z.array(GradeSchema).min(1).parse(rawGrade);
export const FONTES_SPB = FontesSchema.parse(rawFontes);

export const EVENTOS = CATALOGO.eventos;
export const eventoPorCodigo = (c: string) => EVENTOS.find((e) => e.codigo === c);
/** Mensagem pelo código, incluindo as respostas (STR0008R1, STR0008R2…). */
export function mensagemPorCodigo(codigo: string): { evento: EventoSpb; mensagem: MensagemSpb } | undefined {
  for (const evento of EVENTOS) {
    const mensagem = evento.mensagens.find((m) => m.codigo === codigo);
    if (mensagem) return { evento, mensagem };
  }
  return undefined;
}
export const erroSpbPorCodigo = (c: string) => ERROS_SPB.find((e) => e.codigo === c.toUpperCase());
export const descricaoDominio = (tipo: string, codigo: string) => DOMINIOS[tipo]?.find((d) => d.codigo === codigo)?.descricao;

/** Rótulo do participante como aparece no catálogo. */
export const PARTICIPANTE: Record<string, string> = {
  'IF-DEBITADA': 'IF debitada (banco de quem envia)',
  'IF-CREDITADA': 'IF creditada (banco de quem recebe)',
  STR: 'STR (Banco Central)',
  'Câmara PAG': 'SITRAF (Núclea)',
};

/** Percorre todos os campos (inclusive dentro de grupos) com o caminho de tags. */
export function percorrer(campos: Campo[], cb: (c: Campo, caminho: string[]) => void, caminho: string[] = []) {
  for (const c of campos) {
    cb(c, [...caminho, c.tag]);
    if (c.campos) percorrer(c.campos, cb, [...caminho, c.tag]);
  }
}

/** "Até 20 caracteres", "19 dígitos, 2 decimais", "8 caracteres [0-9A-Z]"… para a tela. */
export function formatoDoTipo(t?: TipoCampo): string {
  if (!t) return 'grupo';
  const partes: string[] = [];
  if (t.base === 'decimal') partes.push(`número até ${t.totalDigits ?? '?'} dígitos${t.fractionDigits ? `, ${t.fractionDigits} decimais` : ''}`);
  else if (t.base === 'integer') partes.push(`inteiro até ${t.totalDigits ?? '?'} dígitos`);
  else if (t.base === 'date') partes.push('data AAAA-MM-DD');
  else if (t.base === 'time') partes.push('hora HH:MM:SS');
  else if (t.base === 'dateTime') partes.push('data e hora AAAA-MM-DDTHH:MM:SS');
  else if (t.minLength !== undefined && t.minLength === t.maxLength) partes.push(`${t.maxLength} caracteres`);
  else if (t.maxLength !== undefined) partes.push(t.minLength && t.minLength > 1 ? `${t.minLength} a ${t.maxLength} caracteres` : `até ${t.maxLength} caracteres`);
  else partes.push(t.base);
  if (t.pattern) partes.push(`padrão ${t.pattern}`);
  if (t.valores) partes.push(`valores: ${t.valores.join(', ')}`);
  return partes.join('; ');
}
