'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { informesService } from '@/services/informesService';
import MainLayout from '@/components/layout/MainLayout';
import { InformesFilters } from '@/types/informes';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from '@mui/material/Link';

export default function InformesPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // Gerar anos de 2025 até 2020
    const anos = Array.from({ length: 6 }, (_, i) => 2025 - i);

    // Estado para os filtros
    const [filters, setFilters] = useState<InformesFilters>({
        skip: 0,
        take: 10,
        tipo: '',
        ano: 2025,
        orderBy: 'desc',
    });

    // Consulta os dados com React Query
    const { data, isLoading, error } = useQuery({
        queryKey: ['informes', filters],
        queryFn: () => informesService.getInformes(filters),
    });

    // Manipulador de alteração de filtros
    const handleFilterChange = (name: string, value: string | number) => {
        if (name === 'tipo' || name === 'ano') {
            setFilters({
                ...filters,
                [name]: value,
                skip: 0, // Reset pagination when changing filters
            });
        }
    };

    // Manipulador de paginação
    const handleChangePage = (event: unknown, newPage: number) => {
        setFilters({
            ...filters,
            skip: newPage * filters.take!,
        });
    };

    // Manipulador de tamanho de página
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            take: parseInt(event.target.value, 10),
            skip: 0,
        });
    };

    // Função para formatar tamanho de arquivo
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    // Função para formatar data
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <MainLayout>
            <Box sx={{ mb: isMobile ? 2 : 4 }}>
                <Typography
                    variant={isMobile ? "h5" : "h4"}
                    component="h1"
                    gutterBottom
                >
                    Informes BACEN
                </Typography>
                <Typography
                    variant={isMobile ? "body2" : "subtitle1"}
                >
                    Consulte os informes do Sistema de Pagamentos Brasileiro
                </Typography>
            </Box>

            <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={filters.tipo}
                                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                                label="Tipo"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="SPI">SPI</MenuItem>
                                <MenuItem value="STR">STR</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Ano</InputLabel>
                            <Select
                                value={filters.ano}
                                onChange={(e) => handleFilterChange('ano', e.target.value)}
                                label="Ano"
                            >
                                {anos.map(ano => (
                                    <MenuItem key={ano} value={ano}>{ano}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {error ? (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    Erro ao carregar os dados: {(error as Error).message}
                </Alert>
            ) : (
                <Paper sx={{ mt: isMobile ? 2 : 3 }}>
                    <TableContainer component={Paper}>
                        <Table size={isMobile ? "small" : "medium"}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Título</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    {!isMobile && <TableCell>Data</TableCell>}
                                    {!isTablet && <TableCell>Tamanho</TableCell>}
                                    <TableCell align="center">Download</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={isMobile ? 3 : isTablet ? 4 : 5} align="center">
                                            Carregando...
                                        </TableCell>
                                    </TableRow>
                                ) : data?.data && data.data.length > 0 ? (
                                    data.data.map((informe) => (
                                        <TableRow key={informe.id} hover>
                                            <TableCell>{informe.titulo}</TableCell>
                                            <TableCell>{informe.tipo}</TableCell>
                                            {!isMobile && <TableCell>{formatDate(informe.dataReferencia)}</TableCell>}
                                            {!isTablet && <TableCell>{formatFileSize(informe.tamanho)}</TableCell>}
                                            <TableCell align="center">
                                                <Link
                                                    href={informe.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    underline="none"
                                                >
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<FileDownloadIcon />}
                                                        color="primary"
                                                    >
                                                        {isMobile ? '' : 'PDF'}
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={isMobile ? 3 : isTablet ? 4 : 5} align="center">
                                            Nenhum informe encontrado
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={data?.meta?.total || 0}
                        page={filters.skip! / filters.take!}
                        rowsPerPage={filters.take!}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Itens por página:"
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                        }
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </Paper>
            )}
        </MainLayout>
    );
}