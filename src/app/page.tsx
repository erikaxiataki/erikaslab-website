import {
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  ChefHat,
  MapPin,
  Megaphone,
  MessageCircle,
  Repeat,
  Store,
} from "lucide-react"

import { CommissionCalculator } from "@/components/landing/commission-calculator"

// TODO: substituir pelo número real (DDI + DDD + número, só dígitos).
const WHATSAPP_NUMBER = "5500000000000"
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Quero um diagnóstico gratuito do meu delivery.",
)}`

const stats = [
  {
    value: "~26%",
    label: "de cada pedido fica com o app no plano com entrega",
    source: "Taxas públicas do iFood, 2026",
  },
  {
    value: "79%",
    label: "dos clientes já desistiram de um pedido por causa da taxa de entrega",
    source: "Opinion Box",
  },
  {
    value: "75%",
    label: "só pedem de restaurantes com nota 4,5 ou mais",
    source: "AlmoçoGrátis/Galunion",
  },
  {
    value: "26%",
    label: "do faturamento de delivery do setor já vem do WhatsApp",
    source: "Abrasel, 2025",
  },
]

const pains = [
  "Você vende bem, mas no fim do mês a comissão do app come a sua margem.",
  "Seu restaurante some no ranking do iFood e você não sabe por quê.",
  "Uma avaliação ruim derruba a nota, e com ela os pedidos.",
  "O cliente pede uma vez e não volta, ou volta só pelo app.",
  "Você já impulsionou post e não viu nenhum pedido a mais.",
]

const services = [
  {
    icon: Store,
    title: "Gestão de iFood e apps",
    description:
      "Otimizamos o cardápio, as campanhas, o tempo de preparo e as avaliações para subir no ranking e converter mais visitas em pedidos. Também no 99Food e no Keeta.",
  },
  {
    icon: ChefHat,
    title: "Engenharia de cardápio",
    description:
      "Organizamos o cardápio por categorias, colocamos os carros-chefe no topo, usamos nomes que o cliente pesquisa e montamos combos e adicionais para aumentar o ticket médio.",
  },
  {
    icon: Camera,
    title: "Fotos e conteúdo",
    description:
      "Fotografia de pratos para app, Google e Instagram, e Reels que dão fome e levam o cliente direto para o pedido.",
  },
  {
    icon: Megaphone,
    title: "Tráfego pago",
    description:
      "iFood Ads para quem já está no app. Meta e Google Ads para levar novos clientes direto para o seu canal, sem pagar comissão.",
  },
  {
    icon: MessageCircle,
    title: "Delivery próprio no WhatsApp",
    description:
      "Montamos seu cardápio digital e o atendimento automatizado na API oficial do WhatsApp, para o pedido cair direto com você.",
  },
  {
    icon: Repeat,
    title: "CRM e recompra",
    description:
      "Separamos seus clientes em novos, fiéis e sumidos. Mandamos mensagens automáticas para trazer o 2º pedido e reativar quem parou de pedir.",
  },
  {
    icon: MapPin,
    title: "Google e SEO local",
    description:
      "Deixamos seu Perfil da Empresa completo, com o botão “Pedir online”, fotos e avaliações. Quem busca “comida perto de mim” encontra você.",
  },
  {
    icon: BarChart3,
    title: "Relatórios de margem",
    description:
      "Todo mês você recebe pedidos, ticket, recompra e custo por canal. Medimos lucro, não curtidas.",
  },
]

const steps = [
  {
    title: "Diagnóstico gratuito",
    description:
      "Analisamos sua loja no app, seu Google e seu Instagram, e calculamos quanto o app tira de você em reais.",
  },
  {
    title: "Plano de 90 dias",
    description:
      "Definimos prioridades por impacto: primeiro o que traz pedido rápido, depois o que constrói margem.",
  },
  {
    title: "Execução",
    description:
      "Cardápio, fotos, campanhas e canal próprio no ar, com ajustes semanais acompanhando o ranking e a operação.",
  },
  {
    title: "Resultados",
    description:
      "Relatório mensal e reunião para decidir os próximos passos com base nos seus números.",
  },
]

const plans = [
  {
    name: "Vitrine",
    tagline: "Para quem quer vender mais no app",
    features: [
      "Gestão do iFood (e de outros apps)",
      "Engenharia de cardápio",
      "Gestão de avaliações",
      "Calendário de promoções",
      "Relatório mensal",
    ],
  },
  {
    name: "Crescimento",
    tagline: "App + aquisição de novos clientes",
    featured: true,
    features: [
      "Tudo do Vitrine",
      "iFood Ads e Meta Ads",
      "Google Perfil da Empresa",
      "Sessão de fotos trimestral",
      "Reunião mensal de resultados",
    ],
  },
  {
    name: "Margem",
    tagline: "Para depender menos do app",
    features: [
      "Tudo do Crescimento",
      "Delivery próprio no WhatsApp",
      "Cardápio digital",
      "CRM e campanhas de recompra",
      "Conteúdo para Reels",
    ],
  },
]

const guarantees = [
  "Sem fidelidade longa",
  "Contas de anúncio e cardápio no seu nome",
  "Relatório com pedidos por canal",
]

const faqs = [
  {
    q: "Já estou no iFood. Por que preciso de marketing?",
    a: "Estar no app não é o mesmo que aparecer. O ranking é personalizado e leva em conta conversão, avaliações, tempo de preparo e cancelamentos. Trabalhamos esses fatores e, ao mesmo tempo, criamos um canal onde a recompra não paga comissão.",
  },
  {
    q: "Vou ter que sair do iFood?",
    a: "Não. A estratégia que mais funciona é usar o app para conquistar clientes novos e o seu canal próprio para os pedidos de quem já conhece você. Os dois se completam.",
  },
  {
    q: "Quanto tempo até ver resultado?",
    a: "Ajustes de cardápio, fotos e promoções costumam aparecer nas primeiras semanas. Canal próprio e recompra crescem de forma consistente entre 60 e 90 dias. Por isso trabalhamos com um plano de 90 dias.",
  },
  {
    q: "Preciso investir em anúncios?",
    a: "Não é obrigatório. Muitos restaurantes crescem primeiro com cardápio, fotos e ranking. Quando faz sentido anunciar, recomendamos uma verba que caiba no seu caixa e medimos o retorno em pedidos.",
  },
  {
    q: "E o 99Food e o Keeta?",
    a: "Avaliamos se vale a pena entrar em cada app na sua cidade, comparando taxas, condições promocionais e demanda, e gerenciamos as lojas junto com o iFood.",
  },
  {
    q: "Atendem que tipo de negócio?",
    a: "Restaurantes, hamburguerias, pizzarias, marmitarias, docerias, açaiterias, cafeterias e dark kitchens. Atendemos do negócio de bairro à rede com várias unidades.",
  },
]

function WhatsAppButton({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:outline-none ${className}`}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden />
    </a>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-lg text-pretty text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="text-lg font-bold tracking-tight">
            Erika&apos;s <span className="text-brand">Lab</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#servicos" className="hover:text-foreground">Serviços</a>
            <a href="#calculadora" className="hover:text-foreground">Calculadora</a>
            <a href="#como-funciona" className="hover:text-foreground">Como funciona</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
            <a href="#faq" className="hover:text-foreground">Dúvidas</a>
          </nav>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/85"
          >
            Falar no WhatsApp
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--brand-soft),transparent)]" />
          <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              Marketing especializado em delivery
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Mais pedidos, mais margem e{" "}
              <span className="text-brand">menos dependência do app.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              Colocamos seu restaurante no topo do iFood, trazemos clientes novos e levamos a
              recompra para o seu WhatsApp, onde você não paga comissão.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <WhatsAppButton className="w-full sm:w-auto">Quero meu diagnóstico gratuito</WhatsAppButton>
              <a
                href="#calculadora"
                className="inline-flex w-full items-center justify-center rounded-full border px-6 py-3.5 font-semibold transition hover:bg-muted sm:w-auto"
              >
                Calcular quanto o app me custa
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {guarantees.map((g) => (
                <li key={g} className="flex items-center gap-1.5">
                  <Check className="size-4 text-brand" aria-hidden />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Dados de mercado */}
        <section aria-label="Dados do mercado de delivery" className="border-y bg-muted/40">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.value + s.label} className="px-2 py-10 sm:px-6">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">{s.value}</dd>
                <dd className="mt-2 text-sm text-foreground">{s.label}</dd>
                <dd className="mt-1 text-xs text-muted-foreground">Fonte: {s.source}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Dores */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold tracking-wide text-brand uppercase">Você se identifica?</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Vender muito não é o mesmo que lucrar muito
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No delivery, o cliente decide em segundos, olhando foto, nota, taxa de entrega e
                tempo. E o restaurante paga caro por cada pedido. Marketing de delivery é cuidar
                das duas coisas ao mesmo tempo.
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {pains.map((p) => (
                <li key={p} className="flex gap-3 rounded-2xl border bg-card p-4">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                    !
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Serviços */}
        <section id="servicos" className="scroll-mt-16 bg-muted/40 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Serviços"
              title="Tudo o que o seu delivery precisa para crescer"
              description="Contrate só o que faz sentido agora e adicione o resto conforme o negócio cresce."
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ icon: Icon, title, description }) => (
                <article key={title} className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Calculadora */}
        <section id="calculadora" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6">
          <SectionHeading
            eyebrow="Calculadora"
            title="Quanto o app leva do seu faturamento?"
            description="Coloque seus números e veja quanto sobra no seu caixa quando parte da recompra vem pelo seu canal."
          />
          <div className="mt-12">
            <CommissionCalculator />
          </div>
          <div className="mt-8 text-center">
            <WhatsAppButton>Quero essa conta com meus números reais</WhatsAppButton>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="scroll-mt-16 bg-foreground py-24 text-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold tracking-wide text-brand uppercase">Como funciona</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Um plano de 90 dias, do diagnóstico ao resultado
              </h2>
            </div>
            <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <li key={step.title} className="flex flex-col gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand font-bold text-brand-foreground">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-background/70">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6">
          <SectionHeading
            eyebrow="Planos"
            title="Escolha por onde começar"
            description="Valores sob medida, conforme o número de unidades, os apps e a verba de mídia. Sem fidelidade longa."
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-8 ${
                  plan.featured ? "border-brand bg-brand-soft shadow-lg" : "bg-card"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                    Mais escolhido
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <p className="mt-6 text-2xl font-bold">Sob consulta</p>
                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-brand text-brand-foreground hover:bg-brand/90"
                      : "border hover:bg-muted"
                  }`}
                >
                  Pedir proposta
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 bg-muted/40 py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="Dúvidas" title="Perguntas frequentes" />
            <div className="mt-12 flex flex-col gap-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-2xl border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                    {faq.q}
                    <span className="text-xl text-brand transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="rounded-3xl bg-brand px-6 py-16 text-center text-brand-foreground sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Descubra em 15 minutos onde o seu delivery está perdendo dinheiro
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-brand-foreground/85">
              Diagnóstico gratuito da sua loja no app, do Google e do Instagram, sem compromisso.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-7 py-4 font-semibold text-foreground transition hover:bg-background/90"
            >
              <MessageCircle className="size-5" aria-hidden />
              Chamar no WhatsApp
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} Erika&apos;s Lab · Marketing para delivery
          </p>
          <p className="max-w-md text-xs">
            iFood, 99Food e Keeta são marcas de seus respectivos donos. Não temos vínculo com as
            plataformas. Dados de mercado das fontes citadas.
          </p>
        </div>
      </footer>
    </>
  )
}
