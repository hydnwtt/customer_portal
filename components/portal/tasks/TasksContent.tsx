"use client"

import { useState, useTransition } from "react"
import { PhaseStatus, TaskPriority, TaskStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { updateTaskStatus } from "@/app/(portal)/[slug]/tasks/actions"

interface SerializedTask {
  id: string
  name: string
  status: TaskStatus
  priority: TaskPriority
  assigneeName: string | null
  dueDate: string | null
  blockerReason: string | null
}

interface SerializedPhase {
  id: string
  name: string
  status: PhaseStatus
  tasks: SerializedTask[]
}

interface TasksContentProps {
  phases: SerializedPhase[]
  canEdit: boolean
  slug: string
}

type FilterValue = "ALL" | TaskStatus

const FILTER_TABS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "ALL" },
  { label: "Not Started", value: "NOT_STARTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Blocked", value: "BLOCKED" },
  { label: "Complete", value: "COMPLETE" },
]

const STATUS_LABEL: Record<TaskStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  BLOCKED: "Blocked",
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  BLOCKED: "Blocked",
}

function taskStatusBadge(status: TaskStatus) {
  switch (status) {
    case "NOT_STARTED":
      return <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>
    case "IN_PROGRESS":
      return <Badge variant="default">{STATUS_LABEL[status]}</Badge>
    case "COMPLETE":
      return (
        <Badge variant="outline" className="border-green-600 text-green-600">
          {STATUS_LABEL[status]}
        </Badge>
      )
    case "BLOCKED":
      return <Badge variant="destructive">{STATUS_LABEL[status]}</Badge>
  }
}

function priorityBadge(priority: TaskPriority) {
  switch (priority) {
    case "HIGH":
      return (
        <Badge variant="secondary" className="text-red-600">
          {PRIORITY_LABEL[priority]}
        </Badge>
      )
    case "MEDIUM":
      return <Badge variant="secondary">{PRIORITY_LABEL[priority]}</Badge>
    case "LOW":
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          {PRIORITY_LABEL[priority]}
        </Badge>
      )
  }
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

interface TaskCardProps {
  task: SerializedTask
  canEdit: boolean
}

function TaskCard({ task, canEdit }: TaskCardProps) {
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status)
  const [pendingBlocker, setPendingBlocker] = useState(task.blockerReason ?? "")
  const [showBlockerInput, setShowBlockerInput] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleStatusChange(newStatus: TaskStatus) {
    setLocalStatus(newStatus)
    setError(null)
    if (newStatus === "BLOCKED") {
      setShowBlockerInput(true)
    } else {
      setShowBlockerInput(false)
      startTransition(async () => {
        const result = await updateTaskStatus({ taskId: task.id, status: newStatus })
        if (!result.success) {
          setError(result.error)
          setLocalStatus(task.status) // revert
        }
      })
    }
  }

  function handleBlockerSave() {
    startTransition(async () => {
      const result = await updateTaskStatus({
        taskId: task.id,
        status: "BLOCKED",
        blockerReason: pendingBlocker || undefined,
      })
      if (!result.success) {
        setError(result.error)
        setLocalStatus(task.status) // revert
        setShowBlockerInput(false)
      } else {
        setShowBlockerInput(false)
      }
    })
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{task.name}</p>

          {/* Blocked reason callout */}
          {localStatus === "BLOCKED" && task.blockerReason && !showBlockerInput && (
            <p className="mt-1 text-xs text-amber-600">⚠ {task.blockerReason}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {priorityBadge(task.priority)}
            {!canEdit && taskStatusBadge(localStatus)}
            {task.assigneeName && (
              <span className="text-xs text-muted-foreground">{task.assigneeName}</span>
            )}
            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                Due {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Inline status select for editable users */}
        {canEdit && (
          <div className="shrink-0 w-36">
            <Select
              value={localStatus}
              onValueChange={(v: string | null) => {
                if (v) handleStatusChange(v as TaskStatus)
              }}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TaskStatus).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Blocker reason input — shown when BLOCKED is newly selected */}
      {canEdit && showBlockerInput && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={pendingBlocker}
            onChange={(e) => setPendingBlocker(e.target.value)}
            placeholder="Describe what is blocking this task…"
            className="min-h-16 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBlockerSave}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLocalStatus(task.status)
                setShowBlockerInput(false)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function TasksContent({ phases, canEdit }: TasksContentProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("ALL")

  const totalTasks = phases.reduce((acc, p) => acc + p.tasks.length, 0)

  // Filter tasks across phases
  const filteredPhases = phases
    .map((phase) => ({
      ...phase,
      tasks:
        activeFilter === "ALL"
          ? phase.tasks
          : phase.tasks.filter((t) => t.status === activeFilter),
    }))
    .filter((phase) => phase.tasks.length > 0)

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Action Plan</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Shared task list for completing your pilot successfully.
      </p>

      {totalTasks === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Your action plan is being prepared — check back soon.
          </p>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="mb-6 flex flex-wrap gap-1 border-b">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={[
                  "px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeFilter === tab.value
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredPhases.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No tasks match the selected filter.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredPhases.map((phase) => (
                <div key={phase.id}>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-base font-semibold">{phase.name}</h2>
                    {phaseStatusBadge(phase.status)}
                  </div>
                  <div className="space-y-3">
                    {phase.tasks.map((task) => (
                      <TaskCard key={task.id} task={task} canEdit={canEdit} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
