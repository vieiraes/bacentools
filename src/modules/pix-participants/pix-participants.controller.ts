import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { PixParticipantsService } from './pix-participants.service';
import { PixParticipant } from './interfaces/pix-participant.interface';

@Controller('pix-participants')
export class PixParticipantsController {
  private readonly logger = new Logger(PixParticipantsController.name);
  
  constructor(private readonly pixParticipantsService: PixParticipantsService) {}

  @Get()
  async getAllParticipants(): Promise<PixParticipant[]> {
    this.logger.log('Requisição recebida para listar todos os participantes PIX');
    try {
      const participants = await this.pixParticipantsService.getAllParticipants();
      this.logger.log(`Retornando ${participants.length} participantes PIX`);
      return participants;
    } catch (error) {
      this.logger.error(`Erro ao listar participantes PIX: ${error.message}`);
      throw error;
    }
  }

  @Get('ispb/:ispb')
  async getParticipantByIspb(@Param('ispb') ispb: string): Promise<PixParticipant | { message: string }> {
    this.logger.log(`Buscando participante PIX com ISPB: ${ispb}`);
    const participant = await this.pixParticipantsService.getParticipantByIspb(ispb);
    if (!participant) {
      return { message: `Participante PIX com ISPB ${ispb} não encontrado` };
    }
    return participant;
  }

  @Get('search')
  async searchParticipants(@Query('name') query: string): Promise<PixParticipant[]> {
    this.logger.log(`Pesquisando participantes PIX com termo: "${query}"`);
    if (!query || query.trim() === '') {
      return [];
    }
    return this.pixParticipantsService.searchParticipantsByName(query);
  }

  @Get('tipo-participacao/:tipo')
  async getParticipantsByTipoParticipacao(@Param('tipo') tipo: string): Promise<PixParticipant[]> {
    this.logger.log(`Buscando participantes PIX com tipo de participação: ${tipo}`);
    return this.pixParticipantsService.getParticipantsByTipoParticipacao(tipo);
  }

  @Get('modalidade-participacao/:modalidade')
  async getParticipantsByModalidadeParticipacao(@Param('modalidade') modalidade: string): Promise<PixParticipant[]> {
    this.logger.log(`Buscando participantes PIX com modalidade de participação: ${modalidade}`);
    return this.pixParticipantsService.getParticipantsByModalidadeParticipacao(modalidade);
  }

  @Get('order-desc')
  async getParticipantsOrderedByStartDate(): Promise<PixParticipant[]> {
    this.logger.log('Requisição para listar participantes PIX ordenados por data de início (DESC)');
    return this.pixParticipantsService.getParticipantsOrderedByStartDate();
  }
}
