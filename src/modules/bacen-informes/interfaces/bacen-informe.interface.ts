export enum InformeType {
    SPI = 'SPI',
    STR = 'STR'
}

export interface BacenInforme {
    id: number;
    titulo: string;
    dataReferencia: string;
    dataPublicacao: string;
    pdfUrl: string;
    pdfName: string;
    tamanho: number;
    tipo: InformeType;
}

export interface BacenInformeFilter {
    tipo?: InformeType | 'todos';
    ano?: number;
    dataInicio?: Date;
    dataFim?: Date;
}