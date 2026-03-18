"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createPhase, updatePhase, deletePhase } from "./actions"
import { PhaseStatus } from "@prisma/client"
import { cn, formatDate } from "@/lib/utils"
import { ChevronDown, ChevronRight, Plus, Flag } from "lucide-react"

interface Phase {
  id: string
  name: string
  description: string | null
  startDate: string | null
  targetEndDate: string | null
  actualEndDate: string | null
  status: PhaseStatus
  parentPhaseId: string | null
  order: number
  taskCount: number
  completedTaskCount: number
}

interface Props {
  accountId: string
  phases: Phase[]
  goNoGoDate: string | null
  isInternal: boolean
}

const STATUS_COLORS: Record<PhaseStatus, string> = {
  NOT_STARTED: "bg-muted/50 text-muted-foreground border-border",
  IN_PROGRESS: "bg-primary/10 text-primary border-primary/20",
  COMPLETE: "bg-green-500/10 text-green-400 border-green-500/20",
  BLOCKED: "bg-destructive/10 text-destructive border-destructive/20",
}

const STATUS_BAR_COLORS: Record<PhaseStatus, string> = {
  NOT_STARTED: "bg-muted/40",
  IN_PROGRESS: "bg-primary/60",
  COMPLETE: "bg-green-500/70",
  BLOCKED: "bg-destructive/60",
}

const STATUS_LABELS: Record<PhaseStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  BLOCKED: "Blocked",
}

function phaseHealth(phase: Phase): { label: string; color: string } | null {
  if (phase.taskCount === 0) return null
  const pct = phase.completedTaskCount / phase.taskCount
  const now = new Date()
  const overdue = phase.targetEndDate && new Date(phase.targetEndDate) < now && phase.status !== "COMPLETE"
  if (overdue || pct < 0.5) return { label: "Behind", color: "text-destructive" }
  if (pct < 0.8) return { label: "At Risk", color: "text-amber-400" }
  return { label: "On Track", color: "text-green-400" }
}

const EMPTY_FORM = {
  name: "",
  description: "",
  startDate: "",
  targetEndDate: "",
  actualEndDate: "",
  status: "NOT_STARTED" as PhaseStatus,
  parentPhaseId: "",
  order: 0,
}

export default function TimelineClient({ accountId, phases: initial, goNoGoDate, isInternal }: Props) {
  const [phases, setPhases] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Gantt date range
  const allDates = phases.flatMap((p) =>
    [p.startDate, p.targetEndDate, p.actualEndDate].filter(Boolean) as string[]
  )
  if (goNoGoDate) allDates.push(goNoGoDate)
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => new Date(d).getTime()))) : new Date()
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => new Date(d).getTime()))) : new Date(Date.now() + 30 * 86400000)
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / 86400000)

  function pct(date: string | null) {
    if (!date) return null
    const d = new Date(date)
    return Math.max(0, Math.min(100, ((d.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100))
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, order: phases.filter((p) => !p.parentPhaseId).length })
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(p: Phase) {
    setForm({
      name: p.name,
      description: p.description ?? "",
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      targetEndDate: p.targetEndDate ? p.targetEndDate.slice(0, 10) : "",
      actualEndDate: p.actualEndDate ? p.actualEndDate.slice(0, 10) : "",
      status: p.status,
      parentPhaseId: p.parentPhaseId ?? "",
      order: p.order,
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      if (editingId) {
        const res = await updatePhase({ id: editingId, accountId, ...form })
        if (res.success) {
          setPhases((prev) =>
            prev.map((p) =>
              p.id === editingId
                ? {
                    ...p,
                    name: form.name || p.name,
                    description: form.description || null,
                    startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
                    targetEndDate: form.targetEndDate ? new Date(form.targetEndDate).toISOString() : null,
                    actualEndDate: form.actualEndDate ? new Date(form.actualEndDate).toISOString() : null,
                    status: form.status,
                    order: form.order,
                  }
                : p
            )
          )
          toast.success("Phase updated")
        } else {
          toast.error(res.error)
        }
      } else {
        const res = await createPhase({ accountId, ...form })
        if (res.success) {
          setPhases((prev) => [
            ...prev,
            {
              id: res.id,
              name: form.name,
              description: form.description || null,
              startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
              targetEndDate: form.targetEndDate ? new Date(form.targetEndDate).toISOString() : null,
              actualEndDate: form.actualEndDate ? new Date(form.actualEndDate).toISOString() : null,
              status: form.status,
              parentPhaseId: form.parentPhaseId || null,
              order: form.order,
              taskCount: 0,
              completedTaskCount: 0,
            },
          ])
          toast.success("Phase created")
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
      const res = await deletePhase(id, accountId)
      if (res.success) {
        setPhases((prev) => prev.filter((p) => p.id !== id))
        toast.success("Phase deleted")
      } else {
        toast.error(res.error)
      }
    })
  }

  const rootPhases = phases.filter((p) => !p.parentPhaseId).sort((a, b) => a.order - b.order)
  const inputClass =
    "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  const goNoPct = pct(goNoGoDate)

  return (
    <div className="space-y-6">
      {/* Controls */}
      {isInternal && !showForm && (
        <div className="flex justify-end">
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add Phase
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground">
            {editingId ? "Edit Phase" : "New Phase"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Phase Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Installation, Training, Evaluation" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
              <input className={inputClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What happens in this phase?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
              <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Target End Date</label>
              <input type="date" className={inputClass} value={form.targetEndDate} onChange={(e) => setForm((f) => ({ ...f, targetEndDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Actual End Date</label>
              <input type="date" className={inputClass} value={form.actualEndDate} onChange={(e) => setForm((f) => ({ ...f, actualEndDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PhaseStatus }))}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {!editingId && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Parent Phase</label>
                <select className={inputClass} value={form.parentPhaseId} onChange={(e) => setForm((f) => ({ ...f, parentPhaseId: e.target.value }))}>
                  <option value="">None (top-level)</option>
                  {rootPhases.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending || !form.name} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {phases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No phases defined yet. {isInternal ? "Add your first phase above." : "Your team will add phases shortly."}
          </p>
        </div>
      ) : (
        <>
          {/* Gantt chart */}
          {allDates.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
              </div>
              <div className="p-4 overflow-x-auto">
                <div className="min-w-[600px] space-y-2">
                  {/* Go/No-Go marker */}
                  {goNoPct !== null && (
                    <div className="relative h-6 mb-3">
                      <div
                        className="absolute top-0 flex flex-col items-center"
                        style={{ left: `${goNoPct}%` }}
                      >
                        <div className="w-0.5 h-4 bg-destructive" />
                        <div className="flex items-center gap-1 mt-0.5">
                          <Flag className="h-3 w-3 text-destructive" />
                          <span className="text-xs text-destructive font-semibold whitespace-nowrap">Go/No-Go</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {phases.map((p) => {
                    const startPct = pct(p.startDate) ?? 0
                    const endPct = pct(p.targetEndDate ?? p.actualEndDate) ?? startPct + 5
                    const widthPct = Math.max(2, endPct - startPct)
                    const health = phaseHealth(p)
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-32 shrink-0 text-xs text-muted-foreground truncate" title={p.name}>
                          {p.parentPhaseId && <span className="mr-1 text-muted-foreground/40">↳</span>}
                          {p.name}
                        </div>
                        <div className="flex-1 relative h-6 rounded-sm bg-muted/20">
                          <div
                            className={cn("absolute inset-y-1 rounded-sm", STATUS_BAR_COLORS[p.status])}
                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                          />
                        </div>
                        {health && (
                          <span className={cn("text-xs font-medium w-14 shrink-0 text-right", health.color)}>
                            {health.label}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Phase list */}
          <div className="space-y-2">
            {rootPhases.map((phase) => {
              const children = phases.filter((p) => p.parentPhaseId === phase.id)
              const isCollapsed = collapsed.has(phase.id)
              const health = phaseHealth(phase)
              return (
                <div key={phase.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    {children.length > 0 && (
                      <button
                        onClick={() => setCollapsed((s) => { const n = new Set(s); if (n.has(phase.id)) n.delete(phase.id); else n.add(phase.id); return n })}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{phase.name}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", STATUS_COLORS[phase.status])}>
                          {STATUS_LABELS[phase.status]}
                        </span>
                        {health && (
                          <span className={cn("text-xs font-medium", health.color)}>{health.label}</span>
                        )}
                      </div>
                      {phase.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        {phase.startDate && <span>Start: {formatDate(phase.startDate)}</span>}
                        {phase.targetEndDate && <span>Target: {formatDate(phase.targetEndDate)}</span>}
                        {phase.actualEndDate && <span>Completed: {formatDate(phase.actualEndDate)}</span>}
                        {phase.taskCount > 0 && (
                          <span>{phase.completedTaskCount}/{phase.taskCount} tasks</span>
                        )}
                      </div>
                    </div>
                    {isInternal && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEdit(phase)} className="text-xs text-primary hover:underline">Edit</button>
                        <button onClick={() => handleDelete(phase.id)} className="text-xs text-destructive hover:underline">Delete</button>
                      </div>
                    )}
                  </div>

                  {/* Sub-phases */}
                  {!isCollapsed && children.length > 0 && (
                    <div className="border-t border-border divide-y divide-border">
                      {children.sort((a, b) => a.order - b.order).map((child) => {
                        const childHealth = phaseHealth(child)
                        return (
                          <div key={child.id} className="flex items-center gap-3 px-4 py-2.5 pl-10 bg-muted/5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-foreground">{child.name}</span>
                                <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", STATUS_COLORS[child.status])}>
                                  {STATUS_LABELS[child.status]}
                                </span>
                                {childHealth && (
                                  <span className={cn("text-xs font-medium", childHealth.color)}>{childHealth.label}</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-muted-foreground">
                                {child.startDate && <span>Start: {formatDate(child.startDate)}</span>}
                                {child.targetEndDate && <span>Target: {formatDate(child.targetEndDate)}</span>}
                              </div>
                            </div>
                            {isInternal && (
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => openEdit(child)} className="text-xs text-primary hover:underline">Edit</button>
                                <button onClick={() => handleDelete(child.id)} className="text-xs text-destructive hover:underline">Delete</button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
