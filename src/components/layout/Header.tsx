'use client';

import { FC, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CodeIcon from '@mui/icons-material/Code';
import BankIcon from '@mui/icons-material/HomeWork';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';

const navigationItems = [
  { text: 'Bancos', icon: <BankIcon />, path: '/banks' },
  { text: 'Participantes PIX', icon: <PaymentIcon />, path: '/pix-participants' },
  { text: 'Relatórios SPI', icon: <DescriptionIcon />, path: '/spi-reports' },
  { text: 'Relatórios STR', icon: <DescriptionIcon />, path: '/str-reports' },
];

const Header: FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <AccountBalanceIcon fontSize="large" />
        <SwapHorizIcon fontSize="large" />
        <CodeIcon fontSize="large" />
      </Box>
      <Typography variant="h6" sx={{ my: 2 }}>
        BacenTools
      </Typography>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              href={item.path} 
              sx={{ textAlign: 'center' }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box sx={{ display: 'flex', mr: 1 }}>
              <AccountBalanceIcon fontSize={isMobile ? "medium" : "large"} />
              <SwapHorizIcon fontSize={isMobile ? "medium" : "large"} />
              <CodeIcon fontSize={isMobile ? "medium" : "large"} />
            </Box>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              component="div"
              sx={{ flexGrow: 1 }}
            >
              BacenTools
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {navigationItems.map((item) => (
                <Button 
                  key={item.text}
                  component={Link}
                  href={item.path}
                  color="inherit"
                  sx={{ ml: 1 }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;