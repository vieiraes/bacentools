# Como contribuir

Contribuições são bem-vindas: correções, novas ferramentas para quem trabalha com Pix e com o Banco Central, melhorias nos testes e na documentação.

O BacenTools foi criado por **[Bruno Vieira](https://github.com/vieiraes)**. Ao contribuir, você concorda que sua contribuição será licenciada sob a [Apache 2.0](LICENSE). Quem redistribuir o projeto ou fizer uma versão derivada precisa manter o arquivo [NOTICE](NOTICE), com o crédito ao criador.

## Antes de começar
- **Ideias e bugs:** abra uma [issue](https://github.com/vieiraes/bacentools/issues/new/choose).
- **Ferramenta nova:** comece por uma issue de ideia, para alinhar o escopo antes do código.
- **Regras do Pix:** toda informação sobre o Pix precisa de **fonte oficial** (documento do BCB, com versão e seção). Veja como fizemos em [docs/pesquisa/erros-pix.md](docs/pesquisa/erros-pix.md). O que não estiver na fonte entra marcado como dedução, ou fica de fora.

## Rodando localmente
```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint && npm run typecheck
npm run coverage   # testes unitários com cobertura mínima
npm run e2e        # build estático + Playwright (desktop e celular)
```

## Padrões do projeto
- **Regras de negócio** ficam em `src/lib/domain`, como funções puras, com teste unitário.
- **Dados de fontes externas** passam por um schema zod em `src/lib/sources/schemas.ts` e ganham fixture real em `tests/fixtures`.
- **Toda tela nova** entra no teste de acessibilidade (`tests/e2e/qualidade.spec.ts`, WCAG 2.2 AA) e precisa funcionar no celular sem rolagem lateral.
- **E2E** não dependem da internet: use `mockSources` e as fixtures.
- **Textos da interface** são em português do Brasil, simples e diretos.

## Pull requests
1. Faça um fork e crie uma branch a partir da `main`.
2. Mantenha o PR pequeno e com um objetivo só.
3. A CI precisa passar: lint, tipos, testes unitários (cobertura mínima) e E2E.
4. Descreva o que muda e como foi testado; o modelo do PR já traz os itens.

## Conduta
Respeito acima de tudo. Seguimos o [Código de Conduta](CODE_OF_CONDUCT.md).
