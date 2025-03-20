import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { PixParticipantsService } from './pix-participants.service';
import { PixParticipant, PixParticipantFilter } from './interfaces/pix-participant.interface';
import { PaginatedResult, PaginationOptions } from '../../common/interfaces/pagination.interface';

@Controller('pix-participants')
export class PixParticipantsController {
  private readonly logger = new Logger(PixParticipantsController.name);
  
  constructor(private readonly pixParticipantsService: PixParticipantsService) {}

  @Get()
  async getParticipants(
    // Filtros
    @Query('ispb') ispb?: string,
    @Query('nome') nome?: string,
    @Query('tipoParticipacao') tipoParticipacao?: string,
    @Query('modalidadeParticipacao') modalidadeParticipacao?: string, 
    // Paginação
    @Query('skip') skip = 0,
    @Query('take') take = 50,
    // Ordenação - Apenas direção, sempre por nome
    @Query('orderDir') orderDir: 'asc' | 'desc' = 'asc',
  ): Promise<PaginatedResult<PixParticipant>> {
    this.logger.log('Requisição recebida para listar participantes PIX com filtros');
    
    // Preparar filtros
    const filter: PixParticipantFilter = {
      ispb,
      nome,
      tipoParticipacao,
      modalidadeParticipacao
    };
    
    // Preparar opções de paginação - Sempre ordenar por nome
    const paginationOptions: PaginationOptions = {
      skip: Number(skip),
      take: Number(take),
      orderBy: {
        nome: orderDir  // Fixado para ordenar por nome
      }
    };
    
    try {
      return await this.pixParticipantsService.findAll(filter, paginationOptions);
    } catch (error) {
      this.logger.error(`Erro ao listar participantes PIX: ${error.message}`);
      throw error;
    }
  }

  @Get(':ispb')
  async getParticipantByIspb(@Param('ispb') ispb: string): Promise<PixParticipant | { message: string }> {
    this.logger.log(`Buscando participante PIX com ISPB: ${ispb}`);
    const participant = await this.pixParticipantsService.getParticipantByIspb(ispb);
    
    if (!participant) {
      return { message: `Participante PIX com ISPB ${ispb} não encontrado` };
    }
    
    return participant;
  }
}
