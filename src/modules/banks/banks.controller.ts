import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { BanksService } from './banks.service';
import { Bank } from './interfaces/bank.interface';

@Controller('banks')
export class BanksController {
  private readonly logger = new Logger(BanksController.name);
  
  constructor(private readonly banksService: BanksService) {}

  @Get()
  async getAllBanks(): Promise<Bank[]> {
    this.logger.log('Requisição recebida para listar todos os bancos');
    try {
      const banks = await this.banksService.getAllBanks();
      this.logger.log(`Retornando ${banks.length} bancos`);
      return banks;
    } catch (error) {
      this.logger.error(`Erro ao listar bancos: ${error.message}`);
      throw error;
    }
  }

  @Get('ispb/:ispb')
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