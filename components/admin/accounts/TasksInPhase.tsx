"use client"

import { useState, useTransition } from "react"
import { TaskPriority, TaskStatus } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { TaskSheet } from "./TaskSheet"
import { deleteTask } from "@/app/(admin)/admin/accounts/[id]/timeline/actions"
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

interface AccountUser {
  id: string
  name: string | null
  email: string
}

interface TasksInPhaseProps {
  accountId: string
  phaseId: string
  tasks: SerializedTask[]
  accountUsers: AccountUser[]
}

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

export function TasksInPhase({
  accountId,
  phaseId,
  tasks,
  accountUsers,
}: TasksInPhaseProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<SerializedTask | undefined>(undefined)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingTask(undefined)
    setSheetMode("create")
    setSheetError(null)
    setSheetOpen(true)
  }

  function openEdit(task: SerializedTask) {
    setEditingTask(task)
    setSheetMode("edit")
    setSheetError(null)
    setSheetOpen(true)
  }

  function handleDelete(taskId: string, name: string) {
    if (!confirm(`Delete task "${name}"? This cannot be undone.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteTask({ accountId, taskId })
      if (!result.success) setDeleteError(result.error)
    })
  }

  return (
    <>
      <div className="border-t bg-muted/30 px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tasks
          </p>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <PlusIcon className="size-3.5" />
            Add Task
          </Button>
        </div>

        {deleteError && <p className="mb-2 text-sm text-destructive">{deleteError}</p>}
        {sheetError && <p className="mb-2 text-sm text-destructive">{sheetError}</p>}

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No tasks yet.</p>
        ) : (
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.name}
                      {t.blockerReason && (
                        <p className="mt-0.5 text-xs text-amber-600 line-clamp-1">
                          ⚠ {t.blockerReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{taskStatusBadge(t.status)}</TableCell>
                    <TableCell>{priorityBadge(t.priority)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.assigneeName ?? t.assigneeEmail ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.dueDate ? formatDate(t.dueDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(t)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(t.id, t.name)}
                          disabled={isPending}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <TaskSheet
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        accountId={accountId}
        phaseId={phaseId}
        task={editingTask}
        accountUsers={accountUsers}
        onError={(e) => setSheetError(e)}
      />
    </>
  )
}
