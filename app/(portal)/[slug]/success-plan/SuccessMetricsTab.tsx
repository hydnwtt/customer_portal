"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createSuccessMetric, updateSuccessMetric, deleteSuccessMetric } from "./actions"
import { MetricStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

interface Metric {
  id: string
  name: string
  description: string | null
  baselineValue: string | null
  targetValue: string | null
  currentValue: string | null
  status: MetricStatus
  ownerId: string | null
  owner: { id: string; name: string; email: string } | null
}

interface TeamMember {
  userId: string
  name: string
  email: string
}

interface Props {
  accountId: string
  mspId: string | null
  metrics: Metric[]
  isEditor: boolean
  teamMembers: TeamMember[]
}

const STATUS_COLORS: Record<MetricStatus, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  ON_TRACK: "bg-green-500/10 text-green-400",
  AT_RISK: "bg-amber-500/10 text-amber-400",
  ACHIEVED: "bg-primary/10 text-primary",
}

const STATUS_LABELS: Record<MetricStatus, string> = {
  NOT_STARTED: "Not Started",
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  ACHIEVED: "Achieved",
}

const EMPTY_FORM = {
  name: "",
  description: "",
  baselineValue: "",
  targetValue: "",
  currentValue: "",
  status: "NOT_STARTED" as MetricStatus,
  ownerId: "",
}

export default function SuccessMetricsTab({ accountId, mspId, metrics: initial, isEditor, teamMembers }: Props) {
  const [metrics, setMetrics] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(m: Metric) {
    setForm({
      name: m.name,
      description: m.description ?? "",
      baselineValue: m.baselineValue ?? "",
      targetValue: m.targetValue ?? "",
      currentValue: m.currentValue ?? "",
      status: m.status,
      ownerId: m.ownerId ?? "",
    })
    setEditingId(m.id)
    setShowForm(true)
  }

  function handleSubmit() {
    if (!mspId) return toast.error("MSP not found")
    startTransition(async () => {
      if (editingId) {
        const res = await updateSuccessMetric({ id: editingId, accountId, mspId, ...form })
        if (res.success) {
          setMetrics((prev) =>
            prev.map((m) =>
              m.id === editingId
                ? {
                    ...m,
                    ...form,
                    owner: teamMembers.find((t) => t.userId === form.ownerId)
                      ? { id: form.ownerId, name: teamMembers.find((t) => t.userId === form.ownerId)!.name, email: "" }
                      : null,
                  }
                : m
            )
          )
          toast.success("Metric updated")
        } else {
          toast.error(res.error)
        }
      } else {
        const res = await createSuccessMetric({ accountId, mspId, ...form })
        if (res.success) {
          setMetrics((prev) => [
            ...prev,
            {
              id: res.id,
              ...form,
              description: form.description || null,
              baselineValue: form.baselineValue || null,
              targetValue: form.targetValue || null,
              currentValue: form.currentValue || null,
              ownerId: form.ownerId || null,
              owner: null,
            },
          ])
          toast.success("Metric added")
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
      const res = await deleteSuccessMetric(id, accountId)
      if (res.success) {
        setMetrics((prev) => prev.filter((m) => m.id !== id))
        toast.success("Metric removed")
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
        <p className="text-sm text-muted-foreground">{metrics.length} metric{metrics.length !== 1 ? "s" : ""} defined</p>
        {isEditor && !showForm && (
          <button
            onClick={openAdd}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Add Metric
          </button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground">
            {editingId ? "Edit Metric" : "New Metric"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Metric Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Speed of Service" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
              <input className={inputClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this metric measure?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Baseline Value</label>
              <input className={inputClass} value={form.baselineValue} onChange={(e) => setForm((f) => ({ ...f, baselineValue: e.target.value }))} placeholder="Current state" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Target Value</label>
              <input className={inputClass} value={form.targetValue} onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))} placeholder="Goal" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Current Value</label>
              <input className={inputClass} value={form.currentValue} onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))} placeholder="Latest reading" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MetricStatus }))}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Owner</label>
              <select className={inputClass} value={form.ownerId} onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}>
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending || !form.name} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Saving…" : editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {metrics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No metrics defined yet. {isEditor ? "Add your first metric above." : ""}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Metric", "Baseline", "Target", "Current", "Status", "Owner", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {m.name}
                    {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.baselineValue ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.targetValue ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{m.currentValue ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_COLORS[m.status])}>
                      {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.owner?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {isEditor && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(m)} className="text-xs text-primary hover:underline">Edit</button>
                        <button onClick={() => handleDelete(m.id)} className="text-xs text-destructive hover:underline">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
