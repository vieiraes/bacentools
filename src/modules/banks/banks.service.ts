import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Bank } from './interfaces/bank.interface';
import axios from 'axios';

@Injectable()
export class BanksService {
  private banks: Bank[] = [];
  private lastFetch: Date | null = null;
  private readonly CACHE_TTL = 3600000; // 1 hora em milissegundos

  // Remova o constructor que injeta HttpService, pois usaremos axios diretamente
  constructor() {}

  async getAllBanks(): Promise<Bank[]> {
    if (this.shouldFetchBanks()) {
      await this.fetchBanksFromAPI();
    }
    console.log(`Retornando ${this.banks.length} bancos`);
    return this.banks;
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
      bank.fullName?.toLowerCase().includes(lowerQuery) ||
      bank.name?.toLowerCase().includes(lowerQuery)
    );
  }

  private async ensureBanksLoaded(): Promise<void> {
    if (this.shouldFetchBanks()) {
      await this.fetchBanksFromAPI();
    }
  }

  private shouldFetchBanks(): boolean {
    // Atualizar a lista de bancos se estiver vazia ou se o cache expirou
    return (
      this.banks.length === 0 ||
      !this.lastFetch ||
      (Date.now() - this.lastFetch.getTime() > this.CACHE_TTL)
    );
  }

  private async fetchBanksFromAPI(): Promise<void> {
    try {
      console.log('Buscando dados dos bancos via API externa...');
      
      // Usando axios diretamente para simplificar o debug
      const response = await axios.get('https://brasilapi.com.br/api/banks/v1');
      
      if (response.data && Array.isArray(response.data)) {
        this.banks = response.data;
        this.lastFetch = new Date();
        console.log(`Dados dos bancos atualizados com sucesso: ${this.banks.length} bancos carregados`);
      } else {
        console.error('Formato de resposta inválido da API:', response.data);
        throw new HttpException(
          'Formato de resposta inválido da API de bancos',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('Erro ao buscar dados dos bancos:', error);
      throw new HttpException(
        'Erro ao buscar dados dos bancos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}