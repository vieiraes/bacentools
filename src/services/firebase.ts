// Cliente Firebase carregado só quando alguém usa um formulário ou o painel (o resto do site não paga o peso).
// A configuração web do Firebase é pública por natureza: quem protege os dados são as regras do Firestore (firestore.rules).
import type { FirebaseApp } from 'firebase/app';
import type { LeadDoc, LeadRow } from '@/lib/leads';
import { RECAPTCHA_SITE_KEY } from '@/lib/protecao';

const CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyBsG66cHRvzPvYrbKhgQrLiXF4odV9DOtE',
  authDomain: 'bacentools.firebaseapp.com',
  projectId: 'bacentools',
  appId: '1:793003569:web:e0032e8aafcaef163cb710',
};

// App Check com reCAPTCHA v3 (invisível): prova ao Firestore que o pedido vem do site, não de um robô.
// O Firestore só passa a exigir o token quando a proteção for ativada no console do Firebase.

let app: Promise<FirebaseApp> | undefined;
function getApp() {
  app ??= import('firebase/app').then(async ({ initializeApp, getApps }) => {
    const existente = getApps()[0];
    if (existente) return existente;
    const a = initializeApp(CONFIG);
    if (RECAPTCHA_SITE_KEY) {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
      // sem renovação automática: cada token consome a cota grátis do reCAPTCHA, e só quem envia formulário precisa de um
      initializeAppCheck(a, { provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: false });
    }
    return a;
  });
  return app;
}

/** Chamado quando a pessoa começa a preencher um formulário: o reCAPTCHA carrega antes do envio. */
export async function prepararProtecao() {
  await getApp();
}

async function db() {
  const [{ getFirestore }, a] = await Promise.all([import('firebase/firestore/lite'), getApp()]);
  return getFirestore(a);
}

export async function salvarLead(doc: LeadDoc) {
  const [{ addDoc, collection, serverTimestamp }, d] = await Promise.all([import('firebase/firestore/lite'), db()]);
  await addDoc(collection(d, 'leads'), { ...doc, criadoEm: serverTimestamp() });
}

export async function listarLeads(): Promise<LeadRow[]> {
  const [{ collection, getDocs, orderBy, query }, d] = await Promise.all([import('firebase/firestore/lite'), db()]);
  const snap = await getDocs(query(collection(d, 'leads'), orderBy('criadoEm', 'desc')));
  return snap.docs.map((s) => {
    const v = s.data();
    return { ...(v as Omit<LeadRow, 'id' | 'criadoEm'>), id: s.id, criadoEm: v.criadoEm?.toDate?.() };
  });
}

export async function excluirLead(id: string) {
  const [{ deleteDoc, doc }, d] = await Promise.all([import('firebase/firestore/lite'), db()]);
  await deleteDoc(doc(d, 'leads', id));
}

export interface Admin { email: string | null; nome: string | null }

async function auth() {
  const [m, a] = await Promise.all([import('firebase/auth'), getApp()]);
  return { m, auth: m.getAuth(a) };
}

/** Acompanha o login do painel. Devolve a função para parar de acompanhar. */
export async function observarLogin(cb: (u: Admin | null) => void) {
  const { m, auth: a } = await auth();
  return m.onAuthStateChanged(a, (u) => cb(u ? { email: u.email, nome: u.displayName } : null));
}

export async function entrarComGoogle() {
  const { m, auth: a } = await auth();
  await m.signInWithPopup(a, new m.GoogleAuthProvider());
}

export async function sair() {
  const { m, auth: a } = await auth();
  await m.signOut(a);
}
