/** Texto para busca: minúsculas, sem acento e sem espaços repetidos ("São Paulo" → "sao paulo"). */
export function normalize(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Todas as palavras da busca aparecem em algum dos campos (ordem livre, sem acento). */
export function matches(query: string, ...fields: Array<string | number | null | undefined>): boolean {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const haystack = fields.map((f) => normalize(f == null ? '' : String(f))).join(' ');
  return words.every((w) => haystack.includes(w));
}

/** ISPB sempre com 8 dígitos (o BCB às vezes publica sem os zeros à esquerda). */
export const formatIspb = (ispb: string | number) => String(ispb).replace(/\D/g, '').padStart(8, '0');

/** Código COMPE com 3 dígitos ("1" → "001"); null quando a instituição não tem COMPE. */
export const formatCompe = (code: number | null | undefined) => (code == null ? null : String(code).padStart(3, '0'));

export const formatBytes = (n: number) => (n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

/** "1 instituição", "2 instituições", "1.234 participantes" (número no formato brasileiro). */
export const plural = (n: number, singular: string, pluralForm: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? singular : pluralForm}`;
