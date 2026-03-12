"use client"

import { PhaseStatus, TaskStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface SerializedPhaseWithTaskSummary {
  id: string
  name: string
  description: string | null
  startDate: string | null
  targetEndDate: string | null
  status: PhaseStatus
  tasks: { status: TaskStatus }[]
}

interface TimelineContentProps {
  phases: SerializedPhaseWithTaskSummary[]
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

function dateRange(startDate: string | null, targetEndDate: string | null): string {
  if (!startDate && !targetEndDate) return "No dates set"
  const start = startDate ? formatDate(startDate) : "TBD"
  const end = targetEndDate ? formatDate(targetEndDate) : "TBD"
  return `${start} → ${end}`
}

export function TimelineContent({ phases }: TimelineContentProps) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Phase Timeline</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Visual overview of your pilot phases and milestones.
      </p>

      {phases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Phases will appear here once your CSM has set up the timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => {
            const completedTasks = phase.tasks.filter(
              (t) => t.status === "COMPLETE"
            ).length
            const totalTasks = phase.tasks.length
            const progress =
              totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <div key={phase.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{phase.name}</h2>
                      {phaseStatusBadge(phase.status)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateRange(phase.startDate, phase.targetEndDate)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {completedTasks}/{totalTasks}{" "}
                      <span className="font-normal text-muted-foreground">
                        task{totalTasks !== 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {totalTasks > 0 && (
                  <div className="mt-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Blocked callout */}
                {phase.status === "BLOCKED" && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs font-medium text-amber-700">
                      ⚠ This phase is currently blocked. Contact your CSM for updates.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
