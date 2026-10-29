// Google Analytics 4 (gtag.js), propriedade ligada ao Firebase do projeto bacentools.
// Regras (LGPD): nada do Google carrega antes do "Aceitar" no aviso de cookies; o /admin/ nunca é medido.
// Vai só o caminho da página e os utm_* da campanha (o resto da ?query e o #hash não: o decodificador recebe o código Pix inteiro em ?codigo=).
// Sem Google Signals nem anúncios, cookie de 13 meses. Sem NEXT_PUBLIC_GA_ID (npm run dev), nada é carregado.
// Toda medição do site passa por track(): um lugar só para nomear eventos e parâmetros.

export const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? '').trim();
/** 13 meses, em segundos: o padrão do Google é 2 anos. */
const VALIDADE_COOKIE = 60 * 60 * 24 * 395;

export const CHAVE_AVISO_COOKIES = 'bt-aviso-cookies';
/** Versão do aviso. A 2 deixou de carregar o GA antes do aceite: quem respondeu a 1 (bt_consent_v1) é perguntado de novo. */
export const VERSAO_AVISO_COOKIES = '2';
export const EVENTO_ABRIR_AVISO_COOKIES = 'bt:abrir-aviso-cookies';

export type Consentimento = 'aceito' | 'recusado';

type Gtag = (...args: unknown[]) => void;
type JanelaComGtag = Window & { dataLayer?: unknown[]; gtag?: Gtag } & Record<string, unknown>;
const janela = () => window as unknown as JanelaComGtag;

let carregado = false;
/** Última página contada: o efeito roda de novo sem troca de página (hidratação, Strict Mode) e isso não é visita nova. */
let ultima = '';

export const analyticsConfigurado = () => GA_ID !== '';

/** Reabre o aviso (rodapé "Preferências de cookies" e página de privacidade). */
export function abrirAvisoCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_AVISO_COOKIES));
}

/** Escolha da versão atual do aviso; `null` se a pessoa ainda não escolheu (ou o navegador não guarda). */
export function lerConsentimento(): Consentimento | null {
  try {
    const valor = window.localStorage.getItem(CHAVE_AVISO_COOKIES);
    if (valor === `${VERSAO_AVISO_COOKIES}:aceito`) return 'aceito';
    if (valor === `${VERSAO_AVISO_COOKIES}:recusado`) return 'recusado';
    return null;
  } catch {
    return null;
  }
}

export function gravarConsentimento(escolha: Consentimento) {
  try {
    window.localStorage.setItem(CHAVE_AVISO_COOKIES, `${VERSAO_AVISO_COOKIES}:${escolha}`);
  } catch {
    /* navegação privada: vale só nesta visita, e o aviso volta na próxima */
  }
}

/** Da query, só os parâmetros de campanha (utm_*) vão para o GA: é com eles que o GA sabe de onde veio a visita. */
export function queryDeCampanha(search: string) {
  const utm = [...new URLSearchParams(search)].filter(([k]) => /^utm_[a-z_]+$/.test(k));
  return utm.length ? `?${new URLSearchParams(utm)}` : '';
}

/** Páginas medidas: todas, menos o painel de leads. */
export const paginaMedida = (caminho: string) => !/^\/admin(\/|$)/.test(caminho);

function carregar() {
  const w = janela();
  w[`ga-disable-${GA_ID}`] = false;
  if (carregado) return;
  carregado = true;
  w.dataLayer = w.dataLayer ?? [];
  // O gtag.js espera o objeto `arguments`, não um array
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  w.gtag('js', new Date());
  w.gtag('config', GA_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: VALIDADE_COOKIE,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

/** Conta a visita à página, se ela for medida e a pessoa tiver aceitado. Chamar a cada troca de página. */
export function registrarVisita(caminho: string) {
  if (!paginaMedida(caminho)) {
    ultima = '';
    // Trava extra: a "medição otimizada" do GA4 contaria a ida para o painel sozinha
    if (carregado) janela()[`ga-disable-${GA_ID}`] = true;
    return;
  }
  if (!analyticsConfigurado() || caminho === ultima || lerConsentimento() !== 'aceito') return;
  ultima = caminho;
  carregar();
  const pagina = `${window.location.origin}${caminho}${queryDeCampanha(window.location.search ?? '')}`;
  const gtag = janela().gtag!;
  // vale para todos os eventos seguintes (rolagem, cliques, track): nenhum leva a query da página
  gtag('set', { page_location: pagina });
  gtag('event', 'page_view', { page_location: pagina, page_path: caminho, page_title: document.title });
}

/** Recusou depois de ter aceitado: para de medir nesta aba e apaga os cookies do Analytics. */
export function desligarAnalytics() {
  if (!analyticsConfigurado()) return;
  const w = janela();
  w[`ga-disable-${GA_ID}`] = true;
  ultima = '';
  w.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  const dominios = ['', window.location.hostname, `.${window.location.hostname}`];
  for (const nome of document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n === '_ga' || n.startsWith('_ga_'))) {
    for (const dominio of dominios) {
      document.cookie = `${nome}=; Max-Age=0; path=/${dominio ? `; domain=${dominio}` : ''}`;
    }
  }
}

/** Eventos do BacenTools (nomes estáveis: viram relatórios e conversões no GA4). */
export type EventName =
  | 'consent_choice'
  | 'search' // busca em bancos, participantes, informes e catálogo de erros
  | 'select_content' // escolheu um cenário/código de erro, ferramenta, informe
  | 'scenario_play' // rodou a animação de um cenário do Pix
  | 'simulator_action' // operação no simulador do DICT
  | 'copy_ispb'
  | 'generate_brcode' // copiou ou baixou um QR Code do gerador
  | 'decode' // colou algo no decodificador de QR Code Pix ou de identificadores
  | 'file_download' // PDF de informe do BCB
  | 'generate_lead' // deixou contato (newsletter ou contratação)
  | 'contact_click' // clicou em e-mail/LinkedIn/site do criador
  | 'source_fallback'; // fonte fora do ar, usou a cópia diária

/** Sem aceite, o gtag nem existe e o evento não sai do navegador. */
export function track(name: EventName, params: Record<string, string | number | boolean | undefined> = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  if (typeof window === 'undefined') return;
  janela().gtag?.('event', name, clean);
}

/** Para buscas digitadas: só manda quando a pessoa para de digitar (evita um evento por tecla). */
export function debounced<T extends unknown[]>(fn: (...a: T) => void, ms = 1200) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: T) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
