/**
 * Chave do site do reCAPTCHA v3, usada pelo Firebase App Check nos formulários (pública por natureza).
 * Vazia = App Check desligado: os formulários funcionam e o aviso do reCAPTCHA não aparece.
 */
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '6LceW-wtAAAAAF3pA69EosywCfstu8_vqktcYIHM';
