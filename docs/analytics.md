# Analytics do BacenTools

Tudo é do Google e gratuito: **Google Analytics 4** (propriedade ligada ao projeto Firebase `bacentools`, ID `G-69FZL5N4D5`), **Looker Studio** para o painel e **Search Console** para o SEO. Nada fica público: os três exigem login na conta Google do administrador.

## O que é coletado

**Automático, pela "medição otimizada" do GA4:**
- páginas vistas, inclusive navegação dentro do site;
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
| `select_content` | Escolheu um código de erro, filtro, tipo ou ano de informe | `content_type`, `item_id` |
| `scenario_play` | Rodou a animação de um cenário do Pix | `item_id`, `mode` |
| `simulator_action` | Consulta 200/404 ou Pix enviado no simulador do DICT | `action`, `key_type` |
| `copy_ispb` | Copiou um ISPB | `item_id` |
| `file_download` | Abriu o PDF de um informe do BCB | `file_name`, `link_url`, `area` |
| `source_fallback` | A BrasilAPI caiu e o site usou a cópia diária | `source` |
| `consent_choice` | Aceitou ou recusou o aviso de cookies | `choice` |
| `generate_lead` | Deixou contato (newsletter ou contratação) | `lead_type`, `perfil` |
| `contact_click` | Clicou no e-mail, LinkedIn ou site do criador | `channel` |

**LGPD:** o Consent Mode v2 começa **negado**. Antes do aceite, o GA4 recebe só sinais sem cookies (`gcs=G100`), que o Google usa na modelagem. Depois do aceite, a medição é completa (`gcs=G101`). Anúncios ficam sempre negados.

## Passo a passo no GA4 (uma vez, uns 10 minutos)

Entre em **analytics.google.com** › propriedade **bacentools**:

1. **Admin › Fluxos de dados › bacentools › Medição otimizada:** confira se tudo está ligado, principalmente "Mudanças de página com base no histórico do navegador".
2. **Admin › Definições personalizadas › Criar dimensão personalizada.** Escopo: evento. Uma para cada:
   - `search_term`, `area`, `content_type`, `item_id`, `action`, `key_type`, `lead_type`, `perfil` e `channel`.
   - Sem isso, os parâmetros não aparecem nos relatórios. Só vale daqui para frente.
3. **Admin › Eventos-chave:** marque `generate_lead` e `contact_click`. Eles são as "conversões".
4. **Admin › Retenção de dados:** 14 meses.
5. **Admin › Links de produto › Search Console:** ligue o Search Console (passo seguinte) para ver por quais buscas do Google as pessoas chegam.

## Search Console (SEO)

1. Acesse **search.google.com/search-console**. A propriedade `https://bacentools.web.app` já está verificada pela meta tag do site.
2. Em **Sitemaps**, envie `https://bacentools.web.app/sitemap.xml`, com 83 endereços, sendo 75 de códigos de erro.
3. Em 2 a 4 semanas, o relatório **Desempenho** mostra as buscas que trazem gente (ex.: "AC06 pix"), as impressões e a posição.

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

Os contatos deixados no site ficam no **Firestore** do projeto `bacentools`, na região de São Paulo. A lista fica numa página do site protegida por login Google, e só o e-mail do administrador entra. As regras de segurança do banco garantem isso, não só a tela. Ver `firestore.rules` e a página `/admin/`.
