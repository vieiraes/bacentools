'use client';

import MainLayout from '@/components/layout/MainLayout';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import BankIcon from '@mui/icons-material/HomeWork';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <MainLayout>
      <Box sx={{ textAlign: 'center', mb: isMobile ? 2 : 4 }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h1"
          gutterBottom
        >
          Bem-vindo ao BacenTools
        </Typography>
        <Typography
          variant={isMobile ? "body2" : "subtitle1"}
        >
          Ferramentas para consulta de informações do sistema financeiro brasileiro
        </Typography>
      </Box>

      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={4}>
          <Card raised>
            <CardHeader
              avatar={<BankIcon color="primary" />}
              title="Bancos"
            />
            <CardContent>
              <Typography variant="body2">
                Consulte informações sobre bancos, incluindo códigos ISPB e COMPE.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={Link}
                  href="/banks"
                  variant="outlined"
                  size="small"
                >
                  Ver bancos
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card raised>
            <CardHeader
              avatar={<PaymentIcon color="primary" />}
              title="Participantes PIX"
            />
            <CardContent>
              <Typography variant="body2">
                Consulte todos os participantes do PIX no sistema financeiro brasileiro.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={Link}
                  href="/pix-participants"
                  variant="outlined"
                  size="small"
                  disabled
                >
                  Em breve
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card raised>
            <CardHeader
              avatar={<DescriptionIcon color="primary" />}
              title="Relatórios"
            />
            <CardContent>
              <Typography variant="body2">
                Acesse relatórios SPI e STR com informações detalhadas do sistema financeiro.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={Link}
                  href="/informes"
                  variant="outlined"
                  size="small"
                >
                  Ver relatórios
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
}
