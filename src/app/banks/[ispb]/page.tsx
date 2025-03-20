'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bankService } from '@/services/bankService';
import MainLayout from '@/components/layout/MainLayout';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function BankDetailsPage() {
    const { ispb } = useParams<{ ispb: string }>();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { data: bank, isLoading, error } = useQuery({
        queryKey: ['bank', ispb],
        queryFn: () => bankService.getBankByIspb(ispb as string),
        enabled: !!ispb,
    });

    return (
        <MainLayout>
            <Box sx={{ mb: 3 }}>
                <Button
                    component={Link}
                    href="/banks"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2 }}
                >
                    Voltar para lista
                </Button>

                <Typography
                    variant={isMobile ? "h5" : "h4"}
                    component="h1"
                    gutterBottom
                >
                    {isLoading ? (
                        <Skeleton width="60%" />
                    ) : (
                        `Dados do Banco: ${bank?.data?.name || ''}`
                    )}
                </Typography>
            </Box>

            {error ? (
                <Alert severity="error">
                    Erro ao carregar os dados: {(error as Error).message}
                </Alert>
            ) : (
                <Paper sx={{ p: isMobile ? 2 : 3 }}>
                    {isLoading ? (
                        <Box sx={{ p: 2 }}>
                            <Skeleton height={60} />
                            <Skeleton height={60} />
                            <Skeleton height={60} />
                        </Box>
                    ) : bank?.data ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardHeader title="Informações Básicas" />
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            ISPB
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {bank.data.ispb}
                                        </Typography>

                                        <Typography variant="subtitle2" color="text.secondary">
                                            Código COMPE
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {bank.data.code || 'N/A'}
                                        </Typography>

                                        <Typography variant="subtitle2" color="text.secondary">
                                            Nome
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {bank.data.name}
                                        </Typography>

                                        <Typography variant="subtitle2" color="text.secondary">
                                            Nome Completo
                                        </Typography>
                                        <Typography variant="body1">
                                            {bank.data.fullName}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Alert severity="info">
                            Banco não encontrado
                        </Alert>
                    )}
                </Paper>
            )}
        </MainLayout>
    );
}