// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Mod = typeof import('@/lib/analytics');
let store: Record<string, string>;
let scripts: { src: string; async: boolean }[];
let cookies: string[];
let eventos: string[];

/** Janela de navegador mínima: o módulo só usa localStorage, location, dataLayer, document.head e document.cookie. */
function navegador() {
  store = {};
  scripts = [];
  cookies = [];
  eventos = [];
  vi.stubGlobal('window', {
    location: { origin: 'https://bacentools.web.app', hostname: 'bacentools.web.app' },
    localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } },
    dispatchEvent: (e: Event) => eventos.push(e.type),
  });
  vi.stubGlobal('document', {
    title: 'Bancos · BacenTools',
    createElement: () => ({ src: '', async: false }),
    head: { appendChild: (s: { src: string; async: boolean }) => scripts.push(s) },
    get cookie() { return '_ga=GA1.1.1; _ga_69FZL5N4D5=GS1.1; outro=1'; },
    set cookie(v: string) { cookies.push(v); },
  });
}

async function carregar(id = 'G-69FZL5N4D5'): Promise<Mod> {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_GA_ID', id);
  return import('@/lib/analytics');
}

const camadas = () => ((window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? []).map((a) => Array.from(a));
const w = () => window as unknown as Record<string, unknown>;

beforeEach(navegador);
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('consentimento (aviso de cookies versão 2)', () => {
  it('sem escolha, valor da versão antiga ou desconhecido: o aviso pergunta', async () => {
    const a = await carregar();
    expect(a.lerConsentimento()).toBeNull();
    store.bt_consent_v1 = 'granted';
    store['bt-aviso-cookies'] = '1:aceito';
    expect(a.lerConsentimento()).toBeNull();
  });

  it('grava e lê aceito e recusado na versão atual', async () => {
    const a = await carregar();
    a.gravarConsentimento('aceito');
    expect(store['bt-aviso-cookies']).toBe('2:aceito');
    expect(a.lerConsentimento()).toBe('aceito');
    a.gravarConsentimento('recusado');
    expect(a.lerConsentimento()).toBe('recusado');
  });

  it('navegação privada sem localStorage não quebra', async () => {
    const a = await carregar();
    vi.stubGlobal('window', { localStorage: { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } } });
    expect(a.lerConsentimento()).toBeNull();
    expect(() => a.gravarConsentimento('aceito')).not.toThrow();
  });

  it('abrirAvisoCookies dispara o evento que o aviso escuta', async () => {
    const a = await carregar();
    a.abrirAvisoCookies();
    expect(eventos).toEqual([a.EVENTO_ABRIR_AVISO_COOKIES]);
  });
});

describe('registrarVisita', () => {
  it('sem aceite, nada do Google é carregado', async () => {
    const a = await carregar();
    a.registrarVisita('/bancos/');
    a.gravarConsentimento('recusado');
    a.registrarVisita('/bancos/');
    expect(scripts).toEqual([]);
    expect(camadas()).toEqual([]);
    expect(w().gtag).toBeUndefined();
  });

  it('sem ID configurado (npm run dev), nada é carregado mesmo com aceite', async () => {
    const a = await carregar('');
    a.gravarConsentimento('aceito');
    a.registrarVisita('/bancos/');
    expect(a.analyticsConfigurado()).toBe(false);
    expect(scripts).toEqual([]);
  });

  it('com aceite: carrega o gtag.js uma vez, sem Signals nem anúncios, e conta só o caminho', async () => {
    const a = await carregar();
    a.gravarConsentimento('aceito');
    a.registrarVisita('/decodificador-pix/');
    expect(scripts).toEqual([{ src: 'https://www.googletagmanager.com/gtag/js?id=G-69FZL5N4D5', async: true }]);
    const c = camadas();
    expect(c[0]).toEqual(['consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }]);
    expect(c[1][0]).toBe('js');
    expect(c[2]).toEqual(['config', 'G-69FZL5N4D5', { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 34128000 }]);
    expect(c[3]).toEqual(['set', { page_location: 'https://bacentools.web.app/decodificador-pix/' }]);
    expect(c[4]).toEqual(['event', 'page_view', { page_location: 'https://bacentools.web.app/decodificador-pix/', page_path: '/decodificador-pix/', page_title: 'Bancos · BacenTools' }]);

    a.registrarVisita('/decodificador-pix/'); // mesmo caminho (hidratação, Strict Mode): não é visita nova
    a.registrarVisita('/bancos/');
    expect(scripts).toHaveLength(1);
    expect(camadas().filter((x) => x[1] === 'page_view').map((x) => (x[2] as { page_path: string }).page_path)).toEqual(['/decodificador-pix/', '/bancos/']);
  });

  it('da query, só os utm_* da campanha vão para o GA', async () => {
    const a = await carregar();
    expect(a.queryDeCampanha('')).toBe('');
    expect(a.queryDeCampanha('?codigo=000201br.gov.bcb.pix')).toBe('');
    expect(a.queryDeCampanha('?codigo=000201&utm_source=linkedin&utm_campaign=erros-pix&utm_x-1=a')).toBe('?utm_source=linkedin&utm_campaign=erros-pix');

    (window as unknown as { location: { search: string } }).location.search = '?utm_source=whatsapp&codigo=000201';
    a.gravarConsentimento('aceito');
    a.registrarVisita('/decodificador-pix/');
    expect(camadas().at(-1)).toEqual(['event', 'page_view', expect.objectContaining({
      page_location: 'https://bacentools.web.app/decodificador-pix/?utm_source=whatsapp', page_path: '/decodificador-pix/',
    })]);
  });

  it('o /admin/ nunca é medido e trava a medição otimizada até sair dele', async () => {
    const a = await carregar();
    a.gravarConsentimento('aceito');
    expect(a.paginaMedida('/admin/')).toBe(false);
    expect(a.paginaMedida('/admin')).toBe(false);
    expect(a.paginaMedida('/administracao-pix/')).toBe(true);
    a.registrarVisita('/admin/');
    expect(scripts).toEqual([]); // abrir direto no painel nem carrega o GA

    a.registrarVisita('/');
    a.registrarVisita('/admin/');
    expect(w()['ga-disable-G-69FZL5N4D5']).toBe(true);
    a.registrarVisita('/'); // voltou do painel: conta de novo
    expect(w()['ga-disable-G-69FZL5N4D5']).toBe(false);
    expect(camadas().filter((x) => x[1] === 'page_view')).toHaveLength(2);
  });

  it('recusar depois de aceitar desliga a medição e apaga os cookies _ga', async () => {
    const a = await carregar();
    a.gravarConsentimento('aceito');
    a.registrarVisita('/');
    a.desligarAnalytics();
    expect(w()['ga-disable-G-69FZL5N4D5']).toBe(true);
    expect(camadas().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(cookies).toEqual([
      '_ga=; Max-Age=0; path=/',
      '_ga=; Max-Age=0; path=/; domain=bacentools.web.app',
      '_ga=; Max-Age=0; path=/; domain=.bacentools.web.app',
      '_ga_69FZL5N4D5=; Max-Age=0; path=/',
      '_ga_69FZL5N4D5=; Max-Age=0; path=/; domain=bacentools.web.app',
      '_ga_69FZL5N4D5=; Max-Age=0; path=/; domain=.bacentools.web.app',
    ]);
  });

  it('desligar sem ID configurado não mexe em nada', async () => {
    const a = await carregar('');
    a.desligarAnalytics();
    expect(cookies).toEqual([]);
  });
});

describe('track', () => {
  it('sem gtag (sem aceite, bloqueador, build no servidor), não quebra nem envia', async () => {
    const a = await carregar();
    expect(() => a.track('search', { search_term: 'ac06' })).not.toThrow();
    vi.stubGlobal('window', undefined);
    expect(() => a.track('search', { search_term: 'ac06' })).not.toThrow();
  });

  it('envia o evento sem parâmetros vazios', async () => {
    const a = await carregar();
    a.gravarConsentimento('aceito');
    a.registrarVisita('/');
    a.track('select_content', { content_type: 'erro_pix', item_id: 'pacs002-AC06', vazio: '', nada: undefined });
    expect(camadas().at(-1)).toEqual(['event', 'select_content', { content_type: 'erro_pix', item_id: 'pacs002-AC06' }]);
  });
});

describe('debounced', () => {
  it('só dispara quando a pessoa para de digitar', async () => {
    const a = await carregar();
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = a.debounced(fn, 1000);
    d('a'); d('ac'); d('ac0'); d('ac06');
    vi.advanceTimersByTime(999);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('ac06');
    vi.useRealTimers();
  });
});
