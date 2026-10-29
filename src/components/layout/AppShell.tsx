'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
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
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HandymanIcon from '@mui/icons-material/Handyman';
import { BotaoPreferenciasCookies } from '@/components/Analytics';
import { ToolIcon } from '@/components/ToolIcon';
import { CRIADOR, SITE, TOOLS, secaoDe, type Tool } from '@/lib/tools';
import SyncAltIcon from '@mui/icons-material/SyncAlt';

/** Menu suspenso da barra do topo ("Ferramentas" do Pix, "SPB e TED"). */
function NavDropdown({ id, label, icon, items, isActive }: { id: string; label: string; icon: ReactNode; items: Tool[]; isActive: (p: string) => boolean }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        id={`menu-${id}`}
        color="inherit"
        aria-haspopup="true"
        aria-expanded={el ? 'true' : undefined}
        aria-controls={el ? `lista-${id}` : undefined}
        onClick={(e: MouseEvent<HTMLElement>) => setEl(e.currentTarget)}
        startIcon={icon}
        endIcon={<ExpandMoreIcon />}
        sx={{ whiteSpace: 'nowrap', px: 0.75, '& .MuiButton-startIcon': { mr: 0.5 }, borderBottom: '2px solid', borderColor: items.some((t) => isActive(t.path)) ? 'currentColor' : 'transparent', borderRadius: 0 }}
      >
        {label}
      </Button>
      <Menu id={`lista-${id}`} anchorEl={el} open={!!el} onClose={() => setEl(null)} slotProps={{ list: { 'aria-labelledby': `menu-${id}` } }}>
        {items.map((t) => (
          <MenuItem key={t.path} component={Link} href={t.path} selected={isActive(t.path)} onClick={() => setEl(null)}>
            <ListItemIcon><ToolIcon icon={t.icon} fontSize="small" /></ListItemIcon>
            <ListItemText primary={t.menu} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** Moldura do site: barra com as ferramentas (gaveta no celular), conteúdo e rodapé. */
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pix = TOOLS.filter((t) => secaoDe(t) === 'pix');
  const principais = pix.filter((t) => !t.menu);
  const avulsas = pix.filter((t) => t.menu);
  const spb = TOOLS.filter((t) => secaoDe(t) === 'spb');
  const pathname = usePathname() ?? '/';
  const isActive = (p: string) => pathname === p || pathname === p.replace(/\/$/, '');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="a" href="#conteudo" sx={{ position: 'absolute', left: -9999, top: 8, zIndex: 2000, bgcolor: 'background.paper', p: 1, '&:focus': { left: 8 } }}>
        Pular para o conteúdo
      </Box>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton color="inherit" edge="start" aria-label="Abrir menu" onClick={() => setOpen(true)} sx={{ display: { lg: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography component={Link} href="/" variant="h6" sx={{ fontWeight: 800, textDecoration: 'none', color: 'inherit', flexGrow: { xs: 1, lg: 0 }, mr: 1.5 }}>
            {SITE.name}
          </Typography>
          <Box component="nav" aria-label="Ferramentas" sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.25, flexGrow: 1 }}>
            {principais.map((t) => (
              <Button
                key={t.path}
                component={Link}
                href={t.path}
                color="inherit"
                aria-current={isActive(t.path) ? 'page' : undefined}
                startIcon={<ToolIcon icon={t.icon} fontSize="small" />}
                sx={{ whiteSpace: 'nowrap', px: 0.75, '& .MuiButton-startIcon': { mr: 0.5 }, borderBottom: '2px solid', borderColor: isActive(t.path) ? 'currentColor' : 'transparent', borderRadius: 0 }}
              >
                {t.short}
              </Button>
            ))}
            <NavDropdown id="ferramentas" label="Ferramentas" icon={<HandymanIcon fontSize="small" />} items={avulsas} isActive={isActive} />
            <NavDropdown id="spb" label="SPB e TED" icon={<SyncAltIcon fontSize="small" />} items={spb} isActive={isActive} />
          </Box>
          <Button component={Link} href="/sobre/" color="inherit" aria-current={isActive('/sobre/') ? 'page' : undefined} sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>
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
            {principais.map((t) => (
              <ListItemButton key={t.path} component={Link} href={t.path} selected={isActive(t.path)}>
                <ListItemIcon><ToolIcon icon={t.icon} /></ListItemIcon>
                <ListItemText primary={t.title} />
              </ListItemButton>
            ))}
            <ListSubheader component="p" disableSticky>Ferramentas</ListSubheader>
            {avulsas.map((t) => (
              <ListItemButton key={t.path} component={Link} href={t.path} selected={isActive(t.path)}>
                <ListItemIcon><ToolIcon icon={t.icon} /></ListItemIcon>
                <ListItemText primary={t.menu} />
              </ListItemButton>
            ))}
            <ListSubheader component="p" disableSticky>SPB e TED</ListSubheader>
            {spb.map((t) => (
              <ListItemButton key={t.path} component={Link} href={t.path} selected={isActive(t.path)}>
                <ListItemIcon><ToolIcon icon={t.icon} /></ListItemIcon>
                <ListItemText primary={t.menu} />
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
            <Link href="/sobre/">{CRIADOR.nome}</Link>, {CRIADOR.papel}. <Link href="/privacidade/">Privacidade</Link> · <BotaoPreferenciasCookies />.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
