import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { SITE, TOOLS } from '@/lib/tools';

describe('registro de ferramentas (menu, início e sitemap)', () => {
  it('cada ferramenta tem caminho único com barra final e uma página no app', () => {
    const paths = TOOLS.map((t) => t.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const t of TOOLS) {
      expect(t.path, t.title).toMatch(/^\/[a-z-]+\/$/);
      expect(existsSync(`src/app${t.path}page.tsx`), t.path).toBe(true);
      expect(t.description.length, t.path).toBeGreaterThan(40);
    }
  });

  it('o site aponta para o domínio e o repositório oficiais', () => {
    expect(SITE.url).toBe('https://bacentools.web.app');
    expect(SITE.repo).toBe('https://github.com/vieiraes/bacentools');
  });
});
