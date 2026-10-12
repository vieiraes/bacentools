// Verificação semanal dos links oficiais (GitHub Action "Verificar links").
// Grava public/data/links-status.json, que a página /links-pix/ lê direto do GitHub para mostrar a última verificação.
// Sai com código 1 se algum link quebrou (a Action abre uma issue).
// Uso: node --experimental-strip-types scripts/check-links.mjs
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { GRUPOS, LINKS_CONFERIDOS_EM } from '../src/lib/links.ts';
import { verificarLink } from '../src/lib/verificar-links.ts';

const erros = JSON.parse(await readFile(new URL('../src/data/erros-pix.json', import.meta.url), 'utf8'));
const alvos = new Map();
for (const g of GRUPOS) for (const l of g.links) alvos.set(l.url, l.titulo);
for (const f of erros.fontes) if (!alvos.has(f.url)) alvos.set(f.url, `${f.titulo} (fonte do catálogo de erros)`);

const resultados = [];
for (const [url, titulo] of alvos) {
  const r = await verificarLink(url);
  resultados.push({ ...r, titulo });
  console.log(`${r.ok ? '✔' : '✘'} ${titulo}${r.ok ? '' : ` — ${r.motivo}`}`);
}

const quebrados = resultados.filter((r) => !r.ok).map(({ titulo, url, motivo }) => ({ titulo, url, motivo }));
const status = { revisadoEm: LINKS_CONFERIDOS_EM, verificadoEm: new Date().toISOString(), total: resultados.length, quebrados };
await writeFile(new URL('../public/data/links-status.json', import.meta.url), JSON.stringify(status, null, 2) + '\n');

const resumo = quebrados.length
  ? `### ✘ ${quebrados.length} de ${status.total} links com problema\n\n${quebrados.map((q) => `- [${q.titulo}](${q.url}): ${q.motivo}`).join('\n')}\n`
  : `### ✔ Todos os ${status.total} links funcionando\n`;
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, resumo);
await writeFile(new URL('../links-check-report.md', import.meta.url), resumo);
process.exitCode = quebrados.length ? 1 : 0;
