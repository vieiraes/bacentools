'use client';

import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, TableSortLabel, CircularProgress, Box,
  Typography, Link as MuiLink
} from '@mui/material';
import { Bank, BankFilters } from '@/types/banks';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';

interface BanksTableProps {
  banks: Bank[];
  loading: boolean;
  total: number;
  filters: BankFilters;
  onFilterChange: (filters: BankFilters) => void;
}

const BanksTable: React.FC<BanksTableProps> = ({
  banks,
  loading,
  total,
  filters,
  onFilterChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const handlePageChange = (_: unknown, newPage: number) => {
    onFilterChange({
      ...filters,
      skip: newPage * (filters.take || 10),
    });
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      take: parseInt(e.target.value, 10),
      skip: 0,
    });
  };

  const handleSort = (column: 'ispb' | 'name' | 'code') => {
    const isAsc = filters.orderBy === column && filters.orderDir === 'asc';
    onFilterChange({
      ...filters,
      orderBy: column,
      orderDir: isAsc ? 'desc' : 'asc',
    });
  };

  // Determina o número da página atual
  const page = Math.floor((filters.skip || 0) / (filters.take || 10));

  // Renderizar skeleton loader quando estiver carregando
  if (loading && banks.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Renderizar mensagem quando não houver resultados
  if (!loading && banks.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Nenhum banco encontrado com os filtros aplicados.</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={filters.orderBy === 'ispb'}
                  direction={filters.orderBy === 'ispb' ? filters.orderDir : 'asc'}
                  onClick={() => handleSort('ispb')}
                >
                  ISPB
                </TableSortLabel>
              </TableCell>
              {!isMobile && (
                <TableCell>
                  <TableSortLabel
                    active={filters.orderBy === 'code'}
                    direction={filters.orderBy === 'code' ? filters.orderDir : 'asc'}
                    onClick={() => handleSort('code')}
                  >
                    COMPE
                  </TableSortLabel>
                </TableCell>
              )}
              <TableCell>
                <TableSortLabel
                  active={filters.orderBy === 'name'}
                  direction={filters.orderBy === 'name' ? filters.orderDir : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Nome
                </TableSortLabel>
              </TableCell>
              {!isTablet && <TableCell>Nome Completo</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {banks.map((bank, index) => (
              <TableRow key={bank.ispb ? bank.ispb : `empty-${index}`} hover>
                <TableCell>
                  {bank.ispb || '-'}
                </TableCell>
                {!isMobile && (
                  <TableCell>{bank.code || '-'}</TableCell>
                )}
                <TableCell>{bank.name || '-'}</TableCell>
                {!isTablet && <TableCell>{bank.fullName || '-'}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={filters.take || 10}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage={isMobile ? "Linhas:" : "Linhas por página:"}
      />
    </>
  );
};

export default BanksTable;