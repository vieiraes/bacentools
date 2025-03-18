export interface Bank {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export interface BankFilter {
  ispb?: string;
  code?: number;
  name?: string;
}