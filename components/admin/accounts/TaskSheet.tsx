"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TaskPriority, TaskStatus } from "@prisma/client"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTask, updateTask } from "@/app/(admin)/admin/accounts/[id]/timeline/actions"

const schema = z.object({
  name: z.string().min(1, "Required").max(200),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  blockerReason: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

interface AccountUser {
  id: string
  name: string | null
  email: string
}

interface SerializedTask {
  id: string
  name: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  dueDate: string | null
  blockerReason: string | null
}

interface TaskSheetProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  phaseId: string
  task?: SerializedTask
  accountUsers: AccountUser[]
  onError: (error: string) => void
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  BLOCKED: "Blocked",
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function TaskSheet({
  mode,
  open,
  onOpenChange,
  accountId,
  phaseId,
  task,
  accountUsers,
  onError,
}: TaskSheetProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      assigneeId: "",
      dueDate: "",
      blockerReason: "",
    },
  })

  useEffect(() => {
    if (mode === "edit" && task) {
      reset({
        name: task.name,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId ?? "",
        dueDate: toDateInput(task.dueDate),
        blockerReason: task.blockerReason ?? "",
      })
    } else if (mode === "create") {
      reset({
        name: "",
        description: "",
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        assigneeId: "",
        dueDate: "",
        blockerReason: "",
      })
    }
  }, [mode, task, reset])

  const currentStatus = watch("status")
  const currentPriority = watch("priority")
  const currentAssigneeId = watch("assigneeId")

  async function onSubmit(values: FormValues) {
    const payload = {
      accountId,
      name: values.name,
      description: values.description || undefined,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId || undefined,
      dueDate: values.dueDate || undefined,
      blockerReason: values.status === TaskStatus.BLOCKED ? values.blockerReason || undefined : undefined,
    }

    const result =
      mode === "create"
        ? await createTask({ ...payload, phaseId })
        : await updateTask({ ...payload, taskId: task!.id })

    if (!result.success) {
      onError(result.error)
      return
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add Task" : "Edit Task"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="task-name">Name *</Label>
            <Input id="task-name" {...register("name")} placeholder="e.g. Set up SSO" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              {...register("description")}
              placeholder="Optional task details"
              className="min-h-16"
            />
          </div>

          {/* Status + Priority side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={currentStatus}
                onValueChange={(v: string | null) =>
                  setValue("status", (v ?? TaskStatus.NOT_STARTED) as TaskStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Priority</Label>
              <Select
                value={currentPriority}
                onValueChange={(v: string | null) =>
                  setValue("priority", (v ?? TaskPriority.MEDIUM) as TaskPriority)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskPriority).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Blocker Reason — shown only when BLOCKED */}
          {currentStatus === TaskStatus.BLOCKED && (
            <div className="space-y-1">
              <Label htmlFor="task-blocker">Blocker Reason</Label>
              <Textarea
                id="task-blocker"
                {...register("blockerReason")}
                placeholder="What is blocking this task?"
                className="min-h-16"
              />
            </div>
          )}

          {/* Assignee */}
          {accountUsers.length > 0 && (
            <div className="space-y-1">
              <Label>Assignee</Label>
              <Select
                value={currentAssigneeId ?? ""}
                onValueChange={(v: string | null) =>
                  setValue("assigneeId", !v || v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {accountUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-1">
            <Label htmlFor="task-due">Due Date</Label>
            <Input id="task-due" type="date" {...register("dueDate")} />
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Add Task" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
