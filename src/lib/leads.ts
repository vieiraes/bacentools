// Leads do BacenTools: inscrição na newsletter "Mudou no Pix" e pedido de contato/contratação.
// A mesma regra vale no navegador (aqui) e no banco (firestore.rules): o que este arquivo aceita, as regras aceitam.
import { z } from 'zod';

export const PERFIS = [
  { value: 'po', label: 'Product Owner / PM' },
  { value: 'qa', label: 'QA / Testes' },
  { value: 'dev', label: 'Desenvolvimento' },
  { value: 'estudante', label: 'Estudante' },
  { value: 'outro', label: 'Outro' },
] as const;

export type Perfil = (typeof PERFIS)[number]['value'];
export type TipoLead = 'newsletter' | 'contato';

const perfil = z.enum(PERFIS.map((p) => p.value) as [Perfil, ...Perfil[]], { error: 'Escolha o seu perfil' });
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'E-mail longo demais')
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido');
const consentimento = z.literal(true, { error: 'Marque a caixa para concordar' });
const opcional = (max: number) => z.string().trim().max(max, `Até ${max} caracteres`).optional();

const newsletter = z.object({ tipo: z.literal('newsletter'), email, perfil, consentimento });
const contato = z.object({
  tipo: z.literal('contato'),
  email,
  nome: z.string().trim().min(2, 'Informe seu nome').max(120, 'Até 120 caracteres'),
  empresa: opcional(120),
  mensagem: z.string().trim().min(10, 'Conte em poucas palavras o que você precisa').max(2000, 'Até 2000 caracteres'),
  consentimento,
});

export const leadSchema = z.discriminatedUnion('tipo', [newsletter, contato]);
export type Lead = z.infer<typeof leadSchema>;

/** O que vai para o Firestore (sem a data, que o servidor carimba). Campos vazios ficam de fora. */
export type LeadDoc = Lead & { origem?: string };

export type Resultado =
  | { ok: true; doc: LeadDoc }
  | { ok: false; erros: Partial<Record<string, string>>; robo?: true };

/**
 * Valida o formulário. `site` é o campo-isca (honeypot): invisível para pessoas; se vier preenchido, é robô
 * e o lead é descartado em silêncio.
 */
export function validarLead(input: Record<string, unknown>, origem?: string): Resultado {
  if (typeof input.site === 'string' && input.site.trim() !== '') return { ok: false, erros: {}, robo: true };
  const { site: _site, ...dados } = input;
  void _site;
  const r = leadSchema.safeParse(dados);
  if (!r.success) {
    const erros: Record<string, string> = {};
    for (const i of r.error.issues) {
      const campo = String(i.path[0] ?? 'form');
      erros[campo] ??= i.message;
    }
    return { ok: false, erros };
  }
  const doc = Object.fromEntries(Object.entries(r.data).filter(([, v]) => v !== undefined && v !== '')) as LeadDoc;
  const o = origem?.slice(0, 200);
  return { ok: true, doc: o ? { ...doc, origem: o } : doc };
}

/** Linha da lista do painel (o que volta do Firestore). */
export interface LeadRow {
  id: string;
  tipo: TipoLead;
  email: string;
  nome?: string;
  perfil?: Perfil;
  empresa?: string;
  mensagem?: string;
  origem?: string;
  criadoEm?: Date;
}

const CSV_COLS: (keyof LeadRow)[] = ['criadoEm', 'tipo', 'nome', 'email', 'perfil', 'empresa', 'mensagem', 'origem'];

function celula(v: unknown): string {
  const s = v instanceof Date ? v.toISOString() : v == null ? '' : String(v);
  // aspas dobradas; e fórmula de planilha neutralizada (=, +, -, @ no início viram texto)
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(seguro) || seguro !== s ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

/** CSV com ";" (abre direto no Excel em português) e BOM para os acentos. */
export function leadsParaCsv(rows: LeadRow[]): string {
  const linhas = [CSV_COLS.join(';'), ...rows.map((r) => CSV_COLS.map((c) => celula(r[c])).join(';'))];
  return '﻿' + linhas.join('\r\n') + '\r\n';
}

export function filtrarLeads(rows: LeadRow[], f: { tipo?: TipoLead | 'todos'; perfil?: Perfil | 'todos'; texto?: string }): LeadRow[] {
  const t = f.texto?.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!f.tipo || f.tipo === 'todos' || r.tipo === f.tipo) &&
      (!f.perfil || f.perfil === 'todos' || r.perfil === f.perfil) &&
      (!t || [r.email, r.nome, r.empresa, r.mensagem].some((v) => v?.toLowerCase().includes(t))),
  );
}
