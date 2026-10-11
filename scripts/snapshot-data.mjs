// Cópia diária das listas (GitHub Action "Atualizar dados"): se a BrasilAPI cair, o site usa estes arquivos.
// Grava public/data/<nome>.json no formato { generatedAt, source, count, data }. Só grava se a lista vier válida.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../public/data/', import.meta.url);
const LISTS = [
  { name: 'banks', url: 'https://brasilapi.com.br/api/banks/v1', min: 300, valid: (x) => /^\d{1,8}$/.test(String(x.ispb)) && typeof x.name === 'string' },
  { name: 'pix-participants', url: 'https://brasilapi.com.br/api/pix/v1/participants', min: 500, valid: (x) => /^\d{1,8}$/.test(String(x.ispb)) && typeof x.nome === 'string' },
];

await mkdir(OUT, { recursive: true });
let failed = 0;
for (const l of LISTS) {
  try {
    const res = await fetch(l.url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('não é uma lista');
    const ok = data.filter(l.valid);
    // proteção: nunca troca uma cópia boa por uma lista vazia ou quebrada
    if (ok.length < l.min) throw new Error(`só ${ok.length} itens válidos (mínimo ${l.min})`);
    const file = new URL(`${l.name}.json`, OUT);
    const previous = await readFile(file, 'utf8').then(JSON.parse).catch(() => null);
    // só regrava se a lista mudou: evita um commit de centenas de KB por dia sem novidade
    if (previous && JSON.stringify(previous.data) === JSON.stringify(ok)) {
      console.log(`= ${l.name}: sem mudança (${ok.length} itens, cópia de ${previous.generatedAt})`);
      continue;
    }
    await writeFile(file, JSON.stringify({ generatedAt: new Date().toISOString(), source: l.url, count: ok.length, data: ok }));
    console.log(`✓ ${l.name}: ${ok.length} itens`);
  } catch (err) {
    failed++;
    console.error(`✗ ${l.name}: ${err.message} (cópia anterior mantida)`);
  }
}
process.exit(failed === LISTS.length ? 1 : 0);
