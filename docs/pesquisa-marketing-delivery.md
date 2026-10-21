# Pesquisa: marketing para delivery (Brasil, out/2026)

Base de pesquisa para a landing page de serviços de marketing para delivery (`src/app/page.tsx`).
Público-alvo da página: donos de restaurantes, hamburguerias, pizzarias, docerias, açaiterias e
dark kitchens que vendem por aplicativo e/ou WhatsApp.

> **Nota sobre as fontes:** grande parte do conteúdo setorial vem de blogs de plataformas e
> agências. Números de associações (Abrasel, Opinion Box, Fipe, CNDL) são tratados como os mais
> confiáveis; números de fornecedores ("+150% de pedidos", "ROAS 14x") **não** devem ser usados
> na página como se fossem resultados nossos.

---

## 1. Tamanho e dinâmica do mercado

| Dado | Valor | Fonte |
|---|---|---|
| Receita do delivery de comida no Brasil (2025, projeção) | ~US$ 21,2 bi; ~US$ 27,8 bi em 2029 (+7%/ano) | Statista via [ANR](https://anrbrasil.org.br/delivery-em-alta-mercado-deve-movimentar-mais-de-us-21-bilhoes-no-brasil-ate-o-fim-de-2025/) |
| Ecossistema iFood (2025) | R$ 167 bi movimentados, 0,70% do PIB (estudo Fipe) | [Movimento Econômico](https://movimentoeconomico.com.br/economia/emprego/2026/09/19/delivery-ecossistema-do-ifood-cresce-23-no-ne-e-ganha-peso-nos-pibs-estaduais/) |
| Crescimento de pedidos (2025) | +10% no ano; café da manhã +26,1%, lanche da tarde +15,4%, almoço +12,2%, jantar +8,6% | iFood via [Central do Varejo](https://centraldovarejo.com.br/habitos-de-consumo-no-delivery-mudam-no-brasil-aponta-ifood/) |
| Participação do iFood | ~92–93% (1º tri 2025, dados financeiros) | [Klavi](https://klavi.ai/blog/delivery-mercado-market-share-aplicativo-entrega) |
| Peso do delivery no faturamento do setor | 30% das vendas em 2025 (era 50% no pico da pandemia) | Abrasel via [Gironews](https://gironews.com/food-service/whatsapp-representa-26-do-faturamento-do-food-service-com-delivery/) |
| Divisão do faturamento de delivery por canal | Marketplaces 54% · WhatsApp 26% · app/site próprio 12% · telefone 8% | Abrasel (2.176 empresários) via [Mercado&Consumo](https://mercadoeconsumo.com.br/16/03/2025/foodservice/whatsapp-representa-26-do-faturamento-com-delivery-em-bares-e-restaurantes/) |
| Uso de canais | Marketplaces em 78% dos estabelecimentos; WhatsApp em 63% | Abrasel via [Bem Paraná](https://www.bemparana.com.br/noticias/economia/pesquisa-mostra-que-63-dos-estabelecimentos-com-delivery-usam-whatsapp-como-canal-de-vendas/) |
| Busca local | Buscas por "comida perto de mim" +99% no Brasil (2023→2024) | Google via [Consumidor Moderno](https://consumidormoderno.com.br/google-busca-restaurantes-brasil/) |

**Leitura:** o delivery é grande, ainda cresce e está concentrado em um app. Quase metade
do faturamento de delivery já passa por canais que o restaurante controla (WhatsApp, site,
telefone), o que dá sustentação a uma oferta de canal próprio.

### Concorrência entre apps (2025–2026)
- **99Food (DiDi):** voltou com comissão zero promocional; páginas de custo em set/2026 mostravam
  12% de comissão e mensalidade grátis ([Sisfood](https://www.sisfood.com.br/saiba-mais/delivery-integracoes/ifood-99food-keeta-taxas), [Brendi](https://brendi.com.br/comparativo-ifood-99food-keeta)).
- **Keeta (Meituan):** investimento anunciado de R$ 5,6 bi em 5 anos; o CEO diz que "taxa zero é
  insustentável" e promete comissão abaixo da média ([Exame](https://exame.com/negocios/o-plano-de-r-56-bilhoes-do-maior-delivery-do-mundo-para-o-brasil-taxa-zero-e-insustentavel/)).
- **Oportunidade:** o restaurante agora precisa decidir em quais apps estar e como operar em
  vários. Isso é um serviço que dá para vender: gestão multi-app.

## 2. A dor econômica: comissões

Valores aproximados; mudam por região e contrato, então confirme no Portal do Parceiro:

| Plano iFood | Comissão | Pagamento online | Mensalidade |
|---|---|---|---|
| Básico (entrega própria) | 12% | ~3,2% | ~R$ 100–110 (acima de R$ 1.800/mês) |
| Entrega (entregador iFood) | 23% | ~3,2% | ~R$ 130–150 |

Fontes: [Serasa](https://www.serasa.com.br/renda-extra/abrir-loja-no-ifood/), [Canaltech](https://canaltech.com.br/apps/como-vender-pelo-ifood/), [Diário do Pará](https://diariodopara.com.br/seu-bolso/veja-como-cadastrar-uma-loja-escolher-plano-e-calcular-taxas-no-ifood/), [MegaRestaurante](https://megarestaurante.net/blog/comissao-do-ifood-para-restaurantes).

**Plano Entrega ≈ 26% de cada pedido.** Em um restaurante que fatura R$ 30 mil/mês no app, isso
dá cerca de R$ 7,9 mil/mês só de taxas. É o argumento mais forte para o canal próprio, mas precisa
ser apresentado com honestidade: o canal próprio tem custos de entrega, gateway (~2–5%), software e
marketing ([SocialHub](https://www.socialhub.pro/blog/ifood-vs-delivery-proprio-restaurante-2026-comparativo-economico/)).

**Estratégia consensual do setor:** *app para conquistar, canal próprio para reter.* O cliente
novo chega pelo marketplace; a recompra vai para o WhatsApp e o cardápio digital ([Sisfood](https://sisfood.com.br/saiba-mais/delivery-integracoes/delivery-proprio-ifood), [Brendi](https://brendi.com.br/blog/ifood-whatsapp-pedidos-delivery/)).

## 3. Como o consumidor escolhe

| Comportamento | Dado | Fonte |
|---|---|---|
| Taxa de entrega | 79% já desistiram de uma compra por causa dela; entrega grátis é o fator nº 1 na escolha do app | [Opinion Box](https://blog.opinionbox.com/mercado-de-delivery-no-brasil/) (2023, n=2.067) |
| Avaliações ruins | 52% desistem de lojas mal avaliadas | Opinion Box |
| Nota mínima | 75% só pedem de lojas com nota ≥ 4,5 | AlmoçoGrátis/Galunion |
| Tempo | 45 min é o máximo aceitável para a maioria; 20 min de atraso = −33% de encantamento | [Food Connection](https://www.foodconnection.com.br/artigos/o-que-o-consumidor-considera-como-um-bom-servico-de-delivery/) |
| Embalagem | Higiene (72%), térmica (53%), sustentável (44%) | O Futuro do Food Service |
| Fotos no Google | Perfis com fotos recebem em média 35% mais cliques | [Google](https://blog.google/intl/pt-br/produtos/novos-recursos-na-busca-do-google-melhoram-experiencia-entre-restaurantes-e-plataformas-de-delivery/) |

**Leitura:** a decisão acontece em segundos, olhando foto, nota, taxa e tempo. O marketing de
delivery começa na operação (tempo e cancelamentos) e na vitrine (cardápio), antes do anúncio.

## 4. Alavancas de crescimento (o que o serviço entrega)

1. **Ranking no app.** O iFood personaliza a lista para cada cliente ([blog iFood](https://blog-parceiros.ifood.com.br/como-vender-mais-no-ifood/)).
   Os fatores mais citados: conversão (visita → pedido), avaliações, tempo de preparo real,
   cancelamentos/rupturas, fotos, organização do cardápio e participação em campanhas
   ([Comanda](https://agenciacomanda.com.br/blog/como-fazer-seu-restaurante-vender-mais-no-ifood-em-2026-10-estrategias-que-realmente-funcionam/), [Trend](https://blog.trendsuperapp.com.br/2026/07/25/algoritmo-do-ifood-o-que-realmente-determina-seu-ranking-e-c/)).
2. **Engenharia de cardápio.** O cardápio é a landing page do restaurante: carros-chefe no topo,
   nomes com termos que o cliente pesquisa, combos e adicionais para subir o ticket médio.
3. **Fotografia profissional.** Afeta a conversão no app e no Google. O número "vende 3–5x mais"
   aparece sem fonte, então não deve ser citado como fato.
4. **Promoções inteligentes.** Entrega grátis atrai cliente novo porque o frete é a principal causa
   de abandono de sacola. O custo precisa caber na margem.
5. **Mídia paga.** iFood Ads (CPC citado de R$ 0,20–0,80) captura quem já está no app; Meta/Google
   Ads leva quem ainda não abriu o app direto para o canal próprio. A verba de entrada citada no
   mercado fica em R$ 800–1.500/mês ([Tráfego Pago Pro](https://servicos.trafegopagopro.com/servicos/trafego-pago-ifood)).
6. **Canal próprio (WhatsApp + cardápio digital).** Usar a API oficial da Meta para evitar banimento;
   começar migrando ~10% do volume com incentivo para clientes recorrentes.
7. **CRM e recompra.** Segmentar clientes em novos, fiéis e inativos; acompanhar taxa de retorno e
   intervalo entre pedidos; automatizar o estímulo à 2ª compra e a reativação. O próprio iFood
   comprou 20% da CRMBonus em 2025, sinal de que retenção virou prioridade ([Baguete](https://www.baguete.com.br/public/noticias/ifood-adquire-20-da-crmbonus)).
8. **Google Perfil da Empresa / SEO local.** Botão "Pedir online", fotos, horários e avaliações.
   As buscas "perto de mim" estão em alta.
9. **Dayparts em alta.** Café da manhã e lanche da tarde são os períodos que mais crescem e
   têm menos concorrência no ranking.

## 5. Concorrência (agências de marketing para delivery)

- Quase ninguém publica preço. O padrão é diagnóstico gratuito → proposta.
- Referência pública: a Mibusca anuncia plano de entrada a **R$ 2.499/mês** (cardápio, fotos,
  precificação, relatórios), sem fidelidade longa ([Mibusca](https://www.mibusca.com.br/)).
- Ganchos usados: "quanto o iFood tira de você, em reais" e diagnóstico em 7 dias
  ([Ingage](https://www.ingagedigital.com.br/segmentos/gastronomia)); pacote de mídia
  multicanal ([Cooking Digital](https://cookingdigital.com.br/)).
- **Espaço para diferenciação:** transparência (o cliente é dono das contas de anúncio e do
  cardápio, recebe relatórios com pedidos por canal e não tem fidelidade) e foco em **margem**,
  não só em volume de pedidos.

## 6. Recomendações para a landing page

| Decisão | Motivo |
|---|---|
| Promessa central sobre **margem + pedidos + menos dependência** | É a dor nº 1 (≈26% por pedido) e diferencia de quem só promete "vender mais" |
| CTA principal no **WhatsApp** ("Quero meu diagnóstico gratuito") | 63% do setor já usa WhatsApp; é o canal natural do público; o diagnóstico é a oferta padrão de entrada |
| **Calculadora de comissão** interativa | Transforma a dor em um valor em reais (gancho comprovado pelos concorrentes) |
| Dados de mercado **com fonte** em vez de resultados inventados | Não temos cases ainda; números sem fonte destroem confiança |
| Serviços modulares + 3 planos "sob consulta" | Padrão do mercado; permite começar pequeno |
| Seção "como trabalhamos" com plano de 90 dias | Reduz o risco percebido; resultado no delivery leva de 30 a 90 dias |
| Garantias de transparência (sem fidelidade, contas no nome do cliente) | Responde às objeções mais comuns de quem já contratou agência |
| FAQ com objeções (verba, prazo, "já tenho iFood", multi-app) | Responde dúvidas antes do contato |
| Mobile-first, carregamento rápido, sem formulário longo | O dono de restaurante acessa pelo celular, muitas vezes no meio da operação |

### Pendências antes de publicar
- Número de WhatsApp real (`WHATSAPP_NUMBER` em `src/app/page.tsx`).
- Depoimentos/cases **reais**, com nome e autorização. A seção ficou de fora de propósito.
- Fotos reais de pratos/trabalhos (portfólio).
- Validar as taxas do iFood citadas na calculadora (mudam com frequência).
- Definir os preços dos planos ou manter "sob consulta".
