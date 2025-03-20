import { API_BASE_URL } from '@/config/api';

export interface ApiResponse<T> {
    data: T;
    meta?: {
        total: number;
        page: number;
        limit: number;
    };
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
    [key: string]: string | number | boolean | undefined;  // Tipo explícito para substituir any
}

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Ocorreu um erro na requisição');
    }
    return response.json();
};

export const api = {
    get: async <T>(url: string, params?: PaginationParams): Promise<ApiResponse<T>> => {
        const queryParams = params
            ? `?${new URLSearchParams(
                Object.entries(params)
                    .filter(([_, value]) => value !== undefined)
                    .map(([key, value]) => [key, String(value)])
            ).toString()}`
            : '';

        const fullUrl = `${API_BASE_URL}${url}${queryParams}`;
        console.log('Fetching URL:', fullUrl);

        try {
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit', // Alterado para 'omit' para evitar problemas de CORS
                cache: 'no-cache', // Forçar refetch, evitar caching
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },
};