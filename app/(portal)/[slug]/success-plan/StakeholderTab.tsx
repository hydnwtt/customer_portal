"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createStakeholder, updateStakeholder, deleteStakeholder } from "./actions"
import { StakeholderCompany, InvolvementLevel } from "@prisma/client"
import { cn, formatDate } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

interface Stakeholder {
  id: string
  name: string
  company: StakeholderCompany
  title: string | null
  email: string
  phone: string | null
  involvementLevel: InvolvementLevel
  lastEngagedAt: string | null
  notes: string | null
}

interface Props {
  accountId: string
  stakeholders: Stakeholder[]
  isEditor: boolean
  isInternal: boolean
}

const INVOLVEMENT_LABELS: Record<InvolvementLevel, string> = {
  DECISION_MAKER: "Decision Maker",
  CHAMPION: "Champion",
  INFLUENCER: "Influencer",
  INFORMED: "Informed",
}

const INVOLVEMENT_COLORS: Record<InvolvementLevel, string> = {
  DECISION_MAKER: "bg-primary/10 text-primary",
  CHAMPION: "bg-green-500/10 text-green-400",
  INFLUENCER: "bg-amber-500/10 text-amber-400",
  INFORMED: "bg-muted text-muted-foreground",
}

const EMPTY_FORM = {
  name: "",
  company: "CUSTOMER" as StakeholderCompany,
  title: "",
  email: "",
  phone: "",
  involvementLevel: "INFORMED" as InvolvementLevel,
  lastEngagedAt: "",
  notes: "",
}

function isStale(lastEngagedAt: string | null): boolean {
  if (!lastEngagedAt) return true
  const days = Math.floor((Date.now() - new Date(lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24))
  return days > 14
}

export default function StakeholderTab({ accountId, stakeholders: initial, isEditor, isInternal }: Props) {
  const [stakeholders, setStakeholders] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(s: Stakeholder) {
    setForm({
      name: s.name,
      company: s.company,
      title: s.title ?? "",
      email: s.email,
      phone: s.phone ?? "",
      involvementLevel: s.involvementLevel,
      lastEngagedAt: s.lastEngagedAt ? s.lastEngagedAt.slice(0, 10) : "",
      notes: s.notes ?? "",
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      if (editingId) {
        const res = await updateStakeholder({ id: editingId, accountId, ...form })
        if (res.success) {
          setStakeholders((prev) =>
            prev.map((s) =>
              s.id === editingId
                ? {
                    ...s,
                    ...form,
                    title: form.title || null,
                    phone: form.phone || null,
                    notes: form.notes || null,
                    lastEngagedAt: form.lastEngagedAt ? new Date(form.lastEngagedAt).toISOString() : null,
                  }
                : s
            )
          )
          toast.success("Stakeholder updated")
        } else {
          toast.error(res.error)
        }
      } else {
        const res = await createStakeholder({ accountId, ...form })
        if (res.success) {
          setStakeholders((prev) => [
            ...prev,
            {
              id: res.id,
              ...form,
              title: form.title || null,
              phone: form.phone || null,
              notes: form.notes || null,
              lastEngagedAt: form.lastEngagedAt ? new Date(form.lastEngagedAt).toISOString() : null,
            },
          ])
          toast.success("Stakeholder added")
        } else {
          toast.error(res.error)
        }
      }
      setShowForm(false)
      setEditingId(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteStakeholder(id, accountId)
      if (res.success) {
        setStakeholders((prev) => prev.filter((s) => s.id !== id))
        toast.success("Stakeholder removed")
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
        <p className="text-sm text-muted-foreground">{stakeholders.length} stakeholder{stakeholders.length !== 1 ? "s" : ""}</p>
        {isEditor && !showForm && (
          <button
            onClick={openAdd}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Add Stakeholder
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground">
            {editingId ? "Edit Stakeholder" : "New Stakeholder"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@company.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title / Role</label>
              <input className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="VP of Operations" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
              <input className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Company</label>
              <select className={inputClass} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value as StakeholderCompany }))}>
                <option value="CUSTOMER">Customer</option>
                <option value="INTERNAL">Internal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Involvement Level</label>
              <select className={inputClass} value={form.involvementLevel} onChange={(e) => setForm((f) => ({ ...f, involvementLevel: e.target.value as InvolvementLevel }))}>
                {Object.entries(INVOLVEMENT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Last Engaged</label>
              <input type="date" className={inputClass} value={form.lastEngagedAt} onChange={(e) => setForm((f) => ({ ...f, lastEngagedAt: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
              <input className={inputClass} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending || !form.name || !form.email} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Saving…" : editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}

      {stakeholders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No stakeholders yet. {isEditor ? "Add the key contacts for this pilot." : ""}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Name", "Company", "Involvement", "Last Engaged", ...(isEditor ? [""] : [])].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stakeholders.map((s) => {
                const stale = isStale(s.lastEngagedAt)
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{s.name}</p>
                      {s.title && <p className="text-xs text-muted-foreground">{s.title}</p>}
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.company === "CUSTOMER" ? "Customer" : "Internal"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", INVOLVEMENT_COLORS[s.involvementLevel])}>
                        {INVOLVEMENT_LABELS[s.involvementLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {stale && isInternal && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className={cn("text-sm", stale && isInternal ? "text-amber-400" : "text-muted-foreground")}>
                          {s.lastEngagedAt ? formatDate(s.lastEngagedAt) : "Never"}
                        </span>
                      </div>
                    </td>
                    {isEditor && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(s)} className="text-xs text-primary hover:underline">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="text-xs text-destructive hover:underline">Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
