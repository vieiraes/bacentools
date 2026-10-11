// Registro único das ferramentas: menu, página inicial e sitemap leem daqui.
export interface Tool {
  path: string;
  title: string;
  short: string;
  description: string;
  icon: 'bank' | 'pix' | 'docs' | 'bucket';
  source: string;
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
