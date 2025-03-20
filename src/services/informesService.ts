import { api } from './api';
import { Informe, InformesFilters } from '@/types/informes';
import { API_ENDPOINTS } from '@/config/api';

export const informesService = {
    getInformes: (filters?: InformesFilters) => {
        return api.get<Informe[]>(API_ENDPOINTS.BACEN_INFORMES, filters);
    },

    getInformeById: (id: number) => {
        return api.get<Informe>(`${API_ENDPOINTS.BACEN_INFORMES}/${id}`);
    }
};