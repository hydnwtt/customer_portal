"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createObjection, updateObjection, deleteObjection } from "./actions"
import { ObjectionCategory, ObjectionStatus } from "@prisma/client"
import { cn, formatDate } from "@/lib/utils"

interface Objection {
  id: string
  objection: string
  raisedBy: string | null
  dateRaised: string
  category: ObjectionCategory
  status: ObjectionStatus
  resolutionNotes: string | null
  owner: string | null
}

interface Props {
  accountId: string
  objections: Objection[]
}

const CATEGORY_LABELS: Record<ObjectionCategory, string> = {
  PRICING: "Pricing",
  PRODUCT_GAP: "Product Gap",
  COMPETITOR: "Competitor",
  TIMELINE: "Timeline",
  INTERNAL_CHAMPION: "Internal Champion",
  OTHER: "Other",
}

const STATUS_COLORS: Record<ObjectionStatus, string> = {
  OPEN: "bg-destructive/10 text-destructive",
  IN_PROGRESS: "bg-amber-500/10 text-amber-400",
  RESOLVED: "bg-green-500/10 text-green-400",
}

const EMPTY_FORM = {
  objection: "",
  raisedBy: "",
  dateRaised: new Date().toISOString().slice(0, 10),
  category: "OTHER" as ObjectionCategory,
  status: "OPEN" as ObjectionStatus,
  resolutionNotes: "",
  owner: "",
}

export default function ObjectionTrackerClient({ accountId, objections: initial }: Props) {
  const [objections, setObjections] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(o: Objection) {
    setForm({
      objection: o.objection,
      raisedBy: o.raisedBy ?? "",
      dateRaised: o.dateRaised.slice(0, 10),
      category: o.category,
      status: o.status,
      resolutionNotes: o.resolutionNotes ?? "",
      owner: o.owner ?? "",
    })
    setEditingId(o.id)
    setShowForm(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      if (editingId) {
        const res = await updateObjection({ id: editingId, accountId, ...form })
        if (res.success) {
          setObjections((prev) =>
            prev.map((o) =>
              o.id === editingId
                ? {
                    ...o,
                    ...form,
                    raisedBy: form.raisedBy || null,
                    resolutionNotes: form.resolutionNotes || null,
                    owner: form.owner || null,
                    dateRaised: new Date(form.dateRaised).toISOString(),
                  }
                : o
            )
          )
          toast.success("Objection updated")
        } else {
          toast.error(res.error)
        }
      } else {
        const res = await createObjection({ accountId, ...form })
        if (res.success) {
          setObjections((prev) => [
            {
              id: res.id,
              objection: form.objection,
              raisedBy: form.raisedBy || null,
              dateRaised: new Date(form.dateRaised).toISOString(),
              category: form.category,
              status: form.status,
              resolutionNotes: form.resolutionNotes || null,
              owner: form.owner || null,
            },
            ...prev,
          ])
          toast.success("Objection logged")
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
      const res = await deleteObjection(id, accountId)
      if (res.success) {
        setObjections((prev) => prev.filter((o) => o.id !== id))
        toast.success("Objection removed")
      } else {
        toast.error(res.error)
      }
    })
  }

  const inputClass =
    "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  const openCount = objections.filter((o) => o.status === "OPEN").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {objections.length} total · {openCount} open
          </p>
          {openCount > 0 && (
            <p className="text-xs text-destructive mt-0.5">
              {openCount} unresolved objection{openCount !== 1 ? "s" : ""} need attention
            </p>
          )}
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Log Objection
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground">
            {editingId ? "Edit Objection" : "Log Objection"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Objection *</label>
              <textarea
                rows={2}
                className={`${inputClass} resize-none`}
                value={form.objection}
                onChange={(e) => setForm((f) => ({ ...f, objection: e.target.value }))}
                placeholder="What objection was raised?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Raised By</label>
              <input className={inputClass} value={form.raisedBy} onChange={(e) => setForm((f) => ({ ...f, raisedBy: e.target.value }))} placeholder="Stakeholder name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date Raised</label>
              <input type="date" className={inputClass} value={form.dateRaised} onChange={(e) => setForm((f) => ({ ...f, dateRaised: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ObjectionCategory }))}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ObjectionStatus }))}>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Owner</label>
              <input className={inputClass} value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder="Who is handling this?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Resolution Notes</label>
              <input className={inputClass} value={form.resolutionNotes} onChange={(e) => setForm((f) => ({ ...f, resolutionNotes: e.target.value }))} placeholder="How was this resolved?" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending || !form.objection} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Saving…" : editingId ? "Update" : "Log"}
            </button>
          </div>
        </div>
      )}

      {objections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No objections logged for this account yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {objections.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[o.status])}>
                      {o.status.replace("_", " ")}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[o.category]}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(o.dateRaised)}</span>
                    {o.raisedBy && (
                      <span className="text-xs text-muted-foreground">by {o.raisedBy}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{o.objection}</p>
                  {o.resolutionNotes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/60">Resolution:</span> {o.resolutionNotes}
                    </p>
                  )}
                  {o.owner && (
                    <p className="text-xs text-muted-foreground mt-0.5">Owner: {o.owner}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(o)} className="text-xs text-primary hover:underline">Edit</button>
                  <button onClick={() => handleDelete(o.id)} className="text-xs text-destructive hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
