import { Injectable, Logger } from '@nestjs/common';
import { PixParticipant } from './interfaces/pix-participant.interface';
import axios from 'axios';

@Injectable()
export class PixParticipantsService {
    private readonly logger = new Logger(PixParticipantsService.name);
    private participants: PixParticipant[] = [];
    private lastFetch: Date | null = null;
    private readonly CACHE_TTL = 3600000; // 1 hora em milissegundos

    async getAllParticipants(): Promise<PixParticipant[]> {
        if (this.shouldFetchParticipants()) {
            await this.fetchParticipantsFromAPI();
        }
        return this.participants;
    }

    async getParticipantByIspb(ispb: string): Promise<PixParticipant | null> {
        await this.ensureParticipantsLoaded();
        return this.participants.find(participant => participant.ispb === ispb) || null;
    }

    async searchParticipantsByName(query: string): Promise<PixParticipant[]> {
        await this.ensureParticipantsLoaded();
        const lowerQuery = query.toLowerCase();
        return this.participants.filter(participant =>
            participant.nome.toLowerCase().includes(lowerQuery) ||
            participant.nome_reduzido.toLowerCase().includes(lowerQuery)
        );
    }

    async getParticipantsByTipoParticipacao(tipo: string): Promise<PixParticipant[]> {
        await this.ensureParticipantsLoaded();
        return this.participants.filter(participant =>
            participant.tipo_participacao.toLowerCase() === tipo.toLowerCase()
        );
    }

    async getParticipantsByModalidadeParticipacao(modalidade: string): Promise<PixParticipant[]> {
        await this.ensureParticipantsLoaded();
        return this.participants.filter(participant =>
            participant.modalidade_participacao.toLowerCase() === modalidade.toLowerCase()
        );
    }

    async getParticipantsOrderedByStartDate(): Promise<PixParticipant[]> {
        await this.ensureParticipantsLoaded();
        return [...this.participants].sort((a, b) =>
            new Date(b.inicio_operacao).getTime() - new Date(a.inicio_operacao).getTime()
        );
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
        this.logger.log('Buscando participantes PIX da API Brasil');
        try {
            const response = await axios.get('https://brasilapi.com.br/api/pix/v1/participants');
            this.participants = response.data;
            this.lastFetch = new Date();
            this.logger.log(`${this.participants.length} participantes PIX carregados com sucesso`);
        } catch (error) {
            this.logger.error(`Erro ao buscar participantes PIX: ${error.message}`);
            // Se já tivermos dados em cache, manter os dados antigos
            if (this.participants.length === 0) {
                throw error;
            }
        }
    }
}
