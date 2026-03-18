"use client"

import { useState, useTransition } from "react"
import { PhaseStatus, TaskPriority, TaskStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusIcon, PencilIcon, Trash2Icon, ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { PhaseSheet } from "./PhaseSheet"
import { TasksInPhase } from "./TasksInPhase"
import { deletePhase } from "@/app/(admin)/admin/accounts/[id]/timeline/actions"
import { formatDate } from "@/lib/utils"

interface SerializedTask {
  id: string
  name: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  assigneeName: string | null
  assigneeEmail: string | null
  dueDate: string | null
  blockerReason: string | null
}

interface SerializedPhase {
  id: string
  name: string
  description: string | null
  startDate: string | null
  targetEndDate: string | null
  actualEndDate: string | null
  status: PhaseStatus
  order: number
  tasks: SerializedTask[]
}

interface AccountUser {
  id: string
  name: string | null
  email: string
}

interface PhasesSectionProps {
  accountId: string
  phases: SerializedPhase[]
  accountUsers: AccountUser[]
}

const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  BLOCKED: "Blocked",
}

function phaseStatusBadge(status: PhaseStatus) {
  switch (status) {
    case "NOT_STARTED":
      return <Badge variant="secondary">{PHASE_STATUS_LABEL[status]}</Badge>
    case "IN_PROGRESS":
      return <Badge variant="default">{PHASE_STATUS_LABEL[status]}</Badge>
    case "COMPLETE":
      return (
        <Badge variant="outline" className="border-green-600 text-green-600">
          {PHASE_STATUS_LABEL[status]}
        </Badge>
      )
    case "BLOCKED":
      return <Badge variant="destructive">{PHASE_STATUS_LABEL[status]}</Badge>
  }
}

function dateRange(
  startDate: string | null,
  targetEndDate: string | null
): string {
  if (!startDate && !targetEndDate) return "No dates set"
  const start = startDate ? formatDate(startDate) : "TBD"
  const end = targetEndDate ? formatDate(targetEndDate) : "TBD"
  return `${start} → ${end}`
}

export function PhasesSection({ accountId, phases, accountUsers }: PhasesSectionProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<SerializedPhase | undefined>(undefined)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function toggleExpand(phaseId: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) next.delete(phaseId)
      else next.add(phaseId)
      return next
    })
  }

  function openCreate() {
    setEditingPhase(undefined)
    setSheetMode("create")
    setSheetError(null)
    setSheetOpen(true)
  }

  function openEdit(phase: SerializedPhase) {
    setEditingPhase(phase)
    setSheetMode("edit")
    setSheetError(null)
    setSheetOpen(true)
  }

  function handleDelete(phaseId: string, name: string) {
    if (!confirm(`Delete phase "${name}" and all its tasks? This cannot be undone.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deletePhase({ accountId, phaseId })
      if (!result.success) setDeleteError(result.error)
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Timeline</h2>
            <p className="text-sm text-muted-foreground">
              Manage pilot phases and their associated tasks.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4" />
            Add Phase
          </Button>
        </div>

        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
        {sheetError && <p className="text-sm text-destructive">{sheetError}</p>}

        {phases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No phases yet. Add one to start building the timeline.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {phases.map((phase) => {
              const isExpanded = expandedPhases.has(phase.id)
              return (
                <div key={phase.id}>
                  {/* Phase row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleExpand(phase.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="size-4" />
                      ) : (
                        <ChevronRightIcon className="size-4" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{phase.name}</span>
                        {phaseStatusBadge(phase.status)}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {dateRange(phase.startDate, phase.targetEndDate)}
                        {" · "}
                        <span>{phase.tasks.length} task{phase.tasks.length !== 1 ? "s" : ""}</span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(phase)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(phase.id, phase.name)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tasks section — shown when expanded */}
                  {isExpanded && (
                    <TasksInPhase
                      accountId={accountId}
                      phaseId={phase.id}
                      tasks={phase.tasks}
                      accountUsers={accountUsers}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PhaseSheet
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        accountId={accountId}
        phase={editingPhase}
        onError={(e) => setSheetError(e)}
      />
    </>
  )
}
