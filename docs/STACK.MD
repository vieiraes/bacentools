# Resumo da Stack Definida para o Projeto BacenTools

## Visão Geral
Um site de ferramentas relacionadas a meios de pagamento e informações do BACEN, sem necessidade de login ou banco de dados.

## Backend
- **Framework**: NestJS
- **Propósito**: Servir como intermediário para APIs externas
- **Funções**: Proteger chaves de API, resolver CORS, processar dados quando necessário

## Frontend
- **Layout/Estilo**: Bootstrap 5
- **Interatividade**: Alpine.js
- **Estrutura**: HTML/CSS/JS servidos pelo backend NestJS

## Estrutura do Projeto
- Projeto único (não monorepo)
- Backend e frontend no mesmo repositório
- Backend em `/src/server`
- Frontend em `/src/public`

## Execução do Projeto
- Comando único: `npm run start:dev` para desenvolvimento
- Servidor único servindo tanto backend quanto frontend

## Deployment
- Frontend: Firebase Hosting
- Backend: Firebase Functions (para as APIs)
- Processo de build unificado

## Funcionalidades Planejadas
- Consumo de APIs de taxas e indicadores financeiros
- Ferramentas para PIX (geração/decodificação de QR codes)
- Consultas a informações do BACEN
- Outras ferramentas para desenvolvedores e POs

Esta stack representa uma abordagem eficiente e simples, mantendo a flexibilidade necessária para implementar as diversas ferramentas planejadas.