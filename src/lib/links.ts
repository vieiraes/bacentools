// Links oficiais do Pix. Fonte principal: página "Normas sobre o Pix" do BCB (bcb.gov.br/estabilidadefinanceira/pix-normas),
// lida em 11/10/2026. Cada link foi aberto e conferido (PDF existe, página existe na API do site do BCB).

export const LINKS_CONFERIDOS_EM = '2026-10-13';

export interface LinkOficial {
  titulo: string;
  descricao: string;
  url: string;
  /** versão vigente quando conferimos, se o documento informa */
  versao?: string;
  tipo: 'pdf' | 'zip' | 'xls' | 'pagina' | 'norma' | 'codigo';
}

export interface GrupoLinks { id: string; titulo: string; descricao: string; links: LinkOficial[] }

const BCB = 'https://www.bcb.gov.br';
const MANUAIS = `${BCB}/content/estabilidadefinanceira/pix/Regulamento_Pix`;
const norma = (tipo: 'Resolução BCB' | 'Instrução Normativa BCB', numero: number) =>
  `${BCB}/estabilidadefinanceira/exibenormativo?tipo=${encodeURIComponent(tipo)}&numero=${numero}`;

export const GRUPOS: GrupoLinks[] = [
  {
    id: 'regulamento-e-manuais',
    titulo: 'Regulamento e manuais',
    descricao: 'As regras do arranjo Pix e os manuais que detalham cada parte. São os documentos mais consultados por PO, QA e dev.',
    links: [
      { titulo: 'Regulamento Pix (Resolução BCB nº 1/2020)', descricao: 'Texto compilado do regulamento do arranjo Pix.', url: norma('Resolução BCB', 1), tipo: 'norma' },
      { titulo: 'Manual de Padrões para Iniciação do Pix', descricao: 'QR Code estático, dinâmico e composto, Pix Copia e Cola, API Pix e Pix Automático.', url: `${MANUAIS}/II_ManualdePadroesparaIniciacaodoPix.pdf`, versao: '2.10.0', tipo: 'pdf' },
      { titulo: 'Manual de Fluxos do Processo de Efetivação do Pix', descricao: 'Ordem das mensagens (pacs.008, pacs.002, pacs.004) entre pagador, SPI e recebedor.', url: `${MANUAIS}/III_ManualdeFluxosdoProcessodeEfetivacaodoPix.pdf`, versao: '2.1', tipo: 'pdf' },
      { titulo: 'Requisitos Mínimos para a Experiência do Usuário', descricao: 'O que o app precisa mostrar e permitir em cada jornada do Pix.', url: `${MANUAIS}/IV_RequisitosMinimosparaExperienciadoUsuario.pdf`, versao: '7.3', tipo: 'pdf' },
      { titulo: 'Manual de Tempos do Pix', descricao: 'Prazos máximos de cada etapa (40 segundos, 45 minutos) e quem responde por eles.', url: `${MANUAIS}/IX_ManualdeTemposdoPix.pdf`, versao: '7.0', tipo: 'pdf' },
      { titulo: 'Manual Operacional do DICT', descricao: 'Chaves Pix: cadastro, portabilidade, reivindicação, formatos e limites de consulta.', url: `${MANUAIS}/X_ManualOperacionaldoDICT.pdf`, tipo: 'pdf' },
      { titulo: 'Manual de Resolução de Disputas', descricao: 'Como os participantes resolvem divergências entre si.', url: `${MANUAIS}/XI_Manual_de_resolucao_de_disputa.pdf`, tipo: 'pdf' },
      { titulo: 'Manual de Penalidades (Resolução BCB nº 507)', descricao: 'Infrações e multas no Pix.', url: norma('Resolução BCB', 507), tipo: 'norma' },
      { titulo: 'Manual de Uso da Marca Pix', descricao: 'Como usar o logo e o nome Pix em apps e materiais.', url: `${MANUAIS}/I_manual_uso_marca_pix.pdf`, tipo: 'pdf' },
    ],
  },
  {
    id: 'mensagens-e-apis',
    titulo: 'Mensagens e APIs',
    descricao: 'Para quem integra: o formato das mensagens do SPI, a API Pix e a API do DICT.',
    links: [
      { titulo: 'Catálogo de Mensagens do SPI (planilhas, XSDs e exemplos)', descricao: 'Definição campo a campo das mensagens ISO 20022 do SPI e os códigos de erro.', url: `${BCB}/content/estabilidadefinanceira/cedsfn/Catalogos/spi.5.13.2.zip`, versao: '5.13.2', tipo: 'zip' },
      { titulo: 'Catálogo de Serviços do SFN, Volume VI: Pagamentos Instantâneos', descricao: 'Os serviços do SPI e do DICT e as regras de cada mensagem.', url: `${BCB}/content/estabilidadefinanceira/cedsfn/Catalogos/Catalogo_de_Servicos_do_SFN_Volume_VI_Versao_513.pdf`, versao: '5.13', tipo: 'pdf' },
      { titulo: 'Comunicação de dados no SFN (Redes, Segurança, Interfaces)', descricao: 'Página com o Manual de Redes, o Manual de Segurança e o Manual das Interfaces de Comunicação do SFN, e todos os catálogos.', url: `${BCB}/estabilidadefinanceira/comunicacaodados`, tipo: 'pagina' },
      { titulo: 'Especificação da API do DICT', descricao: 'Endpoints, erros e limites de consulta (token bucket) do diretório de chaves.', url: `${BCB}/content/estabilidadefinanceira/pix/API-DICT.html`, versao: '2.12.1', tipo: 'pagina' },
      { titulo: 'API Pix (repositório do BCB no GitHub)', descricao: 'Especificação OpenAPI da API Pix: cobranças, Pix recebidos, devoluções e webhooks.', url: 'https://github.com/bacen/pix-api', tipo: 'codigo' },
    ],
  },
  {
    id: 'adesao-e-testes',
    titulo: 'Adesão e homologação',
    descricao: 'Para instituições que vão entrar no Pix ou lançar um produto novo.',
    links: [
      { titulo: 'Instrução Normativa BCB nº 511/2024', descricao: 'Adesão ao Pix, mudança de modalidade, acesso ao DICT e ao SPI, participante responsável e produtos facultativos.', url: norma('Instrução Normativa BCB', 511), tipo: 'norma' },
      { titulo: 'Instrução Normativa BCB nº 508/2024', descricao: 'Testes formais de homologação no DICT, validação de QR Codes, iniciação de pagamento, saque e Pix Automático.', url: norma('Instrução Normativa BCB', 508), tipo: 'norma' },
      { titulo: 'Instrução Normativa BCB nº 243/2022', descricao: 'Participação direta no SPI, abertura da Conta PI e prazos de validação e liquidação.', url: norma('Instrução Normativa BCB', 243), tipo: 'norma' },
      { titulo: 'Área das instituições participantes', descricao: 'Página do BCB para quem participa ou quer participar do Pix.', url: `${BCB}/estabilidadefinanceira/pix-participantes`, tipo: 'pagina' },
    ],
  },
  {
    id: 'instrucoes-normativas',
    titulo: 'Regras de produto',
    descricao: 'Limites, segurança e produtos (Pix Automático, Agendado, Cobrança, Saque e Troco).',
    links: [
      { titulo: 'Instrução Normativa BCB nº 512/2024', descricao: 'Limites de valor para transações Pix.', url: norma('Instrução Normativa BCB', 512), tipo: 'norma' },
      { titulo: 'Instrução Normativa BCB nº 513/2024', descricao: 'Procedimentos do Pix Automático, Pix Agendado e Pix Cobrança.', url: norma('Instrução Normativa BCB', 513), tipo: 'norma' },
      { titulo: 'Instrução Normativa BCB nº 491/2024', descricao: 'Cadastro de dispositivo, chaves Pix e limites para dispositivos não cadastrados.', url: norma('Instrução Normativa BCB', 491), tipo: 'norma' },
      { titulo: 'Instrução Normativa BCB nº 412/2023', descricao: 'Incidentes de segurança com dados do Pix.', url: norma('Instrução Normativa BCB', 412), tipo: 'norma' },
      { titulo: 'Instrução Normativa BCB nº 198/2021', descricao: 'Habilitação de agente de saque (Pix Saque e Pix Troco).', url: norma('Instrução Normativa BCB', 198), tipo: 'norma' },
      { titulo: 'Resolução BCB nº 19/2020', descricao: 'Tarifas no Pix e no serviço de iniciação.', url: norma('Resolução BCB', 19), tipo: 'norma' },
      { titulo: 'Resolução BCB nº 195/2022', descricao: 'Regulamento do SPI e da Conta PI.', url: norma('Resolução BCB', 195), tipo: 'norma' },
    ],
  },
  {
    id: 'dados',
    titulo: 'Números e informações gerais',
    descricao: 'Para apresentações, discovery e contexto de produto.',
    links: [
      { titulo: 'Pix em números (estatísticas)', descricao: 'Volume de transações, valores, chaves cadastradas e usuários.', url: `${BCB}/estabilidadefinanceira/pix-em-numeros-estatisticas`, tipo: 'pagina' },
      { titulo: 'Relatório de Gestão do Pix 2026', descricao: 'Balanço do Pix publicado pelo BCB.', url: `${BCB}/content/estabilidadefinanceira/pix/relatorio_de_gestao_pix/relatorio_gestao_pix_2026.pdf`, tipo: 'pdf' },
      { titulo: 'Normas sobre o Pix (lista completa)', descricao: 'A página do BCB de onde esta lista foi montada, com todas as instruções normativas.', url: `${BCB}/estabilidadefinanceira/pix-normas`, tipo: 'pagina' },
      { titulo: 'Página do Pix no BCB', descricao: 'Entrada oficial do Pix: o que é, segurança, normas e participantes.', url: `${BCB}/estabilidadefinanceira/pix`, tipo: 'pagina' },
    ],
  },
];
