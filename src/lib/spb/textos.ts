// Trechos do Catálogo de Serviços do SFN 5.13 usados nas telas do SPB, com o local exato na fonte.
// Escritos à mão a partir do PDF (o script só extrai dados estruturados); cada um diz volume e página.

export interface Trecho { texto: string; fonte: string }

export const ROTULO_DOMINIO: Record<string, string> = {
  FinlddCli: 'Finalidade da transferência',
  CodDevTransf: 'Código de devolução',
  SitLancSTR: 'Situação do lançamento no STR',
  SitLancPAG: 'Situação do lançamento no SITRAF',
  TpCt: 'Tipo de conta',
  TpPessoa: 'Tipo de pessoa',
  Pref: 'Nível de preferência no STR',
  PrefPAG: 'Nível de preferência no SITRAF',
};

export const GRUPOS: Record<'STR' | 'PAG', { nome: string; resumo: Trecho }> = {
  STR: {
    nome: 'STR (Banco Central)',
    resumo: {
      texto: 'Liquidação bruta em tempo real: cada transferência é liquidada sozinha, na hora, de forma irrevogável e sem saldo negativo. Domínio de sistema SPB01.',
      fonte: 'Página do STR no BCB; Catálogo 5.13, Volume I, Grupo de Serviços STR (p. 251)',
    },
  },
  PAG: {
    nome: 'SITRAF (Núclea)',
    resumo: {
      texto: 'Processamento multilateral líquido: a Núclea é a contraparte garantidora, processa os pagamentos em ciclos considerando o saldo e os créditos recebidos de outros participantes, e liquida a posição líquida de cada um em reservas bancárias via STR. Não é permitido saldo negativo. Domínio de sistema SPB01.',
      fonte: 'Catálogo 5.13, Volume II, Grupo de Serviços PAG (p. 272)',
    },
  },
};

export const FLUXO2: Trecho = {
  texto: 'Requisição de serviço com informação a terceiro: o participante A requisita; o prestador responde a A com a mensagem R1 e informa o participante B (terceiro) com a mensagem R2. Se houver erro, a mensagem volta para A com os erros marcados.',
  fonte: 'Catálogo 5.13, Volume IV, Fluxos de Eventos, Fluxo2 (p. 205)',
};

export const MULTIPLICIDADE: Trecho = {
  texto: '[x..y]: x é o mínimo de ocorrências (minOccurs no XSD) e y o máximo. O campo é opcional quando x = 0 e obrigatório quando x ≥ 1. Na coluna "Ou" (choice no XSD), se todos os campos forem obrigatórios, exatamente um deve ser informado; se todos forem opcionais, nenhum ou um.',
  fonte: 'Catálogo 5.13, Volume I, Introdução, Estrutura do Catálogo (p. 5)',
};

export const RETORNO_COM_ERRO: Trecho = {
  texto: 'Há duas formas de devolver um erro. Erros de transmissão (XML mal formado ou incompatível com o XSD, campo obrigatório ausente, erro no BCMSG, de segurança, de autorização…) voltam na mensagem GEN0004. Erros de formato ou conteúdo no SISMSG voltam na própria mensagem, com o código acrescido do sufixo "E" (STR0008 vira STR0008E), e cada campo com problema recebe o atributo CodErro com o código do erro (exemplo do catálogo: <CNPJCstde CodErro="ECIR0061">). Erros que não são de um campo específico vão na tag da mensagem (exemplo do catálogo: <STR0004 CodErro="EGEN0050">). Mensagens com erro não devem ser respondidas. Erros de grade horária podem vir por GEN0004 ou com sufixo "E".',
  fonte: 'Catálogo 5.13, Volume I, Introdução, Retorno de Mensagens com Erro (p. 27)',
};

export const PREFIXO_ERRO: Record<string, string> = {
  EGEN: 'Erro do grupo GEN (Serviços Gerais): envelope, XML e controle das mensagens',
  ESTR: 'Erro do STR (Banco Central)',
  EPAG: 'Erro do SITRAF (Núclea)',
};
