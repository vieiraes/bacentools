'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bankService } from '@/services/bankService';
import MainLayout from '@/components/layout/MainLayout';
import BankFilters from '@/components/BankFilter';
import BanksTable from '@/components/BanksTable';
import { BankFilters as BankFiltersType } from '@/types/banks';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

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

    // Consulta os dados com React Query
    const { data, isLoading, error } = useQuery({
        queryKey: ['banks', filters],
        queryFn: () => bankService.getBanks(filters),
    });

    // Manipulador de alteração de filtros
    const handleFilterChange = (newFilters: BankFiltersType) => {
        setFilters(newFilters);
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
                    />
                </Paper>
            )}
        </MainLayout>
    );
}