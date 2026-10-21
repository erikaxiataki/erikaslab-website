"use client"

import { useState } from "react"

// Taxas aproximadas do iFood (out/2026). Confirmar no Portal do Parceiro.
const PLANS = {
  entrega: { label: "Plano Entrega (entregador do app)", rate: 0.23 + 0.032 },
  basico: { label: "Plano Básico (entrega própria)", rate: 0.12 + 0.032 },
} as const

// Custo estimado do pedido direto: gateway de pagamento + software.
const DIRECT_RATE = 0.05

type PlanKey = keyof typeof PLANS

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

export function CommissionCalculator() {
  const [revenue, setRevenue] = useState(30000)
  const [plan, setPlan] = useState<PlanKey>("entrega")
  const [migrated, setMigrated] = useState(20)

  const rate = PLANS[plan].rate
  const fees = revenue * rate
  const savings = revenue * (migrated / 100) * (rate - DIRECT_RATE)

  return (
    <div className="grid gap-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-8 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Faturamento mensal no app</span>
          <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3 focus-within:ring-3 focus-within:ring-ring/50">
            <span className="text-muted-foreground">R$</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={revenue}
              onChange={(e) => setRevenue(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent text-lg font-semibold outline-none"
            />
          </div>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Seu plano no iFood</legend>
          {(Object.keys(PLANS) as PlanKey[]).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 has-checked:border-brand has-checked:bg-brand/5"
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="plan"
                  checked={plan === key}
                  onChange={() => setPlan(key)}
                  className="accent-brand"
                />
                <span className="text-sm">{PLANS[key].label}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">
                ~{(PLANS[key].rate * 100).toFixed(1).replace(".", ",")}%
              </span>
            </label>
          ))}
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="flex justify-between text-sm font-medium">
            <span>Pedidos que migram para o canal próprio</span>
            <span className="tabular-nums">{migrated}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={migrated}
            onChange={(e) => setMigrated(Number(e.target.value))}
            className="accent-brand"
          />
        </label>
      </div>

      <div className="flex flex-col justify-between gap-6 rounded-2xl bg-brand-soft p-6">
        <div>
          <p className="text-sm text-muted-foreground">Você paga ao app, por mês</p>
          <p className="text-4xl font-bold tracking-tight tabular-nums">{brl.format(fees)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {brl.format(fees * 12)} por ano em comissões e taxas
          </p>
        </div>
        <div className="border-t border-foreground/10 pt-6">
          <p className="text-sm text-muted-foreground">
            Levando {migrated}% da recompra para o WhatsApp, você economiza
          </p>
          <p className="text-4xl font-bold tracking-tight text-brand tabular-nums">
            {brl.format(savings)}
            <span className="text-base font-medium text-muted-foreground">/mês</span>
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Estimativa com taxas públicas aproximadas do iFood (comissão + 3,2% de pagamento online)
          e custo de ~5% no pedido direto. Não inclui mensalidade, entrega própria nem marketing.
          No diagnóstico, refazemos a conta com os seus números reais.
        </p>
      </div>
    </div>
  )
}
