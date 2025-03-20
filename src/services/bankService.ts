import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import { BankFilters } from '@/types/banks';
import { Bank } from '@/types/banks';

export const bankService = {
  getBanks: (filters?: BankFilters) => {
    return api.get<Bank[]>(API_ENDPOINTS.BANKS, filters);
  },
  
  getBankByIspb: (ispb: string) => {
    return api.get<Bank>(`${API_ENDPOINTS.BANKS}/${ispb}`);
  },
};