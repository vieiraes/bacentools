'use client';

import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Header from './Header';
import Footer from './Footer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}
        >
            <Header />
            <Container
                component="main"
                maxWidth="lg"
                sx={{
                    mt: isMobile ? 2 : 4,
                    mb: isMobile ? 2 : 4,
                    px: isMobile ? 1 : 3,
                    flex: 1
                }}
            >
                {children}
            </Container>
            <Footer />
        </Box>
    );
};

export default MainLayout;