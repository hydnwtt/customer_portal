/**
 * Shared layout for all ROI calculators.
 * Two-panel: inputs on left, outputs on right.
 */
import React from "react"

export function CalcLayout({
  inputs,
  outputs,
}: {
  inputs: React.ReactNode
  outputs: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Inputs
        </p>
        {inputs}
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          Results
        </p>
        {outputs}
      </div>
    </div>
  )
}

export function CalcInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  readOnly,
  type = "number",
  min,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  readOnly?: boolean
  type?: string
  min?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <div className="flex items-center rounded-md border border-border bg-input overflow-hidden">
        {prefix && (
          <span className="px-2 py-2 text-sm text-muted-foreground bg-muted/30 border-r border-border">
            {prefix}
          </span>
        )}
        <input
          type={type}
          min={min ?? 0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          readOnly={readOnly}
          className="flex-1 px-3 py-2 text-sm text-foreground bg-transparent focus:outline-none"
        />
        {suffix && (
          <span className="px-2 py-2 text-sm text-muted-foreground bg-muted/30 border-l border-border">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export function CalcResult({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={highlight ? "rounded-lg bg-primary/10 p-3" : ""}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

export function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

export function fmtN(n: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(n)
}
