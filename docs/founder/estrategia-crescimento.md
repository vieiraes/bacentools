# BacenTools: estratégia de crescimento (autoridade, SEO e leads)

> Documento de estratégia de produto e marketing. Data: 11/10/2026. Autor: análise assistida para Bruno Vieira.
> Escopo: o site continua **grátis, sem cadastro e estático**. O dinheiro vem de fora do site, de consultoria, cursos e newsletter, e o site serve de vitrine e de captação.

## Sumário

1. [Suposições](#1-suposições)
2. [Diagnóstico rápido do site hoje](#2-diagnóstico-rápido-do-site-hoje)
3. [Concorrentes e alternativas](#3-concorrentes-e-alternativas)
4. [Demanda de busca (SEO) e arquitetura de conteúdo](#4-demanda-de-busca-seo-e-arquitetura-de-conteúdo)
5. [Gaps do produto: o que construir a seguir](#5-gaps-do-produto-o-que-construir-a-seguir)
6. [Captura de leads e monetização sem matar o "grátis"](#6-captura-de-leads-e-monetização-sem-matar-o-grátis)
7. [Medição: Google Analytics 4](#7-medição-google-analytics-4)
8. [Plano de 30, 60 e 90 dias](#8-plano-de-30-60-e-90-dias)
9. [Ideias de marketing do banco de estratégias](#9-ideias-de-marketing-do-banco-de-estratégias)
10. [Riscos](#10-riscos)
11. [Fontes](#11-fontes)

---

## 1. Suposições

Nenhuma pergunta foi feita ao Bruno. Estas são as premissas usadas:

| # | Suposição | Se estiver errada… |
|---|---|---|
| S1 | Tempo disponível: cerca de 10 a 15 h por semana para o BacenTools, dividido com outros projetos (PagPix etc.) | Com menos tempo, priorizar só os itens "P0" das tabelas |
| S2 | Verba de marketing: R$ 0. Gasto aceitável só com domínio (~R$ 40/ano) e ferramenta de e-mail no plano grátis | — |
| S3 | O Bruno topa aparecer: postar no LinkedIn com o próprio nome e rosto 2 a 3 vezes por semana | Sem isso, o plano depende só de SEO e fica 3 a 6 meses mais lento |
| S4 | Público prioritário: **QA e PO de fintechs/BaaS/bancos médios** (quem compra consultoria e curso). Devs vêm em segundo, estudantes em terceiro | — |
| S5 | Prioridade de receita: 1º consultoria/QA freelance (ticket alto, já vende hoje), 2º curso/treinamento in-company, 3º patrocínio | — |
| S6 | Não há volumes oficiais de busca (sem acesso a Google Keyword Planner/Ahrefs nesta análise). As estimativas de volume e dificuldade são **qualitativas**, baseadas no que aparece nas SERPs e no tamanho do público | Validar no Google Search Console após 30 dias |
| S7 | Nenhum dado sobre o Bruno é enviado a terceiros; o CNPJ dele existe e pode emitir nota de consultoria | — |

## 2. Diagnóstico rápido do site hoje

O que existe (fonte: `README.md`, `src/lib/tools.ts`, `src/app/sitemap.ts`):

| Ferramenta | Rota | Força | Limitação para crescer |
|---|---|---|---|
| Bancos | `/bancos/` | Busca por ISPB, COMPE e nome, com logo | Uma única página: Google não indexa "ISPB 60701190" como página própria |
| Participantes do Pix | `/participantes-pix/` | 880 instituições, modalidade, direta/indireta | Idem: sem página por instituição |
| Informes SPI e STR | `/informes/` | Agregador de PDFs do BCB | Conteúdo é link, pouca palavra indexável |
| Cenários e erros do Pix | `/cenarios-pix/` | **Ativo mais valioso.** 75 códigos com fonte oficial e animação. Nenhum concorrente brasileiro tem isso | Os códigos são abertos por âncora (`#AC06`, ver `CenariosView.tsx`). Âncoras não viram páginas no Google: hoje o site **não ranqueia para "AC06 pix"** |
| Simulador do DICT | `/simulador-dict/` | Único simulador público do token bucket | Termo de nicho, público pequeno |

Achados que mudam a estratégia:

- **O sitemap tem 6 URLs.** Para SEO de cauda longa, o site precisa de centenas de páginas estáticas (uma por código, por banco, por participante). O Next.js com exportação estática faz isso com `generateStaticParams` sem servidor.
- **Não há analytics** (nenhum `gtag`/GA no `src`). Hoje é impossível saber o que funciona.
- **Não há nenhum ponto de captura**: nem newsletter, nem "sobre o criador", nem CTA de contato.
- **Domínio `bacentools.web.app`**: funciona, mas é subdomínio genérico do Firebase. Um domínio próprio (`bacentools.com.br`) passa mais confiança a um PO de banco e acumula autoridade para o Bruno no longo prazo. Custo ~R$ 40/ano.
- **Diferencial defensável**: "tudo com fonte oficial do BCB, documento, versão e seção" + suíte de testes pública. É exatamente o que um gestor quer ver num QA de pagamentos. O site é o portfólio.

## 3. Concorrentes e alternativas

### 3.1 Mapa

| Categoria | Quem | O que oferece | O que falta (gap) | Como monetiza |
|---|---|---|---|---|
| Lista de bancos ISPB/COMPE | [iDinheiro](https://www.idinheiro.com.br/bancos/codigos-ispb-e-compe-dos-bancos/), [contabilidade.com](https://contabilidade.com/blog/codigo-dos-bancos-brasileiros-lista-completa-atualizada), [VRI Consulting](https://vriconsulting.com.br/bancos/codigos-banco.php) | Tabelas estáticas, longas, em post de blog | Não tem busca, fica desatualizada, não cruza com Pix (participa? direto/indireto?), não mostra ISPB → nome de forma técnica | Anúncios (AdSense), afiliados de conta digital, venda de serviços contábeis |
| API de dados | [BrasilAPI](https://brasilapi.com.br) (`/banks/v1`, `/pix/v1/participants`) e libs ([brasilapi-js](https://github.com/WillianAgostini/brasilapi-js), [brasil-api-mcp](https://glama.ai/mcp/servers/guilhermelirio/brasil-api-mcp/tools/bank-search)) | Dados crus para devs | Sem interface para PO/QA, sem contexto | Open source/doações. **É fonte do BacenTools, não concorrente: parceiro natural** |
| Decodificador de QR Pix | [Kobana Pix Decoder](https://www.kobana.com.br/en/resources/pix-decoder/), ferramentas no [TabNews](https://www.tabnews.com.br/jonas556440/gerador-e-decodificador-de-pix-copia-e-cola-e-qr-code-100-por-cento-client-side-e-privado), artigo da [Woovi no dev.to](https://dev.to/woovi/how-does-pix-qrcode-work-5e3k) | Cola o "copia e cola", vê campos e CRC | Pouca explicação didática campo a campo (ID 00, 26, 52, 54, 62, 63…), sem "o que está errado e por quê" | **Engenharia como marketing**: a Kobana usa a ferramenta grátis para vender API de cobrança. É exatamente o modelo que o BacenTools pode copiar para vender o Bruno |
| Códigos de erro Pix | Docs de PSPs: [Celcoin](https://developers.celcoin.com.br/docs/tabela-de-erros-pix), [Asaas](https://docs.asaas.com/docs/motivos-de-recusa), [QI Tech](https://docs.qitech.com.br/zh-Hans/documentation/pix/introducao), [FitBank](https://dev.fitbank.com.br/docs/error-codes), [Stark Bank](https://hexdocs.pm/starkbank/StarkBank.Error.html), [BS2](https://devs.bs2.com/docs/returns-incoming-flow); blogs B2C ([Nubank](https://blog.nubank.com.br/erro-pix-5-situacoes-comuns-e-o-que-fazer/), [Contábeis](https://www.contabeis.com.br/noticias/48411/pix-conheca-os-principais-erros-realizados-por-quem-transfere/)) | Cada PSP documenta **os seus** códigos proprietários (Celcoin "PBE150", FitBank "ISI…"), às vezes mapeando para ISO | **Ninguém tem uma página neutra, em português, por código ISO do Catálogo do SPI, com fonte oficial e "o que mostrar ao usuário".** A busca por "AC06 AM04 pacs.002" no Google devolve docs europeias (SEPA, BIS, Open Banking UK). **Este é o maior gap do mercado e o BacenTools já tem o conteúdo** | Venda da própria API (o doc é suporte) |
| DICT/token bucket | [FitBank](https://dev.fitbank.com.br/docs/rate-limiting-tokenbucket), [BS2](https://devs.bs2.com/docs/token-bucket), [BS2 políticas DICT](https://devs.bs2.com/docs/dict-database-query-limitation-policies) | Texto explicando as regras do PSP | Nada interativo; números variam por PSP e confundem | Venda de API |
| Regulatório / mudanças | [Okai](https://okai.com.br) (agrega normas e comunicados do BCB com classificação de impacto), [W Fintechs](https://wfintechs.substack.com) (newsletter semanal de fintech, Pix e Open Finance), Finsiders, apresentações do [Fórum Pix](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Forum_Pix_Plenaria/20251204-Forum_Pix.pdf) | Monitoramento normativo (Okai), análise de mercado (W Fintechs) | **Ninguém traduz a mudança regulatória em "o que muda no teste/backlog"** (ex.: Catálogo SPI 5.13: o que testar, que mensagens mudam) | Okai: assinatura B2B (compliance). W Fintechs: patrocínio e reports |
| Cursos de Pix | Busca em Udemy/Alura/Hotmart **não encontrou curso de Pix técnico** (SPI, DICT, ISO 20022, MED) para PO/QA/dev; a Alura tem cursos de API genéricos | — | **Gap claro**: não há curso de "Pix para PO e QA" no mercado aberto. A demanda existe: há vagas de "QA Pleno (Regulatório Pix)" ([exemplo](https://jobs.lever.co/jobgether/06cf628f-18b0-43b4-96e6-60a766caee1e)) e freelas de integração Pix no [Workana](https://www.workana.com/job/desenvolvedor-para-integracao-de-api-pix-em-plataforma-web-existente) | — |
| Fonte oficial | BCB: Regulamento Pix, Manuais, Catálogo de Mensagens, [Guia MED 2.0](https://bcb.gov.br/content/estabilidadefinanceira/pix/Guia%20MED%20-%20vers%C3%A3o%202.0.pdf) | Tudo correto, mas em PDF, por versão, difícil de achar e ler | Navegabilidade, busca, versões, linguagem para não especialista | — |

### 3.2 Posicionamento resultante

> **"O Pix explicado com a fonte oficial, por quem testa Pix."**
> Neutro (não é de nenhum PSP), em português, interativo, e cada afirmação com documento, versão e seção do BCB.

Os docs dos PSPs são enviesados ao próprio produto; os blogs B2C são rasos; o BCB é correto e ilegível. O BacenTools fica no meio: **a camada didática e neutra entre o BCB e quem constrói Pix**. Ninguém ocupa essa posição hoje.

## 4. Demanda de busca (SEO) e arquitetura de conteúdo

### 4.1 Termos e intenção

Legenda: Volume e dificuldade são estimativas qualitativas (S6). "Fit" = o quanto o BacenTools já tem material para ranquear.

| Cluster | Exemplos de termo | Intenção | Volume (est.) | Dificuldade (est.) | Fit | Prioridade |
|---|---|---|---|---|---|---|
| Código de erro individual | "AC06 pix", "AM04 pix", "erro AB03 pix", "BE01 pix", "MD06 devolução pix", "pix erro AC03", "FR01 pix" | Informacional, **urgente** (dev/QA com erro na tela, suporte de fintech) | Baixo por termo, **alto somado** (75 páginas) | **Baixa**: SERP hoje mostra docs SEPA/europeias | Já tem o conteúdo | **P0** |
| Tabela de erros | "códigos de erro pix", "tabela de erros pix", "motivos de rejeição pix", "motivos de devolução pix pacs.004" | Informacional/referência | Médio | Média (docs de PSPs) | Alto | **P0** |
| ISO 20022 no Pix | "pacs.002", "pacs.008", "pacs.004", "camt.054 pix", "ISO 20022 pix" | Informacional (dev/QA) | Baixo-médio | Baixa em PT | Alto | P1 |
| ISPB/COMPE | "ISPB", "o que é ISPB", "código ISPB [banco]", "lista ISPB", "código COMPE", "código do banco [nome]" | Informacional/navegacional | **Alto** (também público geral e contadores) | **Alta** no termo genérico (iDinheiro, contabilidade.com); **baixa** na cauda "ISPB 18236120" | Alto | P1 (cauda longa) |
| Participantes Pix | "participantes do pix", "[banco] participante direto pix", "lista de instituições pix" | Informacional | Médio | Média | Alto | P1 |
| DICT | "DICT pix", "o que é DICT", "DICT 429", "rate limit DICT", "token bucket pix", "fichas DICT" | Informacional técnica | Baixo | **Baixa** | Único | P1 |
| SPI/STR | "o que é SPI", "SPI Banco Central", "STR Bacen", "informe SPI" | Informacional (estudante, analista) | Médio | Média (BCB, wikis) | Médio | P2 |
| Novidades regulatórias | "MED 2.0", "Pix Automático como funciona", "Pix por aproximação", "Pix garantido/parcelado", "catálogo SPI 5.13", "bloqueio cautelar pix" | Informacional, **picos de notícia** | Alto no B2C, médio no B2B | Alta no B2C (imprensa); **baixa no ângulo "o que muda para QA/dev"** | Médio | P1 (ângulo técnico) |
| QR Code / BR Code | "decodificar qr code pix", "pix copia e cola decodificar", "BR Code pix campos", "CRC16 pix" | Transacional/ferramenta | Médio | Média (Kobana, devs) | Exige ferramenta nova | P1 |
| endToEndId / txid | "endToEndId pix", "o que é E2E id pix", "txid pix formato" | Informacional (dev/QA, suporte) | Médio | **Baixa** (fontes contraditórias, ex.: [sabertecnologias](https://sabertecnologias.com.br/conteudo/consulta-id-de-transferencia-pix-como-encontrar-rapidamente)) | Exige conteúdo novo | P1 |
| Horários e limites | "horário noturno pix", "limite pix noturno", "pix funciona feriado" | Informacional B2C | Alto | Alta (imprensa) | Baixo | P3 |
| Carreira | "QA de pagamentos", "teste de Pix", "como testar Pix", "homologação Pix" | Informacional, **captura de lead de curso/consultoria** | Baixo | Baixa | Alto (autoridade do Bruno) | **P0 para leads** |

### 4.2 Arquitetura de conteúdo proposta

Tudo continua estático (Next.js `output: export` + `generateStaticParams`), sem servidor e sem banco.

```
bacentools.com.br (ou .web.app)
├── /                                   início
├── /erros-pix/                         índice: tabela filtrável dos 75 códigos (pacs.002, pacs.004, DICT)
│   └── /erros-pix/ac06/                1 página por código (75 páginas)
│        título: "AC06 no Pix: conta bloqueada. O que significa e o que mostrar ao usuário"
│        blocos: significado oficial · quem rejeita (animação) · mensagem sugerida ao usuário
│                · como reproduzir em teste · códigos parecidos · fonte (doc, versão, seção)
│                · CTA newsletter + "Fale com o criador"
├── /cenarios-pix/                      a animação (já existe), linkando para cada /erros-pix/<código>
├── /bancos/                            busca (já existe)
│   └── /bancos/<ispb>/                 1 página por instituição (~400 com COMPE; 880 com Pix)
│        "Banco X: ISPB 12345678, COMPE 123, participante direto do Pix desde 2020"
├── /participantes-pix/                 (já existe), linkando para /bancos/<ispb>/
├── /dict/                              simulador + guia "DICT, 429 e token bucket explicados"
├── /qr-code-pix/                       decodificador BR Code campo a campo (novo)
├── /glossario/                         glossário do Pix e ISO 20022 (1 página por termo: SPI, STR, DICT, PSP, ISPB, MED, pacs.008, endToEndId, txid, EVP…)
├── /mudou-no-pix/                      linha do tempo regulatória + arquivo da newsletter
│   └── /mudou-no-pix/catalogo-spi-5-13/   1 página por mudança: "o que muda para PO, QA e dev"
├── /guias/                             guias longos para PO/QA
│   ├── /guias/como-testar-pix/
│   ├── /guias/checklist-homologacao-pix/
│   └── /guias/endtoendid-e-txid/
└── /sobre/                             quem é o Bruno, consultoria, palestras, contato
```

Regras de SEO on-page para todas as páginas novas:

- `<title>` com o termo exato no início ("AC06 no Pix: …"), `description` com a resposta em uma frase.
- Dados estruturados `FAQPage` (pergunta "O que é o erro AC06 no Pix?") e `DefinedTerm` no glossário; `BreadcrumbList` em todas.
- Linkagem interna: cada código liga para 3 a 5 códigos parecidos, para o termo do glossário e para a mensagem ISO (pacs.002).
- A **fonte oficial com versão** fica visível no topo: é o diferencial e o sinal de E-E-A-T (experiência e autoridade) que o Google valoriza em temas financeiros (YMYL).
- Autor visível ("Por Bruno Vieira, QA de pagamentos") com link para `/sobre/` e LinkedIn: SEO e lead ao mesmo tempo.
- `llms.txt` na raiz e respostas curtas no topo da página, para ser citado por buscadores com IA (ChatGPT, Perplexity, AI Overviews), que hoje respondem "o que é AC06" com fontes europeias.
- Registrar no **Google Search Console** e no **Bing Webmaster** no dia 1; enviar o sitemap.

### 4.3 Calendário editorial fixo (âncoras do BCB)

| Gatilho | Frequência | Conteúdo |
|---|---|---|
| Novo Catálogo de Mensagens do SPI / notas de versão | 2 a 3 vezes por ano | "O que mudou no Catálogo X.Y: mensagens, códigos novos e o que testar". **Próximo: 5.13. Homologação começa em 13/10/2026 e a produção em 25/10/2026** ([comunicado](https://okai.com.br/documento/2026-04-13/comunicado-n-45-057)): oportunidade imediata |
| Plenária do Fórum Pix | ~trimestral | Resumo "o que vem aí" para PO |
| Comunicados e resoluções BCB sobre Pix | Mensal | Entrada na linha do tempo `/mudou-no-pix/` |
| Estatísticas do Pix (volumes do BCB) | Mensal | 1 gráfico + 1 insight para LinkedIn |
| Aniversário do Pix (16/11) | Anual | Post e conteúdo "Pix em números" |

## 5. Gaps do produto: o que construir a seguir

Critério: **impacto** (tráfego orgânico + leads + autoridade) × **esforço** para um dev solo, sem servidor.

| # | Funcionalidade | Público | Impacto | Esforço | Por que | Prioridade |
|---|---|---|---|---|---|---|
| G1 | **Páginas estáticas por código de erro** (`/erros-pix/<código>/`) | QA, dev, suporte | Muito alto | **Baixo** (dados já existem em `src/lib/pix-erros/`) | Transforma o maior ativo em 75 portas de entrada no Google | **P0** |
| G2 | **Analytics + página "Sobre/Contrate" + newsletter** | Todos | Muito alto (sem isso não há lead) | Baixo | Ver seções 6 e 7 | **P0** |
| G3 | **Decodificador/validador de BR Code (QR Pix)** com explicação campo a campo, CRC16 e "o que está errado" | QA, dev, PO | Alto | Médio (parser EMV TLV + CRC no navegador) | Busca recorrente; Kobana prova a demanda; diferencial = didática + lista de erros comuns de geração | **P1** |
| G4 | **Páginas por instituição** (`/bancos/<ispb>/`) | Público amplo, contadores, devs | Alto em volume, baixo em lead | Baixo-médio (build a partir do snapshot diário) | Cauda longa de "ISPB [banco]"; cruza com dados do Pix (único) | **P1** |
| G5 | **Glossário do Pix e ISO 20022** | Estudante, PO júnior | Médio-alto | Baixo (texto) | Linkagem interna e termos "o que é…" | **P1** |
| G6 | **Gerador de massa de teste**: chaves Pix válidas (CPF/CNPJ com DV, e-mail, telefone +55, EVP/UUID), `endToEndId` no formato `E` + ISPB + AAAAMMDDHHmm + 11 caracteres, `txid` (26 a 35 caracteres), BR Code estático com CRC | QA, dev | Alto entre QAs (público que mais compra consultoria) | Baixo-médio | Ninguém oferece isso junto; é o "Gerador de CPF" do mundo Pix (e geradores de CPF têm volume enorme) | **P1** |
| G7 | **Linha do tempo regulatória "Mudou no Pix"** (resoluções, versões do Catálogo, MED 2.0, Pix Automático, bloqueio cautelar) | PO, compliance | Alto para newsletter | Médio (curadoria contínua) | Alimenta a newsletter; ângulo "o que muda no backlog" é inexplorado | **P1** |
| G8 | **Checklist de homologação Pix** (interativo, marca e exporta) | QA, PO de PSP novo | Alto para lead (consultoria) | Médio | Público pequeno e **muito qualificado**: quem está homologando paga consultor. Base: [IN BCB 352](https://www.compliasset.com/?p=4815) e manuais do BCB | **P1 (lead magnet)** |
| G9 | Calculadora de prazos do Pix (devolução em até 90 dias, MED, agendamento, horário noturno 20h/22h, prazo de 24 a 48 h para aumento de limite) | PO, suporte | Médio | Médio (regras precisam de fonte oficial) | Útil, mas a imprensa domina o B2C | P2 |
| G10 | Quiz/trilha "Pix para PO e QA" com certificado compartilhável | Estudante, QA júnior | Médio (viralidade no LinkedIn) | Médio | Certificado com o nome da pessoa é compartilhado no LinkedIn: mídia grátis. Funil natural para o curso pago | P2 |
| G11 | Decodificador de mensagem ISO 20022 (cola XML pacs.008/002 → explica campos) | Dev, QA | Médio | Alto | Muito técnico, público pequeno | P3 |
| G12 | Comparador de PSPs (preço, API, sandbox) | PO, empreendedor | Médio | Alto (manutenção, risco de viés) | Conflita com patrocínio por PSPs | P3 (evitar por ora) |

**Sequência recomendada:** G2 → G1 → G6 → G3 → G5 → G4 → G7/G8 → G10.

## 6. Captura de leads e monetização sem matar o "grátis"

Princípio: **nenhuma ferramenta fica atrás de cadastro.** O e-mail é trocado por algo *a mais* (PDF, alerta, trilha), nunca pelo uso.

### 6.1 Ofertas (escada de valor)

| Degrau | Oferta | Preço | Para quem | Como chega |
|---|---|---|---|---|
| 0 | Ferramentas | Grátis, sem cadastro | Todos | SEO, LinkedIn |
| 1 | Newsletter **"Mudou no Pix"** (quinzenal; edição extra a cada nova versão do Catálogo SPI) | Grátis, e-mail | PO, QA, dev | CTA em todas as páginas |
| 2 | Lead magnets em PDF (ver 6.2) | Grátis, e-mail | QA, PO | Páginas de erro, guias |
| 3 | Workshop ao vivo "Pix para PO e QA" (2 h, online) | R$ 97 a 197 por pessoa | Profissionais individuais | Newsletter, LinkedIn |
| 4 | Curso gravado "Testando Pix de ponta a ponta" (Hotmart/Kiwify ou site próprio) | R$ 297 a 597 | QA, PO | Workshop, newsletter |
| 5 | **Treinamento in-company** (4 a 8 h para o time de produto/QA de uma fintech) | R$ 4 a 12 mil | Fintechs, BaaS, bancos médios | LinkedIn, "Contrate" |
| 6 | **Consultoria de QA de pagamentos** (auditoria de cenários Pix, estratégia de testes, preparação para homologação, revisão de mensagens de erro ao usuário) | R$ 150 a 300/h ou pacote | PSPs em adesão, fintechs | "Contrate o criador" |
| — | Patrocínio discreto ("Apoio: PSP X" no rodapé e na newsletter) | R$ 1 a 5 mil/mês quando houver tráfego | PSPs (Celcoin, Woovi, Efí, Asaas, Stark, Transfeera…) | Depois de ~5 mil visitas/mês ou ~1.000 assinantes |

Os preços são referências iniciais a validar; não houve pesquisa de preço específica.

### 6.2 Lead magnets específicos

| Lead magnet | Formato | Onde oferecer | Para quem | Esforço |
|---|---|---|---|---|
| **Mapa dos 75 erros do Pix** (1 página A3: código, quem rejeita, mensagem ao usuário) | PDF | `/erros-pix/*`, `/cenarios-pix/` | QA, dev, suporte | Baixo (dados já existem) |
| **Checklist de homologação Pix** (SPI, DICT, QR Code, MED) | PDF + versão interativa | `/guias/checklist-homologacao-pix/` | PSP em adesão, PO | Médio |
| **100 cenários de teste de Pix** (planilha: pré-condição, passo, resultado esperado, código) | XLSX/Google Sheets | `/guias/como-testar-pix/`, LinkedIn | QA | Médio (o Bruno tem isso na cabeça) |
| **Alerta de nova versão do Catálogo SPI** | E-mail automático | `/mudou-no-pix/`, `/informes/` | PO, dev | Baixo |
| **Massa de teste pronta** (JSON com chaves, E2E ids, BR Codes válidos e inválidos) | Download | Gerador (G6) | QA, dev | Baixo |

Ferramenta de e-mail grátis compatível com site estático: **Substack** (grátis, tem descoberta própria; a W Fintechs usa) ou **Buttondown/MailerLite** (formulário embutível). Recomendação: **Substack** para a newsletter (descoberta e recomendações cruzadas) + formulário embutido com link.

### 6.3 Onde colocar no site (CRO)

| Local | Elemento | Por quê |
|---|---|---|
| Página de cada código de erro, logo **após** a resposta | Caixa "Receba o Mapa dos 75 erros do Pix (PDF)" | Momento de maior valor percebido; não atrapalha quem só quer a resposta |
| Rodapé de todas as páginas | "Mudou no Pix: as mudanças do BCB explicadas para PO, QA e dev. 1 e-mail a cada 15 dias" | Captura de quem volta |
| Cabeçalho | Link "Sobre o criador" (não "Contato") | Curiosidade > formulário |
| `/sobre/` | Foto, 3 bullets de experiência (BaaS, Pix, QA), "o que eu faço por você" (3 ofertas), prova (o próprio site + suíte de testes + bugs encontrados), botão **"Agendar 20 min"** (Cal.com grátis) e LinkedIn | Converte autoridade em reunião |
| Fim do simulador DICT e dos cenários | "Seu time está implementando Pix? Faço revisão de cenários de teste e mensagens de erro." | Contexto exato da dor |
| Botão "Copiar link deste erro" / "Compartilhar no LinkedIn" | Em cada código | Viralidade sem cadastro |
| Página inicial | Prova social quando existir ("Usado por QAs de X empresas", nº de assinantes) | Confiança |

O que **não** fazer: popup na entrada, bloquear ferramenta, pedir e-mail para ver código.

## 7. Medição: Google Analytics 4

Usar GA4 (grátis) com consentimento simples, ou **Plausible/Umami** se preferir sem cookie (Umami self-host grátis; Plausible pago). Ligar também o **Search Console**, que é o mais importante para SEO.

### 7.1 Eventos

| Evento | Parâmetros | Quando |
|---|---|---|
| `tool_use` | `tool` (bancos, participantes, cenarios, dict, qrcode, gerador) | Primeira interação real (busca, clique em cenário, ficha consumida) |
| `search` | `tool`, `term_type` (ispb, compe, nome, codigo) | Busca feita (sem enviar o termo se puder ser dado pessoal) |
| `error_code_view` | `code` (AC06…), `message_type` (pacs.002, pacs.004, dict) | Abertura de um código |
| `copy_link` / `share` | `content_id`, `channel` | Compartilhamento |
| `source_click` | `doc` (catálogo, manual), `code` | Clique na fonte oficial (mede confiança) |
| `lead_magnet_view` | `magnet` | Caixa de lead visível |
| `generate_lead` (conversão) | `magnet`, `page_path` | Envio de e-mail |
| `newsletter_signup` (conversão) | `placement` (rodapé, inline, sobre) | Assinatura |
| `contact_click` (conversão) | `cta` (agendar, linkedin, email), `page_path` | Clique em "Contrate" |
| `outbound_course` (conversão) | `product` | Clique para workshop/curso |

### 7.2 Metas (KPIs) por fase

| Métrica | 30 dias | 90 dias | 6 meses |
|---|---|---|---|
| Páginas indexadas (Search Console) | 80+ | 300+ | 1.000+ |
| Cliques orgânicos/mês | 300 | 2.000 | 8.000 |
| Assinantes da newsletter | 100 | 500 | 1.500 |
| Taxa página → e-mail (páginas de erro) | 1% | 2% | 3% |
| Conversas de consultoria/treinamento | 2 | 6 | 15 |
| Primeiro contrato pago | — | 1 | 3+ |

As metas são estimativas iniciais para calibrar após 30 dias de dados.

## 8. Plano de 30, 60 e 90 dias

### Dias 1 a 30: fundação + primeira onda (aproveitar o Catálogo SPI 5.13)

| Semana | Produto/site | Distribuição |
|---|---|---|
| 1 | GA4/Umami + Search Console + Bing; página `/sobre/` com Cal.com; newsletter "Mudou no Pix" no Substack; rodapé com CTA | Post de lançamento no LinkedIn: "Saí de uma BaaS e abri o que eu usava todo dia: 5 ferramentas grátis de Pix" (com vídeo de 30 s da animação de erro) |
| 2 | **G1: 75 páginas de erro** + índice `/erros-pix/` + sitemap; PDF "Mapa dos 75 erros" | Edição #1 da newsletter: "Catálogo SPI 5.13: o que muda (homologação 13/10, produção 25/10)". Post LinkedIn "O erro AC06 não é culpa do seu app" (carrossel) |
| 3 | Domínio próprio (opcional) com 301; `llms.txt`; FAQ schema | Publicar no **TabNews** (comunidade dev BR forte, já tem posts de ferramentas Pix) e no r/brdev; contato com mantenedores da **BrasilAPI** (pedir link "Feito com BrasilAPI" na lista de projetos; oferecer issue/PR) |
| 4 | G6: gerador de massa de teste (v1: chaves + E2E + txid) | Série LinkedIn "1 erro do Pix por dia" (posts curtos com link para a página do código: 20 posts prontos a partir dos dados) |

### Dias 31 a 60: alcance + primeira receita

| Item | Detalhe |
|---|---|
| G3 decodificador de QR Pix | Lançar com post "Colei 10 QR Codes de lojas reais: 3 tinham erro" (sem expor dados) |
| G5 glossário | 30 termos |
| Workshop ao vivo #1 "Pix para PO e QA" | R$ 97, 2 h, vagas limitadas a 30; divulgar para a newsletter e LinkedIn; gravar para virar curso |
| Parcerias de conteúdo | Pedir participação em podcasts/newsletters com o público certo: W Fintechs, Finsiders, podcasts de QA (ex.: comunidades de testes BR), meetups de QA; oferecer "aula de 20 min sobre erros do Pix" |
| Comunidades | Grupos LinkedIn de Pix/Open Finance, Discord/Telegram de QA BR, comunidade TabNews. Regra: responder dúvidas com link para a página exata, nunca spam |
| Outreach direto (consultoria) | 10 mensagens/semana a heads de QA/produto de PSPs em adesão ou fintechs recém-autorizadas (lista pública de participantes do Pix por data de início: **o próprio BacenTools mostra quem entrou recentemente**) |

### Dias 61 a 90: escala e produto pago

| Item | Detalhe |
|---|---|
| G4 páginas por instituição | ~880 páginas; checar indexação |
| G7 linha do tempo + G8 checklist de homologação | Lead magnet de maior valor para consultoria |
| Curso gravado | Editar o workshop + material; Hotmart/Kiwify |
| Oferta in-company | Página `/treinamento/` com ementa; mandar para os contatos que abriram a newsletter 3+ vezes |
| Lançamento organizado | Product Hunt **não é o canal certo** (público global, produto só em PT-BR, nicho regulatório); se fizer, só como bônus. Melhor: "semana de lançamento" no LinkedIn + TabNews + newsletter parceira |
| Patrocínio | Com ~5 mil visitas/mês, mandar media kit simples a 5 PSPs (ver seção 3) |
| Revisão | Search Console: quais termos crescem → dobrar conteúdo nesse cluster |

## 9. Ideias de marketing do banco de estratégias

Selecionadas a partir do banco da skill `marketing-ideas` (170+ estratégias), pela combinação relevância × impacto × viabilidade para um fundador solo sem verba.

| # | Estratégia (banco) | Aplicação ao BacenTools |
|---|---|---|
| 1 | **Auto-Generate Thousands of SEO Pages** | Páginas por código de erro, por instituição (ISPB) e por termo do glossário: ~1.000 páginas geradas no build a partir de dados que o site já tem |
| 2 | **Engineering as Marketing / Launch Tiny Features as Standalone Products** | Cada ferramenta (decodificador de QR, gerador de massa, simulador DICT) é lançada como produto próprio, com post próprio e URL própria. É o modelo da Kobana, aplicado para vender o Bruno |
| 3 | **Use Your Product FOR Potential Customers** | Escolher 10 fintechs; testar publicamente (sem expor dados) as mensagens de erro do app delas contra o mapa dos 75 erros e enviar ao head de produto um relatório "3 mensagens de erro do Pix que confundem seu cliente". Gera conversa de consultoria |
| 4 | **Build Distribution Channels That Don't Need Algorithms** | Newsletter "Mudou no Pix": a lista de e-mail é o ativo que não depende do LinkedIn nem do Google |
| 5 | **Get Featured by People Who Already Have Your Audience** | W Fintechs, Finsiders, BrasilAPI, podcasts de QA, TabNews |
| 6 | **Share Mind-Blowing Insights from Your Own Data** | Os dados de participantes do Pix viram posts: "quantas instituições entraram no Pix em 2026", "% de participantes indiretos", "quem saiu" |
| 7 | **Give Customers an Embeddable Certificate or Badge** + **Create a Fun Game** | Quiz "Você sabe Pix?" com certificado com o nome da pessoa, compartilhável no LinkedIn |
| 8 | **Break My App Challenge** | "Ache um erro no BacenTools": o site é vitrine de QA, desafie a comunidade a achar bugs e credite publicamente. Reforça a marca de QA |
| 9 | **Add "Ask AI About Us"** (adaptado) | `llms.txt` e respostas curtas para ser a fonte que ChatGPT/Perplexity citam sobre erros do Pix |
| 10 | **Create a Niche Job Board** (opcional, mais tarde) | "Vagas de QA e PO de Pix": atrai exatamente o público e os contratantes |

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Conteúdo desatualizado em tema regulatório (YMYL) derruba confiança e ranking | Já existe: fonte com versão + testes de rastreabilidade. Adicionar "verificado em DD/MM/AAAA" em cada página |
| Uso de "Bacen" no nome sugerir vínculo oficial | Aviso visível "Projeto independente, sem vínculo com o Banco Central" (verificar se já existe) |
| Patrocínio de PSP comprometer a neutralidade | Só patrocínio de marca, nunca ranking/comparador pago; política pública |
| Fundador solo dispersa entre projetos | Seguir só os P0 se o tempo cair (S1) |
| Dados pessoais em busca/QR Code decodificado | Tudo no navegador; não enviar termos ao analytics |

## 11. Fontes

Pesquisa feita em 11/10/2026.

- Listas de bancos: [iDinheiro: Códigos ISPB e COMPE](https://www.idinheiro.com.br/bancos/codigos-ispb-e-compe-dos-bancos/) · [VRI Consulting](https://vriconsulting.com.br/bancos/codigos-banco.php) · [contabilidade.com: código dos bancos](https://contabilidade.com/blog/codigo-dos-bancos-brasileiros-lista-completa-atualizada) · [contabilidade.com: ISPB × COMPE](https://contabilidade.com/blog/o-que-e-ispb-e-qual-a-diferenca-para-o-codigo-compe/)
- BrasilAPI e libs: [brasilapi-js](https://github.com/WillianAgostini/brasilapi-js) · [Brasilapi.Banks (hexdocs)](https://hexdocs.pm/brasilapi/Brasilapi.Banks.API.html) · [brasil-api-mcp](https://glama.ai/mcp/servers/guilhermelirio/brasil-api-mcp/tools/bank-search)
- Erros Pix em PSPs: [Celcoin: tabela de erros Pix](https://developers.celcoin.com.br/docs/tabela-de-erros-pix) · [Asaas: motivos de recusa](https://docs.asaas.com/docs/motivos-de-recusa) · [QI Tech: Pix](https://docs.qitech.com.br/zh-Hans/documentation/pix/introducao) · [FitBank: error codes](https://dev.fitbank.com.br/docs/error-codes) · [Stark Bank: erros](https://hexdocs.pm/starkbank/StarkBank.Error.html) · [BS2: devoluções](https://devs.bs2.com/docs/returns-incoming-flow) · [Nubank: erro Pix](https://blog.nubank.com.br/erro-pix-5-situacoes-comuns-e-o-que-fazer/) · [Contábeis: erros no Pix](https://www.contabeis.com.br/noticias/48411/pix-conheca-os-principais-erros-realizados-por-quem-transfere/)
- SERP de "AC06/AM04 pacs.002" dominada por fontes estrangeiras: [BIS Nexus pacs.002](https://docs.bis.org/nexus/messaging-and-translation/message-pacs.002-payment-status-report) · [Numeral pacs.002](https://docs.numeral.io/docs/pacs002-xsd-business-logic) · [Token.io STET codes](https://support.token.io/hc/en-us/articles/24758156951193-What-do-the-4-letter-codes-for-STET-Banks-mean)
- DICT/token bucket: [FitBank](https://dev.fitbank.com.br/docs/rate-limiting-tokenbucket) · [BS2 token bucket](https://devs.bs2.com/docs/token-bucket) · [BS2 políticas DICT](https://devs.bs2.com/docs/dict-database-query-limitation-policies) · [Efí rate limits](https://apis.io/rate-limits/efi-bank/efi-bank-rate-limits/)
- QR Code/BR Code: [Kobana Pix Decoder](https://www.kobana.com.br/en/resources/pix-decoder/) · [TabNews: gerador/decodificador client side](https://www.tabnews.com.br/jonas556440/gerador-e-decodificador-de-pix-copia-e-cola-e-qr-code-100-por-cento-client-side-e-privado) · [Woovi: How does Pix QR Code work](https://dev.to/woovi/how-does-pix-qrcode-work-5e3k) · [TabNews: CobraPix](https://www.tabnews.com.br/foundryai/pitch-cobrapix-gerando-br-code-pix-no-navegador-e-o-que-recusamos-virar)
- endToEndId: [Delbank API](https://docs.delbank.com.br/reference/transferência-pix-com-chave) · [Pismo: eventos Pix](https://developers.pismo.io/events/docs/pix-pix-in-1) · [sabertecnologias](https://sabertecnologias.com.br/conteudo/consulta-id-de-transferencia-pix-como-encontrar-rapidamente)
- Regulatório: [Fórum Pix dez/2025 (BCB)](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Forum_Pix_Plenaria/20251204-Forum_Pix.pdf) · [Mercado Pago: novas regras Pix 2026](https://www.mercadopago.com.br/blog/novas-regras-pix-contas-juridicas) · [Contábeis: Pix por aproximação 1 ano](https://www.contabeis.com.br/artigos/75434/pix-por-aproximacao-completa-1-ano-com-potencial-de-crescimento/) · [Guia MED 2.0 (BCB)](https://bcb.gov.br/content/estabilidadefinanceira/pix/Guia%20MED%20-%20vers%C3%A3o%202.0.pdf) · [Okai: novas regras de devolução](https://okai.com.br/artigo/as-novas-regras-de-devolucao-no-pix-o-que-mudou-e-onde-estao-os-riscos) · [Comunicado Catálogo SPI 5.13 (via Okai)](https://okai.com.br/documento/2026-04-13/comunicado-n-45-057) · [Comunicado Catálogo 5.12 (via Okai)](https://okai.com.br/documento/2025-12-19/comunicado-n-44-424) · [Relatório anual SPI 2025 (BCB)](https://www.bcb.gov.br/content/estabilidadefinanceira/relatorios_SPI/relatorio_anual_spi_2025.pdf)
- Horário noturno: [Transfeera: horário Pix](https://transfeera.com/blog/horario-pix/) · [Mercado & Consumo: BC limita horário noturno](https://mercadoeconsumo.com.br/2021/11/19/pix-bc-limita-opcoes-para-horario-noturno-as-faixas-de-20h-as-6h-ou-de-22h-as-6h/)
- Adesão/homologação: [Poder360: requisitos de adesão ao Pix](https://www.poder360.com.br/economia/banco-central-estabelece-requisitos-para-adesao-ao-pix/) · [Compliasset: IN BCB 352](https://www.compliasset.com/?p=4815)
- Newsletters/comunidade: [W Fintechs](https://wfintechs.substack.com/p/165-ptbr) · [W Fintechs #FinOpen](https://wfintechs.substack.com/p/finopen-03-ptbr)
- Demanda de profissionais: [Vaga QA Pleno Regulatório Pix](https://jobs.lever.co/jobgether/06cf628f-18b0-43b4-96e6-60a766caee1e) · [Workana: integração API Pix](https://www.workana.com/job/desenvolvedor-para-integracao-de-api-pix-em-plataforma-web-existente)

**Limitações da pesquisa:** sem ferramenta de volume de busca (S6); a busca por cursos de Pix em Udemy/Alura/Hotmart não retornou cursos técnicos, o que indica gap, mas não prova ausência total; os comunicados do Catálogo 5.12/5.13 foram vistos via Okai (terceiro) e devem ser conferidos em bcb.gov.br antes de publicar conteúdo.
