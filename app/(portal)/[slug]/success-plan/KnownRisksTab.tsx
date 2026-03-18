"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createRisk, deleteRisk } from "./actions"
import { RiskSeverity } from "@prisma/client"
import { cn } from "@/lib/utils"

interface Risk {
  id: string
  description: string
  severity: RiskSeverity
  mitigationPlan: string | null
  owner: string | null
}

interface Props {
  accountId: string
  mspId: string | null
  risks: Risk[]
  isEditor: boolean
}

const SEVERITY_COLORS: Record<RiskSeverity, string> = {
  HIGH: "bg-destructive/10 text-destructive",
  MEDIUM: "bg-amber-500/10 text-amber-400",
  LOW: "bg-green-500/10 text-green-400",
}

const EMPTY_FORM = {
  description: "",
  severity: "MEDIUM" as RiskSeverity,
  mitigationPlan: "",
  owner: "",
}

export default function KnownRisksTab({ accountId, mspId, risks: initial, isEditor }: Props) {
  const [risks, setRisks] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!mspId) return toast.error("MSP not found")
    startTransition(async () => {
      const res = await createRisk({ accountId, mspId, ...form })
      if (res.success) {
        setRisks((prev) => [
          ...prev,
          {
            id: res.id,
            description: form.description,
            severity: form.severity,
            mitigationPlan: form.mitigationPlan || null,
            owner: form.owner || null,
          },
        ])
        setForm(EMPTY_FORM)
        setShowForm(false)
        toast.success("Risk added")
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteRisk(id, accountId)
      if (res.success) {
        setRisks((prev) => prev.filter((r) => r.id !== id))
        toast.success("Risk removed")
      } else {
        toast.error(res.error)
      }
    })
  }

  const inputClass =
    "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{risks.length} risk{risks.length !== 1 ? "s" : ""} identified</p>
        {isEditor && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Add Risk
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground">New Risk</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Risk Description *</label>
              <textarea
                rows={2}
                className={`${inputClass} resize-none`}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the risk…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Severity</label>
              <select className={inputClass} value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as RiskSeverity }))}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Owner</label>
              <input className={inputClass} value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder="Who owns this risk?" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mitigation Plan</label>
              <textarea
                rows={2}
                className={`${inputClass} resize-none`}
                value={form.mitigationPlan}
                onChange={(e) => setForm((f) => ({ ...f, mitigationPlan: e.target.value }))}
                placeholder="How will this risk be mitigated?"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending || !form.description} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Saving…" : "Add Risk"}
            </button>
          </div>
        </div>
      )}

      {risks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No risks identified yet. {isEditor ? "Document known risks and mitigations above." : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", SEVERITY_COLORS[r.severity])}>
                      {r.severity}
                    </span>
                    {r.owner && (
                      <span className="text-xs text-muted-foreground">Owner: {r.owner}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground font-medium">{r.description}</p>
                  {r.mitigationPlan && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/60">Mitigation:</span> {r.mitigationPlan}
                    </p>
                  )}
                </div>
                {isEditor && (
                  <button onClick={() => handleDelete(r.id)} className="text-xs text-destructive hover:underline shrink-0">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
