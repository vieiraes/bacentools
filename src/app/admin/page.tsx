import type { Metadata } from 'next';
import { AdminLeads } from './AdminLeads';

// Painel do administrador: fora do sitemap e dos buscadores. Quem protege os dados são as regras do Firestore.
export const metadata: Metadata = { title: 'Painel', robots: { index: false, follow: false } };

export default function Page() {
  return <AdminLeads />;
}
