export interface PixParticipant {
  ispb: string;
  nome: string;
  nomeReduzido: string;
  modalidadeParticipacao: string;
  tipoParticipacao: string;
  inicioOperacao: string;
}

export interface PixParticipantFilter {
  ispb?: string;
  nome?: string;
  tipoParticipacao?: string;
  modalidadeParticipacao?: string;
}