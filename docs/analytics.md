# Analytics do BacenTools

Tudo é do Google e gratuito: **Google Analytics 4** (propriedade ligada ao projeto Firebase `bacentools`, ID `G-69FZL5N4D5`), **Looker Studio** para o painel e **Search Console** para o SEO. Nada fica público: os três exigem login na conta Google do administrador.

## Regras (LGPD)

Implementado em 27/10/2026, no mesmo modelo do RTQuímico:

| Regra | Onde |
|---|---|
| **Nada do Google carrega antes do Aceitar** no aviso de cookies. Sem aceite, não há `gtag`, `dataLayer` nem pedido ao `googletagmanager.com`. | `registrarVisita()` em `src/lib/analytics.ts` |
| O painel `/admin/` nunca é medido (abrir direto nele nem carrega o GA; ir para ele trava a medição até sair). | `paginaMedida()` |
| Vai só o caminho da página e os parâmetros de campanha `utm_*` (de onde veio a visita); o resto da `?` e o `#` não vão. O decodificador recebe o código Pix inteiro em `?codigo=`, e ele não sai do navegador. | `gtag('set', { page_location })` |
| Sem Google Signals, sem sinais de anúncio, cookie `_ga` de 13 meses. | `carregar()` |
| Recusar depois de ter aceitado para a medição na hora e apaga os cookies `_ga`. | `desligarAnalytics()` |
| Aviso com **Recusar** e **Aceitar**, versão `2` na chave `bt-aviso-cookies` do navegador. Quem respondeu o aviso antigo (`bt_consent_v1`) é perguntado de novo. Reabre por **Preferências de cookies** no rodapé e na página de privacidade. | `src/components/Analytics.tsx` |

**ID do GA:** `NEXT_PUBLIC_GA_ID` no `.env.production` (versionado, o ID é público), lido só pelo build de produção (`npm run build`, CI e E2E). No `npm run dev` fica vazio e nada é carregado, para visita de teste não entrar no relatório. Nos E2E, a rede do Google é simulada e os eventos são conferidos no `window.dataLayer`.

## O que é coletado

**Pelo próprio site:** `page_view` a cada troca de página, com o caminho e o título.

**Automático, pela "medição otimizada" do GA4:**
- tempo de engajamento;
- rolagem;
- cliques em links externos;
- downloads de PDF;
- origem da visita (Google, LinkedIn, direto…);
- cidade, estado, aparelho e navegador.

**Eventos do site** (em `src/lib/analytics.ts`, todos com nomes estáveis):

| Evento | Quando | Parâmetros |
|---|---|---|
| `search` | Busca em bancos, participantes, informes e catálogo de erros (só quando a pessoa para de digitar) | `search_term`, `area` |
| `select_content` | Escolheu um código de erro, filtro, tipo ou ano de informe, mensagem do SPB (`mensagem_spb`) ou cenário da TED (`cenario_ted`) | `content_type`, `item_id` |
| `scenario_play` | Rodou a animação de um cenário do Pix | `item_id`, `mode` |
| `simulator_action` | Consulta 200/404 ou Pix enviado no simulador do DICT | `action`, `key_type` |
| `copy_ispb` | Copiou um ISPB | `item_id` |
| `generate_brcode` | Copiou ou baixou um QR Code do gerador (a chave não é enviada) | `action` (copiar, baixar_png), `key_type`, `item_id` (com_valor, sem_valor) |
| `decode` | Colou algo no decodificador de QR Code Pix, de EndToEndId/UUID ou no validador de XML da TED (`area` = xml-spb) (só quando para de digitar; o código colado não é enviado) | `area` (brcode, identificador), `item_id` (tipo), `result` |
| `file_download` | Abriu o PDF de um informe do BCB | `file_name`, `link_url`, `area` |
| `source_fallback` | A BrasilAPI caiu e o site usou a cópia diária | `source` |
| `consent_choice` | Aceitou o aviso de cookies (quem recusa não é medido, então a recusa não aparece) | `choice` (`granted`) |
| `generate_lead` | Deixou contato (newsletter ou contratação) | `lead_type`, `perfil` |
| `contact_click` | Clicou no e-mail, LinkedIn ou site do criador | `channel` |

**Números a partir de 27/10/2026:** antes, o GA recebia sinais sem cookie de quem não aceitava e o Google estimava essas visitas. Agora só conta quem aceita, então usuários e sessões caem nos relatórios. Não é queda de audiência.

## Passo a passo no GA4 (uma vez, uns 10 minutos)

Entre em **analytics.google.com** › propriedade **bacentools** › **Administrador** (engrenagem):

1. **Fluxos de dados › bacentools › Medição otimizada › engrenagem:** **desligue** "Mudanças de página com base no histórico do navegador". O site manda a visita sozinho; ligado, conta em dobro e leva a query da URL. Deixe o resto ligado (rolagem, cliques de saída, downloads).
2. **Coleta e modificação de dados › Coleta de dados:** deixe **Google Signals** desligado.
3. **Definições personalizadas › Criar dimensão personalizada.** Escopo: evento. Uma para cada:
   - `search_term`, `area`, `content_type`, `item_id`, `action`, `key_type`, `lead_type`, `perfil`, `channel` e `result`.
   - Sem isso, os parâmetros não aparecem nos relatórios. Só vale daqui para frente.
4. **Eventos-chave:** marque `generate_lead` e `contact_click`. Eles são as "conversões".
5. **Coleta e modificação de dados › Retenção de dados:** "Retenção de dados de eventos" em **14 meses** › Salvar (a página de privacidade promete 14 meses).
6. **Links de produto › Search Console:** ligue o Search Console (passo seguinte) para ver por quais buscas do Google as pessoas chegam.

## Search Console (SEO)

1. Acesse **search.google.com/search-console**. A propriedade `https://bacentools.web.app` já está verificada pela meta tag do site.
2. Em **Sitemaps**, envie `https://bacentools.web.app/sitemap.xml`, com 420 endereços: 75 códigos de erro do Pix e 325 do SPB. Se já estava enviado, clique nele e em **Reenviar**.
3. Opcional: em **Inspeção de URL**, cole `https://bacentools.web.app/` › **Solicitar indexação**, para o Google ler o cabeçalho novo.
4. Em 2 a 4 semanas, o relatório **Desempenho** mostra as buscas que trazem gente (ex.: "AC06 pix"), as impressões e a posição.

## O que cada página leva para o Google

| Parte | Onde |
|---|---|
| Título, descrição, canonical, Open Graph e cartão `summary_large_image` | `metaPagina()` e `metaFerramenta()` em `src/lib/seo.ts`. Toda página nova usa um dos dois: no Next, o `openGraph` da página substitui o do layout, e sem eles a página herda o `og:url` da inicial e fica sem imagem. |
| Imagem de prévia (WhatsApp, LinkedIn) | `public/og-bacentools.png`, 1200×630 |
| Dados estruturados | `WebSite` na inicial, `WebApplication` grátis em cada ferramenta (pelo `PageHeader`), `FAQPage`/`DefinedTerm` nas páginas de erro |
| Ícones e manifest | `src/app/favicon.ico`, `icon.png`, `apple-icon.png`, `src/app/manifest.ts` (sem service worker) |
| Fora do Google | `/admin/` com `noindex`, bloqueado no `robots.txt` e fora do sitemap |

## Painel no Looker Studio (grátis)

1. Acesse **lookerstudio.google.com › Criar › Relatório › Google Analytics** e escolha a propriedade **bacentools**.
2. Monte as páginas abaixo. Cada item é um gráfico, e o relatório fica privado. Você pode compartilhar só com quem quiser.

| Página do painel | Gráficos |
|---|---|
| **Visão geral** | Usuários e sessões por dia · Tempo médio de engajamento · Páginas mais vistas · Usuários novos × recorrentes |
| **De onde vêm** | Mapa por estado e cidade · Origem/mídia (google, linkedin, direto) · Aparelho (celular × computador) |
| **O que usam** | Eventos por nome · Top `item_id` de `select_content` (códigos de erro mais procurados) · Top `search_term` por `area` (o que buscam e não acham) · `simulator_action` por `action` |
| **SEO** (fonte: Search Console) | Consultas · Cliques · Impressões · Posição média · Páginas `/erros-pix/` que mais trazem visitas |
| **Leads** | `generate_lead` por dia e por `lead_type` · Taxa = `generate_lead` ÷ usuários · `contact_click` por `channel` |

3. Em **Compartilhar › Programar envio por e-mail**, peça o relatório toda segunda-feira em PDF no seu e-mail.

## Leads

**Onde entram:** newsletter "Mudou no Pix" na página inicial (e-mail + perfil) e formulário de contato/contratação em `/sobre/`. Cada envio gera o evento `generate_lead` no GA4, sem o e-mail.

**Onde ficam:** coleção `leads` do **Firestore** do projeto `bacentools`, região `southamerica-east1` (São Paulo).

**Como ver:** acesse **https://bacentools.web.app/admin/** e clique em **Entrar com Google** com a conta `vieira.es@gmail.com`. O painel mostra totais por tipo e perfil, filtros, busca, exclusão (pedido LGPD) e exportação em CSV (abre direto no Excel). O painel fica fora do Google (`noindex`, `robots.txt`, fora do sitemap).

**Quem protege:** as regras em `firestore.rules`, não a tela. Qualquer visitante só consegue **criar** um lead válido (campos permitidos, e-mail no formato, consentimento marcado, data do servidor). Ler, alterar e apagar: só a conta do administrador, com e-mail verificado. Robôs que preenchem o campo-isca são descartados no navegador.

**Publicar mudanças nas regras:** `firebase deploy --only firestore:rules --project bacentools`.

**Atenção:** nas regras do Firestore, `\\s` dentro de `matches()` não é "espaço", é uma barra seguida de "s". Use classes como `[.]` e `[^@ ]`.
