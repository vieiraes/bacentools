// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_INIT, debounced, setConsent, storedConsent, track } from '@/lib/analytics';

type Call = unknown[];
let calls: Call[];
let store: Record<string, string>;

beforeEach(() => {
  calls = [];
  store = {};
  vi.stubGlobal('window', {
    gtag: (...a: unknown[]) => calls.push(a),
    localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('analytics (GA4 + Consent Mode v2)', () => {
  it('sem gtag carregado (bloqueador de anúncio, SSR), track não quebra', () => {
    vi.stubGlobal('window', {});
    expect(() => track('search', { search_term: 'ac06' })).not.toThrow();
  });

  it('track envia o evento sem parâmetros vazios', () => {
    track('select_content', { content_type: 'erro_pix', item_id: 'pacs002-AC06', vazio: '', nada: undefined });
    expect(calls).toEqual([['event', 'select_content', { content_type: 'erro_pix', item_id: 'pacs002-AC06' }]]);
  });

  it('aceitar grava a escolha, libera só analytics (anúncios sempre negados) e registra a escolha', () => {
    expect(storedConsent()).toBeNull();
    setConsent('granted');
    expect(storedConsent()).toBe('granted');
    expect(calls[0]).toEqual(['consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }]);
    expect(calls[1]).toEqual(['event', 'consent_choice', { choice: 'granted' }]);
  });

  it('valor desconhecido no armazenamento é ignorado; navegação privada sem localStorage não quebra', () => {
    store.bt_consent_v1 = 'talvez';
    expect(storedConsent()).toBeNull();
    vi.stubGlobal('window', { gtag: () => {}, localStorage: { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } } });
    expect(storedConsent()).toBeNull();
    expect(() => setConsent('denied')).not.toThrow();
  });

  it('o script inicial nega tudo por padrão antes do GA carregar', () => {
    expect(CONSENT_INIT).toMatch(/gtag\('consent', 'default'/);
    expect(CONSENT_INIT).toMatch(/ad_storage: 'denied'/);
    expect(CONSENT_INIT).toMatch(/G-[A-Z0-9]+/);
  });

  it('debounced só dispara quando a pessoa para de digitar', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounced(fn, 1000);
    d('a'); d('ac'); d('ac0'); d('ac06');
    vi.advanceTimersByTime(999);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('ac06');
    vi.useRealTimers();
  });
});
