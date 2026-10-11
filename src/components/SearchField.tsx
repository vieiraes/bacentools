'use client';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { debounced, track } from '@/lib/analytics';

const trackSearch = debounced((term: string, area: string) => term.trim().length >= 2 && track('search', { search_term: term.trim().slice(0, 60), area }));

export function SearchField({ value, onChange, label, placeholder, area }: { value: string; onChange: (v: string) => void; label: string; placeholder: string; area: string }) {
  return (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => { onChange(e.target.value); trackSearch(e.target.value, area); }}
      slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon aria-hidden /></InputAdornment> }, htmlInput: { 'data-testid': 'search' } }}
    />
  );
}
