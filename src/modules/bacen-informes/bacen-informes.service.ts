import { Injectable, Logger } from '@nestjs/common';
import { BacenInforme, BacenInformeFilter, InformeType } from './interfaces/bacen-informe.interface';
import { PaginatedResult, PaginationOptions } from '../../common/interfaces/pagination.interface';
import axios from 'axios';

@Injectable()
export class BacenInformesService {
    private readonly logger = new Logger(BacenInformesService.name);
    private informes: BacenInforme[] = [];
    private lastFetch: { [key: string]: Date } = {};
    private readonly CACHE_TTL = 3600000; // 1 hora em ms

    private readonly SPI_GUID = '2ce7ab01-23d2-46bd-8f8e-e14888661cd5';
    private readonly STR_GUID = 'acc99ae3-5bc8-417a-a505-c9818d4486a5';

    async findAll(
        filter: BacenInformeFilter,
        options: PaginationOptions
    ): Promise<PaginatedResult<BacenInforme>> {
        await this.ensureInformesLoaded(filter);

        // Aplicar filtros
        let result = this.informes.filter(item => {
            // Filtro por tipo
            if (filter.tipo && filter.tipo !== 'todos') {
                if (item.tipo !== filter.tipo) return false;
            }

            // Filtro por ano
            if (filter.ano) {
                const itemYear = new Date(item.dataReferencia).getFullYear();
                if (itemYear !== filter.ano) return false;
            }

            // Filtro por intervalo de data
            if (filter.dataInicio) {
                const itemDate = new Date(item.dataReferencia);
                if (itemDate < filter.dataInicio) return false;
            }

            if (filter.dataFim) {
                const itemDate = new Date(item.dataReferencia);
                if (itemDate > filter.dataFim) return false;
            }

            // Filtro por termo de busca
            if (filter.termo) {
                const normalizedTerm = filter.termo.toLowerCase();
                if (!item.titulo.toLowerCase().includes(normalizedTerm)) return false;
            }

            return true;
        });

        // Aplicar ordenação
        const orderKey = Object.keys(options.orderBy || {})[0] || 'dataReferencia';
        const orderDirection = options.orderBy?.[orderKey] || 'desc';

        result = result.sort((a, b) => {
            if (orderDirection === 'desc') {
                return a[orderKey] > b[orderKey] ? -1 : 1;
            } else {
                return a[orderKey] < b[orderKey] ? -1 : 1;
            }
        });

        // Aplicar paginação
        const total = result.length;
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

    async findOne(id: number): Promise<BacenInforme | null> {
        await this.ensureInformesLoaded({ tipo: 'todos' });
        return this.informes.find(item => item.id === id) || null;
    }

    private async ensureInformesLoaded(filter: BacenInformeFilter): Promise<void> {
        // Determinar quais tipos de informes precisam ser carregados
        const tiposFiltrados: InformeType[] = [];
        if (!filter.tipo || filter.tipo === 'todos') {
            tiposFiltrados.push(InformeType.SPI, InformeType.STR);
        } else {
            tiposFiltrados.push(filter.tipo as InformeType);
        }

        // Determinar o ano a ser buscado
        const ano = filter.ano || new Date().getFullYear();

        // Carregar cada tipo necessário
        const fetchPromises = tiposFiltrados.map(tipo => this.fetchInformesIfNeeded(tipo, ano));
        await Promise.all(fetchPromises);
    }

    private async fetchInformesIfNeeded(tipo: InformeType, ano: number): Promise<void> {
        const cacheKey = `${tipo}-${ano}`;

        // Verificar se precisa buscar dados novamente
        if (
            !this.lastFetch[cacheKey] ||
            new Date().getTime() - this.lastFetch[cacheKey].getTime() > this.CACHE_TTL
        ) {
            await this.fetchInformes(tipo, ano);
            this.lastFetch[cacheKey] = new Date();
        }
    }

    private async fetchInformes(tipo: InformeType, ano: number): Promise<void> {
        const guidLista = tipo === InformeType.SPI ? this.SPI_GUID : this.STR_GUID;
        const url = `https://www.bcb.gov.br/api/servico/sitebcb/cronologicodados`;

        this.logger.log(`Buscando informes do tipo ${tipo} para o ano ${ano}`);

        try {
            const response = await axios.get(url, {
                params: {
                    ano: ano,
                    tronco: 'estabilidadefinanceira',
                    guidLista: guidLista,
                    ordem: 'DataReferencia desc, Title asc'
                }
            });

            if (response.data && response.data.conteudo) {
                // Mapear resposta para nossa interface
                const informesMapeados = response.data.conteudo.map(item => ({
                    id: item.Id,
                    titulo: item.titulo,
                    dataReferencia: item.dataReferencia,
                    dataPublicacao: item.DataPublicacao,
                    pdfUrl: `https://www.bcb.gov.br${item.arquivo.ServerRelativeUrl}`,
                    pdfName: item.arquivo.Name,
                    tamanho: parseInt(item.Tamanho),
                    tipo: tipo
                }));

                // Atualizar cache, preservando informes de outros tipos/anos
                this.informes = [
                    ...this.informes.filter(info => info.tipo !== tipo ||
                        new Date(info.dataReferencia).getFullYear() !== ano),
                    ...informesMapeados
                ];

                this.logger.log(`Carregados ${informesMapeados.length} informes ${tipo} do ano ${ano}`);
            }
        } catch (error) {
            this.logger.error(`Erro ao buscar informes ${tipo} do ano ${ano}: ${error.message}`);
            throw error;
        }
    }
}
