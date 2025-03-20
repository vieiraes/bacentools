'use client';

import React from 'react';
import { Box, TextField, Button, Grid } from '@mui/material';
import { BankFilters as BankFiltersType } from '@/types/banks';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface BankFiltersProps {
    filters: BankFiltersType;
    onFilterChange: (filters: BankFiltersType) => void;
}

const BankFilters: React.FC<BankFiltersProps> = ({ filters, onFilterChange }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [localFilters, setLocalFilters] = React.useState<BankFiltersType>(filters);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange(localFilters);
    };

    const handleClear = () => {
        const clearedFilters = {
            skip: 0,
            take: filters.take,
            orderBy: filters.orderBy,
            orderDir: filters.orderDir,
        };
        setLocalFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="ISPB"
                        name="ispb"
                        value={localFilters.ispb || ''}
                        onChange={handleInputChange}
                        size={isMobile ? "small" : "medium"}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="Código COMPE"
                        name="code"
                        value={localFilters.code || ''}
                        onChange={handleInputChange}
                        size={isMobile ? "small" : "medium"}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="Nome"
                        name="name"
                        value={localFilters.name || ''}
                        onChange={handleInputChange}
                        size={isMobile ? "small" : "medium"}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: isMobile ? 'center' : 'flex-end' }}>
                        <Button variant="outlined" onClick={handleClear}>
                            Limpar
                        </Button>
                        <Button variant="contained" type="submit">
                            Filtrar
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BankFilters;