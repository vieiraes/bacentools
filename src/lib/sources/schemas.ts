import { z } from 'zod';
import { formatIspb } from '../domain/text';

// Contratos das fontes externas, validados em tempo de execução: se a BrasilAPI ou o BCB mudarem o formato,
// o erro aparece aqui (e nos testes de contrato), não espalhado pela tela.

const ispb = z.union([z.string(), z.number()]).transform(formatIspb).pipe(z.string().regex(/^\d{8}$/));

export const BankSchema = z.object({
  ispb,
  name: z.string().nullable().transform((s) => s ?? ''),
  code: z.number().int().nullable(),
  fullName: z.string().nullable().transform((s) => s ?? ''),
  logo_url: z.string().url().nullish(),
  headquarters_address: z.object({ city: z.string().nullish(), state: z.string().nullish() }).nullish(),
}).transform((b) => ({
  ispb: b.ispb,
  name: b.name,
  code: b.code,
  fullName: b.fullName || b.name,
  logoUrl: b.logo_url ?? null,
  city: b.headquarters_address?.city ?? null,
  state: b.headquarters_address?.state ?? null,
}));
export type Bank = z.output<typeof BankSchema>;

export const PixParticipantSchema = z.object({
  ispb,
  nome: z.string(),
  nome_reduzido: z.string().nullish(),
  modalidade_participacao: z.string(),
  tipo_participacao: z.string(),
  inicio_operacao: z.string().nullish(),
}).transform((p) => ({
  ispb: p.ispb,
  name: p.nome,
  shortName: p.nome_reduzido || p.nome,
  modality: p.modalidade_participacao,
  participation: p.tipo_participacao,
  startedAt: p.inicio_operacao ?? null,
}));
export type PixParticipant = z.output<typeof PixParticipantSchema>;

export const InformeTipo = z.enum(['SPI', 'STR']);
export type InformeTipo = z.infer<typeof InformeTipo>;

export const BcbInformeSchema = z.object({
  Id: z.number(),
  titulo: z.string(),
  dataReferencia: z.string(),
  DataPublicacao: z.string().nullish(),
  Tamanho: z.union([z.string(), z.number()]).nullish(),
  arquivo: z.object({ Name: z.string(), ServerRelativeUrl: z.string() }),
});
export const BcbInformesResponse = z.object({ conteudo: z.array(BcbInformeSchema) });

export interface Informe {
  id: number;
  tipo: InformeTipo;
  title: string;
  referenceDate: string;
  publishedAt: string | null;
  pdfUrl: string;
  fileName: string;
  sizeBytes: number | null;
}

export const toInforme = (tipo: InformeTipo, i: z.infer<typeof BcbInformeSchema>): Informe => ({
  id: i.Id,
  tipo,
  title: i.titulo,
  referenceDate: i.dataReferencia,
  publishedAt: i.DataPublicacao ?? null,
  pdfUrl: `https://www.bcb.gov.br${i.arquivo.ServerRelativeUrl}`,
  fileName: i.arquivo.Name,
  sizeBytes: i.Tamanho == null ? null : Number(i.Tamanho),
});
