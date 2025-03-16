# Documentação do Projeto BacenTools

## Visão Geral
BacenTools é uma suíte de ferramentas web para desenvolvedores e Product Owners que trabalham com meios de pagamento no Brasil. O projeto visa centralizar diversas funcionalidades úteis relacionadas ao sistema financeiro brasileiro e ao BACEN.

## Objetivos
- Fornecer ferramentas úteis para consulta de indicadores financeiros
- Facilitar a geração e decodificação de QR codes PIX
- Simplificar o acesso a informações regulatórias
- Criar uma interface amigável e simples para ferramentas de uso cotidiano

## Stack Tecnológica

### Backend
- **Framework**: NestJS (Node.js)
- **Linguagem**: TypeScript
- **Propósito**: API Gateway para serviços externos

### Frontend
- **Layout/Componentes**: Bootstrap 5
- **Interatividade**: Alpine.js
- **Estrutura**: HTML/CSS/JS

## Arquitetura

### Estrutura de Diretórios
```
bacentools/
├── src/
│   ├── server/           # Backend NestJS
│   │   ├── main.ts       # Ponto de entrada do NestJS
│   │   ├── app.module.ts # Módulo principal
│   │   └── modules/      # Módulos funcionais por ferramenta
│   │       ├── pix/
│   │       ├── cotacoes/
│   │       └── ...
│   └── public/           # Frontend (arquivos estáticos)
│       ├── index.html    # Página principal
│       ├── css/          # Estilos CSS e Bootstrap
│       ├── js/           # Scripts JavaScript e Alpine.js
│       └── pages/        # Páginas HTML para cada ferramenta
├── dist/                 # Código compilado
├── nest-cli.json         # Configuração do NestJS
├── package.json
└── tsconfig.json
```

### Fluxo de Dados
1. O usuário acessa o frontend hospedado no Firebase
2. Frontend faz solicitações para APIs backend
3. Backend atua como intermediário para APIs externas
4. Resultados são processados e retornados ao frontend
5. Frontend exibe resultados formatados para o usuário

## Ferramentas Previstas

1. **Cotações e Indicadores**
   - Cotação do Dólar
   - Taxa SELIC
   - CDI
   - Índices de inflação

2. **Ferramentas PIX**
   - Geração de QR code estático
   - Decodificação de QR code PIX
   - Validação de chaves PIX

3. **Utilitários de Desenvolvimento**
   - Decodificador JWT
   - Validadores de formatação
   - Conversores de formatos

4. **Informações Regulatórias**
   - Consulta a normas do BACEN
   - Status do SPI (Sistema de Pagamentos Instantâneos)

## Instruções de Desenvolvimento

### Requisitos
- Node.js (v14 ou superior)
- NPM ou Yarn

### Instalação
```bash
git clone https://github.com/usuario/bacentools.git
cd bacentools
npm install
```

### Comandos de Desenvolvimento
```bash
# Iniciar em modo desenvolvimento
npm run start:dev

# Compilar o projeto
npm run build

# Fazer deploy para Firebase
npm run deploy
```

### URLs de Desenvolvimento
- Frontend e Backend: http://localhost:3000

## Deploy
- Frontend: Firebase Hosting (bacentool.web.app)
- Backend: Firebase Functions

## Roadmap de Desenvolvimento
1. Setup inicial do projeto
2. Implementação das ferramentas básicas
3. Melhorias de UI/UX
4. Adição de novas funcionalidades

## Manutenção
O projeto é projetado para ser de baixa manutenção, com foco em:
- Atualizar endpoints de APIs quando necessário
- Adicionar novas ferramentas conforme demanda
- Manter dependências atualizadas

---

Esta documentação serve como referência inicial para o projeto BacenTools e será atualizada conforme o desenvolvimento progredir.