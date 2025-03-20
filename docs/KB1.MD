# Documentação de Conhecimento para Projeto Frontend BacenTools

## Visão Geral do Projeto

O projeto **BacenTools** é uma API construída em NestJS que fornece informações relacionadas ao sistema financeiro brasileiro, incluindo:

1. **Informes do Bacen** - Comunicados e informativos do Sistema de Pagamentos Instantâneos (SPI) e Sistema de Transferência de Reservas (STR)
2. **Bancos** - Lista de instituições financeiras do Brasil com códigos ISPB e COMPE
3. **Participantes PIX** - Instituições participantes do sistema PIX

A API segue padrões consistentes com filtros por query params, paginação e ordenação.

## API Endpoints

### 1. Bacen Informes

**Endpoint principal**: `GET /api/bacen-informes`

**Parâmetros**:
- `tipo`: Filtra por tipo de informe ('SPI', 'STR', 'todos')
- `ano`: Filtra por ano de referência
- `dataInicio`: Filtra por data de início (formato ISO)
- `dataFim`: Filtra por data de fim (formato ISO)
- `skip`: Posição inicial para paginação (default: 0)
- `take`: Quantidade de itens por página (default: 50)
- `orderBy`: Direção da ordenação ('asc' ou 'desc', sempre por dataReferencia)

**Exemplo de resposta**:
```json
{
  "data": [
    {
      "id": 123,
      "titulo": "Informe SPI 2023/45",
      "dataReferencia": "2023-05-15T00:00:00Z",
      "dataPublicacao": "2023-05-16T14:30:00Z",
      "pdfUrl": "https://url-do-pdf.pdf",
      "pdfName": "informe_spi_2023_45.pdf",
      "tamanho": 1245678,
      "tipo": "SPI"
    }
  ],
  "meta": {
    "total": 136,
    "skip": 0,
    "take": 50
  }
}
```

**Endpoint por ID**: `GET /api/bacen-informes/:id`

### 2. Bancos

**Endpoint principal**: `GET /api/banks`

**Parâmetros**:
- `ispb`: Filtra por código ISPB
- `code`: Filtra por código COMPE
- `name`: Filtra por nome (busca parcial)
- `skip`: Posição inicial para paginação (default: 0)
- `take`: Quantidade de itens por página (default: 50)
- `orderBy`: Campo para ordenação (default: 'name')
- `orderDir`: Direção da ordenação ('asc' ou 'desc')

**Exemplo de resposta**:
```json
{
  "data": [
    {
      "ispb": "00000000",
      "name": "BCB",
      "code": 1,
      "fullName": "Banco Central do Brasil"
    }
  ],
  "meta": {
    "total": 359,
    "skip": 0,
    "take": 50
  }
}
```

**Endpoint por ISPB**: `GET /api/banks/:ispb`

### 3. Participantes PIX

**Endpoint principal**: `GET /api/pix-participants`

**Parâmetros**:
- `ispb`: Filtra por código ISPB
- `nome`: Filtra por nome (busca parcial)
- `tipoParticipacao`: Filtra por tipo de participação
- `modalidadeParticipacao`: Filtra por modalidade de participação
- `skip`: Posição inicial para paginação (default: 0)
- `take`: Quantidade de itens por página (default: 50)
- `orderDir`: Direção da ordenação ('asc' ou 'desc', sempre por nome)

**Exemplo de resposta**:
```json
{
  "data": [
    {
      "ispb": "00000000",
      "nome": "Banco Central do Brasil",
      "nomeReduzido": "BCB",
      "modalidadeParticipacao": "Direta",
      "tipoParticipacao": "Liquidante",
      "inicioOperacao": "2020-11-16"
    }
  ],
  "meta": {
    "total": 762,
    "skip": 0,
    "take": 50
  }
}
```

**Endpoint por ISPB**: `GET /api/pix-participants/:ispb`

## Modelos de Dados

### 1. Bacen Informe

```typescript
export enum InformeType {
  SPI = 'SPI',
  STR = 'STR'
}

export interface BacenInforme {
  id: number;
  titulo: string;
  dataReferencia: string;
  dataPublicacao: string;
  pdfUrl: string;
  pdfName: string;
  tamanho: number;
  tipo: InformeType;
}
```

### 2. Bank

```typescript
export interface Bank {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}
```

### 3. PixParticipant

```typescript
export interface PixParticipant {
  ispb: string;
  nome: string;
  nomeReduzido: string;
  modalidadeParticipacao: string;
  tipoParticipacao: string;
  inicioOperacao: string;
}
```

## Modelo de Paginação

Todos os endpoints principais retornam resultados paginados seguindo o padrão:

```typescript
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}
```

## Requisitos para o Frontend

1. **Funcionalidades**:
   - Visualização e busca de informes do Bacen
   - Consulta de bancos por ISPB, código ou nome
   - Listagem de participantes PIX com filtros

2. **Tecnologias**:
   - React 18+
   - TypeScript
   - Material UI (MUI) para componentes e layout
   - React Router para navegação
   - React Query ou SWR para gerenciamento de estado e cache

3. **Estrutura de Páginas**:
   - Página inicial/dashboard
   - Página de informes Bacen
   - Página de detalhe de informe
   - Página de bancos
   - Página de detalhe de banco
   - Página de participantes PIX
   - Página de detalhe de participante

4. **Features Desejadas**:
   - Filtros avançados para cada tipo de dado
   - Paginação eficiente
   - Loading states e skeletons
   - Tratamento de erros
   - Download de PDFs dos informes
   - Layout responsivo

## Ambiente de Desenvolvimento

O backend estará rodando em:
- Desenvolvimento: `http://localhost:3344`
- Produção: A ser definido (provavelmente no Fly.io)

Para desenvolvimento, recomenda-se configurar um proxy no package.json do frontend:
```json
"proxy": "http://localhost:3344"
```

## Plano de Deploy

- **Frontend**: Firebase Hosting
- **Backend**: Fly.io

## Decisões Arquiteturais

1. Decidimos manter frontend e backend em repositórios separados para:
   - Facilitar o deploy independente
   - Manter clara a separação de responsabilidades
   - Permitir diferentes ciclos de desenvolvimento
   - Otimizar para as respectivas plataformas de hospedagem

2. Padrões de API consistentes:
   - Endpoints RESTful
   - Filtragem via query params
   - Paginação unificada
   - Modelo de resposta consistente

3. Melhorias futuras planejadas:
   - Autenticação e autorização
   - Histórico de consultas
   - Notificações de novos informes
   - Dashboard com estatísticas

Este documento serve como base de conhecimento para o desenvolvimento do frontend. Qualquer dúvida ou necessidade de esclarecimento, consulte a documentação da API ou entre em contato com a equipe de backend.