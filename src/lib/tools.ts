// Registro único das ferramentas: menu, página inicial e sitemap leem daqui.
export interface Tool {
  path: string;
  title: string;
  short: string;
  description: string;
  icon: 'bank' | 'pix' | 'docs' | 'bucket' | 'flow' | 'qr' | 'qrAdd' | 'id' | 'link' | 'ted';
  source: string;
  /** Ferramentas avulsas ficam num menu da barra do topo, com este nome curto */
  menu?: string;
  /** Área do site: Pix (padrão) ou SPB/TED, que tem menu e seção próprios */
  secao?: 'pix' | 'spb';
}

export const TOOLS: Tool[] = [
  {
    path: '/bancos/',
    title: 'Bancos',
    short: 'Bancos',
    description: 'Busque instituições por nome, código COMPE ou ISPB, com logo e sede.',
    icon: 'bank',
    source: 'BrasilAPI (dados do BCB)',
  },
  {
    path: '/participantes-pix/',
    title: 'Participantes do Pix',
    short: 'Participantes Pix',
    description: 'Todas as instituições no Pix: modalidade, participação direta ou indireta e início da operação.',
    icon: 'pix',
    source: 'BrasilAPI (dados do BCB)',
  },
  {
    path: '/informes/',
    title: 'Informes SPI e STR',
    short: 'Informes',
    description: 'Os informes operacionais do SPI (Pix) e do STR publicados pelo Banco Central, com o PDF.',
    icon: 'docs',
    source: 'Banco Central do Brasil',
  },
  {
    path: '/cenarios-pix/',
    title: 'Cenários e erros do Pix',
    short: 'Erros do Pix',
    description: 'Veja o Pix passar pelo SPI e o que acontece em cada erro: quem rejeita, com qual código e o que mostrar ao usuário, com a fonte oficial do BCB.',
    icon: 'flow',
    source: 'Catálogo de Mensagens do SPI e manuais do Pix (BCB)',
  },
  {
    path: '/gerador-pix/',
    title: 'Gerador de QR Code Pix',
    short: 'Gerar QR Pix',
    description: 'Monte um QR Code Pix estático com chave, valor e txid: gera o Pix Copia e Cola e a imagem, conferidos pelas regras do Manual de Padrões do BCB.',
    icon: 'qrAdd',
    menu: 'Gerador de QR Code Pix',
    source: 'Manual de Padrões para Iniciação do Pix 2.10.0 (BCB)',
  },
  {
    path: '/decodificador-pix/',
    title: 'Decodificador de QR Code Pix',
    short: 'QR Code Pix',
    description: 'Cole um Pix Copia e Cola e veja chave, valor, txid, URL e CRC, com cada campo conferido contra o Manual de Padrões do BCB.',
    icon: 'qr',
    menu: 'Decodificador Pix (QR Code)',
    source: 'Manual de Padrões para Iniciação do Pix 2.10.0 (BCB)',
  },
  {
    path: '/identificadores-pix/',
    title: 'Decodificador de EndToEndId e UUID',
    short: 'EndToEndId',
    description: 'Descubra quem gerou um EndToEndId ou RtrId de devolução, quando (UTC e Brasília) e se o formato está certo. Também lê UUID, inclusive a data do v7.',
    icon: 'id',
    menu: 'Decodificador UUID v7 e EndToEndId',
    source: 'Catálogo de Mensagens do SPI 5.13.2 (BCB) e RFC 9562',
  },
  {
    path: '/links-pix/',
    title: 'Links oficiais do Pix',
    short: 'Links oficiais',
    description: 'Regulamento, manuais, instruções normativas, API Pix, especificação do DICT e estatísticas: os documentos oficiais do BCB num lugar só, com a versão vigente.',
    icon: 'link',
    menu: 'Links oficiais do Pix',
    source: 'Página "Normas sobre o Pix" do Banco Central',
  },
  {
    path: '/simulador-dict/',
    title: 'Simulador de fichas do DICT',
    short: 'Simulador DICT',
    description: 'Veja o balde de fichas (token bucket) das consultas de chave Pix: 200, 404, 429 e devolução por pagamento.',
    icon: 'bucket',
    source: 'Especificação da API do DICT',
  },
];

// Área SPB e TED: menu próprio na barra do topo e seção própria na página inicial.
TOOLS.push(
  {
    path: '/spb/',
    title: 'SPB e TED: visão geral',
    short: 'Visão geral',
    description: 'O que é o SPB, o STR e a TED, o horário da TED agora (grade oficial do BCB) e as ferramentas de mensagens, XML e erros do STR.',
    icon: 'ted',
    menu: 'Visão geral e horário da TED',
    secao: 'spb',
    source: 'Banco Central (página do SPB e Grade de horários do SPB)',
  },
  {
    path: '/spb/links/',
    title: 'Links oficiais do SPB',
    short: 'Links do SPB',
    description: 'Catálogo de Serviços do SFN (volumes e XSD), Dicionário de Domínios, Relação de Erros, grade de horários, STR e Tesouro: os documentos oficiais do SPB num lugar só.',
    icon: 'link',
    menu: 'Links oficiais do SPB',
    secao: 'spb',
    source: 'Banco Central e Tesouro Nacional',
  },
);

export const secaoDe = (t: Tool) => t.secao ?? 'pix';

export const SITE = {
  name: 'BacenTools',
  url: 'https://bacentools.web.app',
  tagline: 'Ferramentas gratuitas do Pix e do Banco Central para POs, QAs e devs',
  repo: 'https://github.com/vieiraes/bacentools',
};

/** Crédito do projeto (Apache-2.0 + NOTICE): aparece na página Sobre, no rodapé e no JSON-LD. */
export const CRIADOR = {
  nome: 'Bruno Vieira',
  papel: 'QA especialista em meios de pagamento',
  github: 'https://github.com/vieiraes',
};
