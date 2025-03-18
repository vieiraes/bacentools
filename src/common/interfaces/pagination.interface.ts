export interface PaginationOptions {
    skip?: number;
    take?: number;
    orderBy?: {
        [key: string]: 'asc' | 'desc';
    };
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        skip: number;
        take: number;
    };
}