# Plano: um só BacenTools

O objetivo é juntar três projetos numa ferramenta só: gratuita, pública, só front-end e publicada em **https://bacentools.web.app** (Firebase Hosting, projeto `bacentools`). Ela é feita para POs, QAs e devs que trabalham com Pix e com o Bacen.

## De onde partimos (11/10/2026)

| Repositório | O que é | Destino |
|---|---|---|
| `bacentools-front` (privado) | Next.js 15 (exportação estática), MUI e React Query, no ar no Firebase. Tem as páginas Bancos e Relatórios SPI/STR; "Participantes PIX" ainda está como "em breve". | **Fica.** Vira o único repositório. |
| `bacentools` (público) | API NestJS no Fly.io (`bacentools.fly.dev`). É só um intermediário: repassa a BrasilAPI (bancos e participantes Pix) e o site do BCB (informes SPI/STR). | Sai: o site passa a buscar os dados direto. |
| `simulador-fichas-bacen` (público) | Simulador do balde de fichas do DICT. Já foi refeito em 11/10 na branch `feat/regra-dict-e-testes`: regra pura com fontes, 48 testes unitários e 22 E2E, CI. | Entra como página nova do site. |

**Verificado:**
- O navegador consegue chamar a BrasilAPI (`Access-Control-Allow-Origin: *`) e o endpoint de informes do BCB (que libera `https://bacentools.web.app`).
- Por isso a API do Fly.io não é necessária, e o site fica 100% estático e gratuito.

## Como fica o site

```
bacentools.web.app
├── /                      início: o que é e cartões para cada ferramenta
├── /bancos                bancos por ISPB, COMPE ou nome (BrasilAPI)
├── /participantes-pix     participantes do Pix: modalidade, tipo e início da operação (BrasilAPI)
├── /informes              Informes SPI e STR com link para o PDF (BCB)
└── /simulador-dict        simulador do balde de fichas do DICT (regra local, sem rede)
```

Ferramentas que podem vir depois, citadas no README antigo da API e sem compromisso de data:
- validador de chave Pix;
- decodificador de QR Code Pix (BR Code/EMV);
- calculadora de dígito do endToEndId;
- decodificador de JWT.

## Fases

### Fase 1: fundação no `bacentools-front`
- Conferir se o build atual passa e se o deploy do Firebase funciona a partir desta máquina.
- Atualizar Next.js e MUI para as versões estáveis atuais e corrigir o `npm audit`.
- Adicionar ESLint de verdade (hoje o build ignora o lint), Vitest e Playwright.
- Criar a CI no GitHub Actions: lint, tipos, testes unitários, build, E2E e deploy no Firebase quando houver push na `main`.

### Fase 2: tirar a dependência da API
- `services/` passa a chamar a BrasilAPI e o BCB direto, com cache do React Query e mensagem amigável se a fonte cair.
- Os dados ganham tipos e testes, com fixtures gravadas para os testes não dependerem da rede.
- **Opcional, para resiliência:** uma GitHub Action diária salva uma cópia (JSON) de bancos e participantes no próprio site. Se a BrasilAPI cair, o site usa essa cópia.

### Fase 3: páginas
- **`/participantes-pix`:** sai do "em breve" e ganha busca e filtros por modalidade e tipo de instituição.
- **`/simulador-dict`:** recebe o simulador.
  - `src/domain/dict.ts` e os testes vêm sem mudança.
  - A tela é reescrita em MUI, no padrão do site.
  - Os 22 E2E são adaptados para a nova rota.
- **Início:** cartões das ferramentas, explicação curta e "para quem é".

### Fase 4: vitrine de QA
- **README:** link ao vivo, imagens, estratégia de testes (pirâmide, técnicas e ferramentas), badges de CI e cobertura, e a seção "bugs que os testes encontraram":
  - no simulador antigo, o Pix gastava ficha em vez de devolver;
  - os status 400 e 429 estavam trocados;
  - o balde do ISPB podia ficar negativo;
  - havia uma corrida entre cliques;
  - faltava contraste no balde inativo;
  - a tabela do celular não tinha foco pelo teclado.
- `docs/AVALIACAO_INICIAL.md` (do simulador) fica como registro de onde o trabalho começou.

### Fase 5: limpeza (só depois de o site novo estar no ar e conferido)
- Desligar a app `bacentools` no Fly.io (`fly apps destroy bacentools`).
- **Arquivar**, em vez de apagar, `bacentools` e `simulador-fichas-bacen` no GitHub. Os dois ficam só leitura, com o README apontando para o site e o repositório novos, e o histórico de commits continua visível como portfólio.
- Renomear `bacentools-front` → `bacentools`. Isso só é possível depois de liberar o nome; o GitHub redireciona os links antigos. Tornar o repositório **público**.

## Decisões em aberto (do Bruno)
1. Apagar ou arquivar os dois repositórios antigos. A recomendação é arquivar.
2. Nome final do repositório (sugestão: `bacentools`) e se ele vira público. A recomendação é público, por ser portfólio.
3. Manter Next.js + MUI, que já está no ar, ou migrar tudo para Vite + React. A recomendação é manter.
4. Fazer ou não a cópia diária dos dados (Fase 2, opcional).
