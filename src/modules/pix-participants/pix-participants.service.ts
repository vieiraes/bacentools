import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PixParticipant, PixParticipantFilter } from './interfaces/pix-participant.interface';
import { PaginatedResult, PaginationOptions } from '../../common/interfaces/pagination.interface';
import { lastValueFrom } from 'rxjs';
import axios from 'axios';

@Injectable()
export class PixParticipantsService {
  private participants: PixParticipant[] = [];
  private lastFetch: Date | null = null;
  private readonly CACHE_TTL = 3600000; // 1 hora em milissegundos
  private readonly logger = new Logger(PixParticipantsService.name);

  constructor(private readonly httpService: HttpService) {}

  async findAll(
    filter: PixParticipantFilter = {}, 
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<PixParticipant>> {
    await this.ensureParticipantsLoaded();

    // Aplicar filtros
    let result = this.participants.filter(participant => {
      // Filtro por ISPB
      if (filter.ispb && participant.ispb && 
          !participant.ispb.toLowerCase().includes(filter.ispb.toLowerCase())) {
        return false;
      }

      // Filtro por nome
      if (filter.nome && participant.nome && 
          !participant.nome.toLowerCase().includes(filter.nome.toLowerCase())) {
        return false;
      }

      // Filtro por tipo de participação
      if (filter.tipoParticipacao && participant.tipoParticipacao && 
          !participant.tipoParticipacao.toLowerCase().includes(filter.tipoParticipacao.toLowerCase())) {
        return false;
      }

      // Filtro por modalidade de participação
      if (filter.modalidadeParticipacao && participant.modalidadeParticipacao && 
          !participant.modalidadeParticipacao.toLowerCase().includes(filter.modalidadeParticipacao.toLowerCase())) {
        return false;
      }

      // Removido os filtros por data (dataInicioMin e dataInicioMax)

      return true;
    });

    // Total antes de aplicar paginação
    const total = result.length;

    // Aplicar ordenação
    const orderDirection = options.orderBy?.nome || 'asc';

    result = result.sort((a, b) => {
      const valA = a.nome !== undefined && a.nome !== null ? String(a.nome).toLowerCase() : '';
      const valB = b.nome !== undefined && b.nome !== null ? String(b.nome).toLowerCase() : '';

      if (orderDirection === 'desc') {
        return valA > valB ? -1 : 1;
      } else {
        return valA < valB ? -1 : 1;
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

  async getParticipantByIspb(ispb: string): Promise<PixParticipant | null> {
    await this.ensureParticipantsLoaded();
    return this.participants.find(participant => participant.ispb === ispb) || null;
  }

  private async ensureParticipantsLoaded(): Promise<void> {
    if (this.shouldFetchParticipants()) {
      await this.fetchParticipantsFromAPI();
    }
  }

  private shouldFetchParticipants(): boolean {
    if (!this.lastFetch || this.participants.length === 0) {
      return true;
    }
    
    const now = new Date();
    return now.getTime() - this.lastFetch.getTime() > this.CACHE_TTL;
  }

  private async fetchParticipantsFromAPI(): Promise<void> {
    this.logger.log('Buscando lista de participantes PIX da BrasilAPI');
    try {
      // Usar a API Brasil API
      const response = await axios.get('https://brasilapi.com.br/api/pix/v1/participants');
      
      // Mapear os dados da API para nosso formato interno
      this.participants = response.data.map(item => ({
        ispb: item.ispb || '',
        nome: item.nome || '',
        nomeReduzido: item.nome_reduzido || '',
        modalidadeParticipacao: item.modalidade_participacao || '',
        tipoParticipacao: item.tipo_participacao || '',
        inicioOperacao: item.inicio_operacao || ''
      }));
      
      this.lastFetch = new Date();
      this.logger.log(`${this.participants.length} participantes PIX carregados com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao buscar participantes PIX: ${error.message}`);
      if (this.participants.length === 0) {
        throw error;
      }
    }
  }
}
