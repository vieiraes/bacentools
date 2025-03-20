export interface Bank {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export interface BankFilters {
  ispb?: string;
  code?: string;
  name?: string;
  skip?: number;
  take?: number;
  orderBy?: 'ispb' | 'name' | 'code';
  orderDir?: 'asc' | 'desc';
}