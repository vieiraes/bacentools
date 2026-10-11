// Registro único das ferramentas: menu, página inicial e sitemap leem daqui.
export interface Tool {
  path: string;
  title: string;
  short: string;
  description: string;
  icon: 'bank' | 'pix' | 'docs' | 'bucket' | 'flow' | 'qr' | 'id';
  source: string;
  /** Ferramentas avulsas ficam no menu "Ferramentas" da barra do topo, com este nome curto */
  menu?: string;
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
    path: '/simulador-dict/',
    title: 'Simulador de fichas do DICT',
    short: 'Simulador DICT',
    description: 'Veja o balde de fichas (token bucket) das consultas de chave Pix: 200, 404, 429 e devolução por pagamento.',
    icon: 'bucket',
    source: 'Especificação da API do DICT',
  },
];

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
