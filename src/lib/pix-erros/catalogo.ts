import { z } from 'zod';
import raw from '@/data/erros-pix.json';

// Base de códigos de erro do Pix levantada na documentação oficial do BCB (ver docs/pesquisa/erros-pix.md).
// Validada com zod ao carregar: se alguém editar o JSON e quebrar o formato, o build e os testes falham.

export const OrigemSchema = z.enum(['SPI', 'PSP_RECEBEDOR', 'PSP_PAGADOR', 'DICT']);
export type Origem = z.infer<typeof OrigemSchema>;

const FonteSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  versao: z.string(),
  url: z.string().url(),
  data: z.string().nullish(),
  observacao: z.string().nullish(),
});
export type Fonte = z.infer<typeof FonteSchema>;

const CodigoSchema = z.object({
  codigo: z.string().min(2),
  nomeIso: z.string().nullish(),
  descricaoIso: z.string().nullish(),
  descricao: z.string().min(5),
  origem: OrigemSchema,
  mensagem: z.string(),
  cenario: z.string().nullish(),
  acaoRecomendada: z.string().nullish(),
  fonteId: z.string(),
  localNaFonte: z.string().min(5),
  fonteOficial: z.boolean(),
  observacao: z.string().nullish(),
  httpStatus: z.number().int().nullish(),
  grupoDict: z.string().nullish(),
});

const BaseSchema = z.object({
  geradoEm: z.string(),
  fontes: z.array(FonteSchema).min(1),
  codigos: z.array(CodigoSchema).min(1),
  prazos: z.array(z.object({ id: z.string(), descricao: z.string(), valor: z.string(), fonteId: z.string(), localNaFonte: z.string() }).passthrough()),
  mensagensDeErroSemCodigo: z.array(z.object({ mensagem: z.string(), descricao: z.string(), fonteId: z.string(), localNaFonte: z.string() }).passthrough()),
  naoConfirmado: z.array(z.object({ item: z.string(), situacao: z.string() }).passthrough()),
});

export const BASE = BaseSchema.parse(raw);

export type Tipo = 'rejeicao' | 'devolucao' | 'dict';

export interface ErroPix extends z.infer<typeof CodigoSchema> {
  /** Identificador estável (o mesmo código pode existir em mensagens diferentes, ex.: SL02). */
  id: string;
  tipo: Tipo;
  /** Mensagem curta para a tela: "pacs.002", "pacs.004" ou "DICT HTTP 404". */
  mensagemCurta: string;
  fonte: Fonte;
  /** O vínculo cenário ↔ código é dedução (não está escrito literalmente na fonte)? */
  deducao: boolean;
}

const tipoDe = (m: string): Tipo => (m.startsWith('pacs.004') ? 'devolucao' : m.startsWith('Resposta HTTP') ? 'dict' : 'rejeicao');

export const FONTES: Record<string, Fonte> = Object.fromEntries(BASE.fontes.map((f) => [f.id, f]));

export const ERROS: ErroPix[] = BASE.codigos.map((c) => {
  const tipo = tipoDe(c.mensagem);
  const fonte = FONTES[c.fonteId];
  if (!fonte) throw new Error(`código ${c.codigo}: fonte ${c.fonteId} não cadastrada`);
  return {
    ...c,
    tipo,
    id: `${tipo === 'devolucao' ? 'pacs004' : tipo === 'dict' ? 'dict' : 'pacs002'}-${c.codigo}`,
    mensagemCurta: tipo === 'devolucao' ? 'pacs.004' : tipo === 'dict' ? `DICT HTTP ${c.httpStatus ?? ''}`.trim() : 'pacs.002',
    fonte,
    deducao: /dedução|deducao/i.test(c.observacao ?? ''),
  };
});

export const ORIGEM_LABEL: Record<Origem, string> = {
  SPI: 'SPI (Banco Central)',
  PSP_RECEBEDOR: 'PSP recebedor',
  PSP_PAGADOR: 'PSP pagador',
  DICT: 'DICT',
};

export const TIPO_LABEL: Record<Tipo, string> = {
  rejeicao: 'Rejeição do Pix (pacs.002)',
  devolucao: 'Motivo de devolução (pacs.004)',
  dict: 'Erro na consulta de chave (DICT)',
};

export const erroPorId = (id: string) => ERROS.find((e) => e.id === id);
