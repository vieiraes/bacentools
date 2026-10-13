// Links oficiais do SPB e da TED, conferidos em 13/10/2026 (páginas do STR, do SPB e de Comunicação eletrônica de dados do BCB;
// SPB no site do Tesouro). As versões do catálogo batem com src/data/spb/fontes.json (teste em tests/unit/links.test.ts).
import type { GrupoLinks } from './links';

const BCB = 'https://www.bcb.gov.br';
const CAT = `${BCB}/content/estabilidadefinanceira/cedsfn/Catalogos`;
const norma = (tipo: 'Resolução BCB', numero: number) => `${BCB}/estabilidadefinanceira/exibenormativo?tipo=${encodeURIComponent(tipo)}&numero=${numero}`;

export const GRUPOS_SPB: GrupoLinks[] = [
  {
    id: 'catalogo',
    titulo: 'Catálogo de Serviços do SFN',
    descricao: 'O "contrato" das mensagens do SPB: eventos, campos, regras, tipos e XSD. A TED está no grupo STR (volume I) e no grupo PAG (volume II).',
    links: [
      { titulo: 'Comunicação eletrônica de dados no SFN (todos os catálogos e prazos)', descricao: 'Página do BCB com as versões vigentes, datas de homologação e de produção de cada versão.', url: `${BCB}/estabilidadefinanceira/comunicacaodados`, tipo: 'pagina' },
      { titulo: 'Volume I: grupos STR, SEL, CMP e outros', descricao: 'Eventos e mensagens do STR, entre elas a STR0008 (TED) e a STR0010 (devolução).', url: `${CAT}/Catalogo_de_Servicos_do_SFN_Volume_I_Versao_513.pdf`, versao: '5.13', tipo: 'pdf' },
      { titulo: 'Volume II: grupos PAG, LDL, CTP e outros', descricao: 'Mensagens do SITRAF (Núclea), entre elas a PAG0108 (TED) e a PAG0111 (devolução).', url: `${CAT}/Catalogo_de_Servicos_do_SFN_Volume_II_Versao_513.pdf`, versao: '5.13', tipo: 'pdf' },
      { titulo: 'Volume IV: dicionários e fluxos', descricao: 'Abreviaturas das tags, dicionário de campos, tipos, regras (RSTR, RPAG) e fluxos de eventos (Fluxo2 etc.).', url: `${CAT}/Catalogo_de_Servicos_do_SFN_Volume_IV_Versao_513.pdf`, versao: '5.13', tipo: 'pdf' },
      { titulo: 'Volume V: arquivos', descricao: 'Arquivos que trafegam na RSFN, por grupo de serviços.', url: `${CAT}/Catalogo_de_Servicos_do_SFN_Volume_V_Versao_513.pdf`, versao: '5.13', tipo: 'pdf' },
      { titulo: 'XSD das mensagens (volumes I, II e III)', descricao: 'Um esquema XML por mensagem (ex.: STR/STR0008.XSD), com o envelope BCMSG e a mensagem de erro (STR0008E).', url: `${CAT}/XSDDOCV513.zip`, versao: '5.13', tipo: 'zip' },
      { titulo: 'Planilha de alterações 5.13 × 5.12', descricao: 'O que mudou de uma versão para a outra: eventos, campos, regras e tipos.', url: `${CAT}/Alteracoes513v512.xls`, versao: '5.13', tipo: 'xls' },
      { titulo: 'Dicionário de Domínios', descricao: 'Valores permitidos de cada campo (finalidade da TED, tipo de conta, código de devolução, situação do lançamento), com datas de ativação e desativação.', url: `${CAT}/Documentos_auxiliares/Dicionario_dominios/Dom20261009.xls`, versao: '09/10/2026', tipo: 'xls' },
      { titulo: 'Relação de Códigos de Erros', descricao: 'Todos os códigos de erro das mensagens (EGEN, ESTR, EPAG…), com datas de ativação e desativação.', url: `${CAT}/Documentos_auxiliares/Relacao_erros/Erros20260904.xls`, versao: '04/09/2026', tipo: 'xls' },
    ],
  },
  {
    id: 'str',
    titulo: 'STR (Sistema de Transferência de Reservas)',
    descricao: 'Onde a TED é liquidada quando vai pela STR0008.',
    links: [
      { titulo: 'Página do STR no BCB', descricao: 'O que é o STR, participantes, estatísticas, abertura de conta e acesso ao STR-Web.', url: `${BCB}/estabilidadefinanceira/str`, tipo: 'pagina' },
      { titulo: 'Grades de horários do SPB', descricao: 'Abertura e fechamento de cada grade (STR02 = TED no dia), em dias úteis, 24/12, último dia útil, sábados e domingos.', url: `${BCB}/content/estabilidadefinanceira/STR/Grade_horarios_SPB.XLS`, tipo: 'xls' },
      { titulo: 'Relação de participantes do STR', descricao: 'Instituições com conta no STR.', url: `${BCB}/content/estabilidadefinanceira/str1/ParticipantesSTR.pdf`, tipo: 'pdf' },
      { titulo: 'Resolução BCB nº 105/2021', descricao: 'Regulamento do STR.', url: norma('Resolução BCB', 105), tipo: 'norma' },
      { titulo: 'Regulamentação relacionada ao STR', descricao: 'Normas do STR e do SPB.', url: `${BCB}/estabilidadefinanceira/strlegislacao`, tipo: 'pagina' },
      { titulo: 'Estatísticas do STR', descricao: 'Volume e valor das transferências no STR.', url: `${BCB}/estabilidadefinanceira/spb_estatisticas_str`, tipo: 'pagina' },
      { titulo: 'Manual de acesso ao STR via Internet', descricao: 'Uso do STR-Web, a interface web do STR.', url: `${BCB}/content/estabilidadefinanceira/estabilidade_docs/ManualAcessoSTRInternet_3_4.pdf`, versao: '3.4', tipo: 'pdf' },
    ],
  },
  {
    id: 'rede',
    titulo: 'Rede e segurança (RSFN)',
    descricao: 'Por onde as mensagens trafegam e as regras de segurança.',
    links: [
      { titulo: 'Manual de Redes do SFN', descricao: 'A Rede do Sistema Financeiro Nacional (RSFN) e os provedores homologados.', url: `${BCB}/content/estabilidadefinanceira/cedsfn/Manual_de_Redes_do_SFN_Ver_9.4.pdf`, versao: '9.4', tipo: 'pdf' },
      { titulo: 'Manual de Segurança do SFN, Volume I', descricao: 'Aspectos gerais de segurança: certificados, criptografia e assinatura das mensagens.', url: `${BCB}/content/estabilidadefinanceira/cedsfn/Manual%20de%20Seguran%C3%A7a%20do%20SFN%20-%20Vol.I%20-%20v6_00.pdf`, versao: '6.00', tipo: 'pdf' },
    ],
  },
  {
    id: 'spb',
    titulo: 'SPB em geral',
    descricao: 'Contexto, estatísticas e a migração para ISO 20022.',
    links: [
      { titulo: 'Sistema de Pagamentos Brasileiro (SPB)', descricao: 'Segmentos do SPB (infraestruturas do mercado financeiro e arranjos de pagamento) e quem regula cada um.', url: `${BCB}/estabilidadefinanceira/spb`, tipo: 'pagina' },
      { titulo: 'Estatísticas do SPB', descricao: 'Números dos sistemas de pagamento brasileiros.', url: `${BCB}/estabilidadefinanceira/estatisticasspb`, tipo: 'pagina' },
      { titulo: 'ISO 20022: Central de Informações', descricao: 'A migração das mensagens do SFN para o padrão ISO 20022.', url: `${BCB}/estabilidadefinanceira/ISO20022`, tipo: 'pagina' },
      { titulo: 'Fórum SPB', descricao: 'Fórum do BCB com o mercado sobre o SPB.', url: `${BCB}/estabilidadefinanceira/forumspb`, tipo: 'pagina' },
    ],
  },
  {
    id: 'tesouro',
    titulo: 'Tesouro Nacional',
    descricao: 'O Tesouro também usa o SPB (ordens bancárias, arrecadação) e publica domínios próprios.',
    links: [
      { titulo: 'SPB no Tesouro Nacional', descricao: 'Informações do Tesouro sobre o Sistema de Pagamentos Brasileiro.', url: 'https://www.gov.br/tesouronacional/pt-br/ordens-bancarias-e-spb/sistema-de-pagamentos-brasileiro-spb', tipo: 'pagina' },
      { titulo: 'Domínios do Tesouro Nacional (downloads)', descricao: 'Tabelas de domínios usadas nas mensagens do Tesouro no SPB.', url: 'https://www.gov.br/tesouronacional/pt-br/ordens-bancarias-e-spb/sistema-de-pagamentos-brasileiro-spb/downloads', tipo: 'pagina' },
    ],
  },
];
