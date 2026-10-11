'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import { ToolIcon } from '@/components/ToolIcon';
import { CRIADOR, SITE, TOOLS } from '@/lib/tools';

/** Moldura do site: barra com as ferramentas (gaveta no celular), conteúdo e rodapé. */
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '/';
  const isActive = (p: string) => pathname === p || pathname === p.replace(/\/$/, '');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="a" href="#conteudo" sx={{ position: 'absolute', left: -9999, top: 8, zIndex: 2000, bgcolor: 'background.paper', p: 1, '&:focus': { left: 8 } }}>
        Pular para o conteúdo
      </Box>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton color="inherit" edge="start" aria-label="Abrir menu" onClick={() => setOpen(true)} sx={{ display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography component={Link} href="/" variant="h6" sx={{ fontWeight: 800, textDecoration: 'none', color: 'inherit', flexGrow: { xs: 1, md: 0 }, mr: 3 }}>
            {SITE.name}
          </Typography>
          <Box component="nav" aria-label="Ferramentas" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
            {TOOLS.map((t) => (
              <Button
                key={t.path}
                component={Link}
                href={t.path}
                color="inherit"
                aria-current={isActive(t.path) ? 'page' : undefined}
                startIcon={<ToolIcon icon={t.icon} fontSize="small" />}
                sx={{ borderBottom: '2px solid', borderColor: isActive(t.path) ? 'currentColor' : 'transparent', borderRadius: 0 }}
              >
                {t.short}
              </Button>
            ))}
          </Box>
          <Button component={Link} href="/sobre/" color="inherit" aria-current={isActive('/sobre/') ? 'page' : undefined} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
            Sobre
          </Button>
          <IconButton color="inherit" component="a" href={SITE.repo} aria-label="Código-fonte no GitHub">
            <GitHubIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)}>
        <Box component="nav" aria-label="Ferramentas" sx={{ width: 280 }} onClick={() => setOpen(false)}>
          <Typography variant="h6" component="p" sx={{ p: 2, fontWeight: 800 }}>{SITE.name}</Typography>
          <List>
            {TOOLS.map((t) => (
              <ListItemButton key={t.path} component={Link} href={t.path} selected={isActive(t.path)}>
                <ListItemIcon><ToolIcon icon={t.icon} /></ListItemIcon>
                <ListItemText primary={t.title} />
              </ListItemButton>
            ))}
            <ListItemButton component={Link} href="/sobre/" selected={isActive('/sobre/')}>
              <ListItemText primary="Sobre e contato" inset />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Container component="main" id="conteudo" maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, flex: 1 }}>
        {children}
      </Container>

      <Box component="footer" sx={{ py: 3, bgcolor: 'grey.100', borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            {SITE.name}: ferramentas gratuitas, sem cadastro. Dados públicos do Banco Central (direto ou pela BrasilAPI). Não é um
            serviço oficial do BCB. <a href={SITE.repo}>Código aberto no GitHub</a>. Criado por{' '}
            <Link href="/sobre/">{CRIADOR.nome}</Link>, {CRIADOR.papel}. <Link href="/privacidade/">Privacidade</Link>.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
