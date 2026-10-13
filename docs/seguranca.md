# Proteção contra abuso

O BacenTools não tem servidor: as ferramentas rodam no navegador de quem usa e não há API para limitar. O que existe para proteger:

| O quê | Como | Estado |
|---|---|---|
| Leads (newsletter e contato) no Firestore | `firestore.rules`: visitante só **cria** lead válido; só o administrador lê e apaga | Ativo |
| Robôs enchendo o Firestore | **Firebase App Check com reCAPTCHA v3** (invisível), carregado só quando alguém começa a preencher um formulário ou abre o `/admin/` | Ativo em modo **monitorar** desde 12/10/2026 |
| Gasto inesperado | Orçamento "BacenTools (Firebase)" de **R$ 10/mês** no Google Cloud (conta de faturamento 1): e-mail em 50%, 90%, 100% e na previsão de 100% | Ativo |
| Ferramentas (decodificadores, gerador, simulador, consultas) | Sem captcha, de propósito: rodam no navegador e não gastam nada do projeto | — |

## App Check

- Chave do site (pública): `src/lib/protecao.ts`. A chave secreta fica **só** no Firebase (App Check › Apps › bacentools › reCAPTCHA); nunca no repositório.
- Nota mínima do reCAPTCHA: 0,5. Validade do token: 24 h. Sem renovação automática (cada token consome a cota grátis).
- Os testes E2E usam um reCAPTCHA simulado (`tests/e2e/fixtures.ts`) e conferem que o lead sai com o cabeçalho `x-firebase-appcheck`.

### Próximo passo: exigir o token (a partir de 19/10/2026)

1. Firebase › App Check › APIs › **Cloud Firestore**: as "solicitações verificadas" devem estar perto de 100%.
2. Clique em **Aplicar**. A partir daí, gravação sem token válido é recusada.
3. Quem usa bloqueador que barra o reCAPTCHA não consegue enviar formulário (efeito esperado).

Pela API: `PATCH firebaseappcheck.googleapis.com/v1/projects/bacentools/services/firestore.googleapis.com?updateMask=enforcementMode` com `{"enforcementMode":"ENFORCED"}`.
