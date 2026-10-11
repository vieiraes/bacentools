// Google Analytics 4 com Consent Mode v2 (LGPD): até o visitante aceitar, o GA recebe só sinais sem cookies.
// Toda medição do site passa por track(): um lugar só para nomear eventos e parâmetros.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-69FZL5N4D5';
const CONSENT_KEY = 'bt_consent_v1';

/** Roda no <head>, antes de tudo: consentimento "negado" por padrão (ou o que a pessoa já escolheu). */
export const CONSENT_INIT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
var saved = null; try { saved = localStorage.getItem('${'bt_consent_v1'}'); } catch (e) {}
gtag('consent', 'default', {
  analytics_storage: saved === 'granted' ? 'granted' : 'denied',
  ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  wait_for_update: 500
});
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA_ID ?? 'G-69FZL5N4D5'}', { anonymize_ip: true });
`;

export type Consent = 'granted' | 'denied';

type Gtag = (...args: unknown[]) => void;
const gtag = (): Gtag | undefined => (typeof window !== 'undefined' ? (window as unknown as { gtag?: Gtag }).gtag : undefined);

export function storedConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent) {
  try { window.localStorage.setItem(CONSENT_KEY, value); } catch { /* navegação privada: vale só para esta visita */ }
  gtag()?.('consent', 'update', { analytics_storage: value, ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  track('consent_choice', { choice: value });
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

export function track(name: EventName, params: Record<string, string | number | boolean | undefined> = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  gtag()?.('event', name, clean);
}

/** Para buscas digitadas: só manda quando a pessoa para de digitar (evita um evento por tecla). */
export function debounced<T extends unknown[]>(fn: (...a: T) => void, ms = 1200) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: T) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
