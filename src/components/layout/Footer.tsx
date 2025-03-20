'use client';

import { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const Footer: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      component="footer"
      sx={{
        py: isMobile ? 2 : 3,
        px: isMobile ? 1 : 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
      }}
    >
      <Container maxWidth="lg">
        <Typography 
          variant={isMobile ? "caption" : "body2"} 
          color="text.secondary" 
          align="center"
        >
          © {new Date().getFullYear()} BacenTools - Ferramentas para PO.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;