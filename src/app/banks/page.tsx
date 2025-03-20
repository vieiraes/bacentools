'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import BankFilters from '@/components/BankFilter';
import BanksTable from '@/components/BanksTable';
import { BankFilters as BankFiltersType, Bank } from '@/types/banks';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { bankService } from '@/services/bankService';

// Componente para lidar com parâmetros de URL apenas no cliente
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  return <>{children}</>;
}

export default function BanksPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estado para os filtros
  const [filters, setFilters] = useState<BankFiltersType>({
    skip: 0,
    take: 10,
    orderBy: 'name',
    orderDir: 'asc',
  });
  
  // Estado para o ispb selecionado para detalhes
  const [selectedIspb, setSelectedIspb] = useState<string | null>(null);
  
  // Consulta os dados com React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['banks', filters],
    queryFn: () => bankService.getBanks(filters),
  });
  
  // Consulta detalhes do banco selecionado
  const { 
    data: bankDetails, 
    isLoading: isLoadingDetails, 
    error: detailsError 
  } = useQuery({
    queryKey: ['bank', selectedIspb],
    queryFn: () => selectedIspb ? bankService.getBankByIspb(selectedIspb) : Promise.resolve(null),
    enabled: !!selectedIspb,
  });
  
  // Verificar parâmetro ispb na URL (apenas no cliente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ispbParam = params.get('ispb');
      if (ispbParam) {
        setSelectedIspb(ispbParam);
      }
    }
  }, []);
  
  // Manipulador de alteração de filtros
  const handleFilterChange = (newFilters: BankFiltersType) => {
    setFilters(newFilters);
  };
  
  // Função para abrir o modal de detalhes
  const handleOpenDetails = (ispb: string) => {
    setSelectedIspb(ispb);
    // Atualiza a URL com o parâmetro ispb sem recarregar a página
    if (typeof window !== 'undefined') {
      const newUrl = `/banks?ispb=${ispb}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };
  
  // Função para fechar o modal de detalhes
  const handleCloseDetails = () => {
    setSelectedIspb(null);
    // Remove o parâmetro ispb da URL
    if (typeof window !== 'undefined') {
      const newUrl = `/banks`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ mb: isMobile ? 2 : 4 }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          gutterBottom
        >
          Bancos
        </Typography>
        <Typography 
          variant={isMobile ? "body2" : "subtitle1"}
        >
          Consulte informações sobre bancos do sistema financeiro brasileiro
        </Typography>
      </Box>

      <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
        <BankFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
        />
      </Paper>

      {error ? (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          Erro ao carregar os dados: {(error as Error).message}
        </Alert>
      ) : (
        <Paper sx={{ mt: isMobile ? 2 : 3 }}>
          <BanksTable 
            banks={data?.data || []}
            loading={isLoading}
            total={data?.meta?.total || 0}
            filters={filters}
            onFilterChange={handleFilterChange}
            onBankSelect={handleOpenDetails}
          />
        </Paper>
      )}
      
      {/* Modal de Detalhes do Banco */}
      <Dialog 
        open={!!selectedIspb} 
        onClose={handleCloseDetails}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {isLoadingDetails ? (
            <Skeleton width="60%" />
          ) : (
            `Dados do Banco: ${bankDetails?.data?.name || ''}`
          )}
        </DialogTitle>
        <DialogContent>
          {detailsError ? (
            <Alert severity="error">
              Erro ao carregar os dados: {(detailsError as Error).message}
            </Alert>
          ) : isLoadingDetails ? (
            <Box sx={{ p: 2 }}>
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </Box>
          ) : bankDetails?.data ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Informações Básicas" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          ISPB
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {bankDetails.data.ispb}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Código COMPE
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {bankDetails.data.code || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Nome
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {bankDetails.data.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Nome Completo
                        </Typography>
                        <Typography variant="body1">
                          {bankDetails.data.fullName}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              Banco não encontrado
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}