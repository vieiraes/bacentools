import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { BanksService } from './banks.service';
import { Bank, BankFilter } from './interfaces/bank.interface';
import { PaginatedResult, PaginationOptions } from '../../common/interfaces/pagination.interface';

@Controller('banks')
export class BanksController {
  private readonly logger = new Logger(BanksController.name);
  
  constructor(private readonly banksService: BanksService) {}

  @Get()
  async getBanks(
    // Filtros
    @Query('ispb') ispb?: string,
    @Query('code') code?: string,
    @Query('name') name?: string,
    // Paginação
    @Query('skip') skip = 0,
    @Query('take') take = 50,
    // Ordenação
    @Query('orderBy') orderByField = 'name',
    @Query('orderDir') orderDir: 'asc' | 'desc' = 'asc',
  ): Promise<PaginatedResult<Bank>> {
    this.logger.log('Requisição recebida para listar bancos com filtros');
    
    // Preparar filtros
    const filter: BankFilter = {
      ispb,
      code: code ? parseInt(code, 10) : undefined,
      name
    };
    
    // Preparar opções de paginação
    const paginationOptions: PaginationOptions = {
      skip: Number(skip),
      take: Number(take),
      orderBy: {
        [orderByField]: orderDir
      }
    };
    
    try {
      return await this.banksService.findAll(filter, paginationOptions);
    } catch (error) {
      this.logger.error(`Erro ao listar bancos: ${error.message}`);
      throw error;
    }
  }

  @Get(':ispb')
  async getBankByIspb(@Param('ispb') ispb: string): Promise<Bank | { message: string }> {
    this.logger.log(`Buscando banco com ISPB: ${ispb}`);
    const bank = await this.banksService.getBankByIspb(ispb);
    if (!bank) {
      return { message: `Banco com ISPB ${ispb} não encontrado` };
    }
    return bank;
  }

  @Get('code/:code')
  async getBankByCode(@Param('code') code: string): Promise<Bank | { message: string }> {
    this.logger.log(`Buscando banco com código COMPE: ${code}`);
    const codeNumber = parseInt(code, 10);
    if (isNaN(codeNumber)) {
      return { message: 'Código COMPE inválido' };
    }

    const bank = await this.banksService.getBankByCode(codeNumber);
    if (!bank) {
      return { message: `Banco com código COMPE ${code} não encontrado` };
    }
    return bank;
  }

  @Get('search')
  async searchBanks(@Query('name') query: string): Promise<Bank[]> {
    this.logger.log(`Pesquisando bancos com termo: "${query}"`);
    if (!query || query.trim() === '') {
      return [];
    }
    return this.banksService.searchBanksByName(query);
  }
}