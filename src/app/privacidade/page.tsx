import type { Metadata } from 'next';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export const metadata: Metadata = { title: 'Privacidade e cookies', description: 'Quais dados o BacenTools coleta, para quê e como recusar.' };

export default function Page() {
  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: '80ch' }}>
      <Typography variant="h1" sx={{ mb: 2 }}>Privacidade e cookies</Typography>
      <Typography component="h2" variant="h2" sx={{ mt: 3, mb: 1 }}>O que medimos</Typography>
      <Typography sx={{ mb: 2 }}>
        Usamos o <strong>Google Analytics 4</strong> para saber quais ferramentas são usadas, de que região vêm as visitas (cidade e
        estado aproximados, sem endereço IP completo), por quais páginas as pessoas navegam e por quanto tempo. Também registramos ações
        dentro das ferramentas, como buscas e cenários abertos, sempre sem dados pessoais.
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Até você aceitar, o Google Analytics funciona no <strong>modo de consentimento negado</strong>: não grava cookies nem identificadores
        no seu navegador. Não usamos publicidade nem vendemos dados.
      </Typography>
      <Typography component="h2" variant="h2" sx={{ mt: 3, mb: 1 }}>Dados que você nos envia</Typography>
      <Typography sx={{ mb: 2 }}>
        Se você se inscrever para receber novidades ou pedir contato, guardamos o que você informar (nome, e-mail, perfil, mensagem) no
        Firebase, em servidores no Brasil (região de São Paulo), só para responder e mandar as novidades que você pediu. Os dados não são
        compartilhados com ninguém. Você pode pedir a exclusão a qualquer momento pelo formulário da página{' '}
        <Link href="/sobre/#contato">Sobre</Link>, e ela é feita em até 15 dias.
      </Typography>
      <Typography component="h2" variant="h2" sx={{ mt: 3, mb: 1 }}>Mudar sua escolha</Typography>
      <Typography sx={{ mb: 2 }}>
        Para rever o aviso de cookies, apague os dados deste site no navegador; o aviso aparece de novo na próxima visita.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>Base legal: consentimento (LGPD, art. 7º, I) para o Analytics e para o contato.</Typography>
    </Paper>
  );
}
