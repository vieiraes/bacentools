import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { BacenInformesService } from './bacen-informes.service';
import { BacenInforme, BacenInformeFilter, InformeType } from './interfaces/bacen-informe.interface';
import { PaginatedResult, PaginationOptions } from '../../common/interfaces/pagination.interface';

@Controller('bacen-informes')
export class BacenInformesController {
  private readonly logger = new Logger(BacenInformesController.name);
  
  constructor(private readonly bacenInformesService: BacenInformesService) {}

  @Get()
  async getInformes(
    // Filtros
    @Query('tipo') tipo?: string,
    @Query('ano') ano?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('termo') termo?: string,
    // Paginação
    @Query('skip') skip = 0,
    @Query('take') take = 50,
    // Ordenação - Apenas direção, sempre por dataReferencia
    @Query('orderBy') orderBy: 'asc' | 'desc' = 'desc',
  ): Promise<PaginatedResult<BacenInforme>> {
    this.logger.log(`Buscando informes com filtros e paginação`);
    
    // Preparar filtros
    const filter: BacenInformeFilter = {
      tipo: tipo as InformeType | 'todos',
      ano: ano ? Number(ano) : undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      termo
    };
    
    // Preparar opções de paginação
    const paginationOptions: PaginationOptions = {
      skip: Number(skip),
      take: Number(take),
      orderBy: {
        dataReferencia: orderBy  // Sempre ordenar por dataReferencia
      }
    };
    
    return this.bacenInformesService.findAll(filter, paginationOptions);
  }

  @Get(':id')
  async getInformeById(@Param('id') id: number): Promise<BacenInforme | { message: string }> {
    this.logger.log(`Buscando informe com ID: ${id}`);
    const informe = await this.bacenInformesService.findOne(Number(id));
    
    if (!informe) {
      return { message: `Informe com ID ${id} não encontrado` };
    }
    
    return informe;
  }
}
