// Crie este arquivo em: /home/bvieira/projetos/gh/bacentools-front/src/types/informes.ts
export interface Informe {
    id: number;
    titulo: string;
    dataReferencia: string;
    dataPublicacao: string;
    pdfUrl: string;
    pdfName: string;
    tamanho: number;
    tipo: 'SPI' | 'STR';
}

export interface InformesFilters {
    skip?: number;
    take?: number;
    tipo?: 'SPI' | 'STR' | '';
    ano?: number;
    orderBy?: string;
    titulo?: string;
    [key: string]: string | number | undefined; // Assinatura de índice necessária para compatibilidade
}