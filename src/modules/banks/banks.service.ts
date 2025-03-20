import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Bank, BankFilter } from './interfaces/bank.interface';
import { PaginatedResult, PaginationOptions } from '../../common/interfaces/pagination.interface';
import { lastValueFrom } from 'rxjs';
import axios from 'axios';

@Injectable()
export class BanksService {
  private banks: Bank[] = [];
  private lastFetch: Date | null = null;
  private readonly CACHE_TTL = 3600000; // 1 hora em milissegundos
  private readonly logger = new Logger(BanksService.name);

  constructor(private readonly httpService: HttpService) { }

  async getAllBanks(): Promise<Bank[]> {
    if (this.shouldFetchBanks()) {
      await this.fetchBanksFromAPI();
    }
    return this.banks;
  }

  async findOne(id: number): Promise<Bank | null> {
    await this.ensureBanksLoaded();
    return this.banks.find(bank => bank.code === id) || null;
  }

  async findAll(
    filter: BankFilter = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Bank>> {
    await this.ensureBanksLoaded();

    // Aplicar filtros
    let result = this.banks.filter(bank => {
      // Filtro por ISPB
      if (filter.ispb && bank.ispb &&
        !bank.ispb.toLowerCase().includes(filter.ispb.toLowerCase())) {
        return false;
      }

      // Filtro por código
      if (filter.code !== undefined && bank.code !== filter.code) {
        return false;
      }

      // Filtro por nome
      if (filter.name && (
        !bank.name || !bank.fullName ||
        !(bank.name.toLowerCase().includes(filter.name.toLowerCase()) ||
          bank.fullName.toLowerCase().includes(filter.name.toLowerCase()))
      )) {
        return false;
      }

      return true;
    });

    // Total antes de aplicar paginação
    const total = result.length;

    // Aplicar ordenação
    const orderKey = Object.keys(options.orderBy || {})[0] || 'name';
    const orderDirection = options.orderBy?.[orderKey] || 'asc';

    result = result.sort((a, b) => {
      const valA = a[orderKey] !== undefined && a[orderKey] !== null ? a[orderKey] : '';
      const valB = b[orderKey] !== undefined && b[orderKey] !== null ? b[orderKey] : '';

      if (orderDirection === 'desc') {
        return String(valA) > String(valB) ? -1 : 1;
      } else {
        return String(valA) < String(valB) ? -1 : 1;
      }
    });

    // Aplicar paginação
    const skip = options.skip || 0;
    const take = options.take || 50;

    result = result.slice(skip, skip + take);

    // Retornar resultado paginado
    return {
      data: result,
      meta: {
        total,
        skip,
        take
      }
    };
  }

  async getBankByIspb(ispb: string): Promise<Bank | null> {
    await this.ensureBanksLoaded();
    return this.banks.find(bank => bank.ispb === ispb) || null;
  }

  async getBankByCode(code: number): Promise<Bank | null> {
    await this.ensureBanksLoaded();
    return this.banks.find(bank => bank.code === code) || null;
  }

  async searchBanksByName(query: string): Promise<Bank[]> {
    await this.ensureBanksLoaded();
    const lowerQuery = query.toLowerCase();
    return this.banks.filter(bank =>
      (bank.name && bank.name.toLowerCase().includes(lowerQuery)) ||
      (bank.fullName && bank.fullName.toLowerCase().includes(lowerQuery))
    );
  }

  private async ensureBanksLoaded(): Promise<void> {
    if (this.shouldFetchBanks()) {
      await this.fetchBanksFromAPI();
    }
  }

  private shouldFetchBanks(): boolean {
    if (!this.lastFetch || this.banks.length === 0) {
      return true;
    }

    const now = new Date();
    return now.getTime() - this.lastFetch.getTime() > this.CACHE_TTL;
  }

  private async fetchBanksFromAPI(): Promise<void> {
    this.logger.log('Buscando lista de bancos da API Brasil');
    try {
      // Utilizando axios diretamente para simplicidade
      const response = await axios.get('https://brasilapi.com.br/api/banks/v1');
      this.banks = response.data;
      this.lastFetch = new Date();
      this.logger.log(`${this.banks.length} bancos carregados com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao buscar bancos: ${error.message}`);
      if (this.banks.length === 0) {
        throw error;
      }
    }
  }
}