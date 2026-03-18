"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createTask, updateTask, deleteTask, createTaskComment } from "./actions"
import { TaskStatus, TaskPriority } from "@prisma/client"
import { cn, formatDate } from "@/lib/utils"
import { ChevronDown, ChevronRight, AlertTriangle, MessageSquare, X } from "lucide-react"

interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
}

interface Task {
  id: string
  phaseId: string
  name: string
  description: string
  assigneeId: string | null
  assignee: { id: string; name: string; email: string } | null
  dueDate: string | null
  priority: TaskPriority
  status: TaskStatus
  blockerReason: string | null
  createdAt: string
  comments: Comment[]
}

interface Phase {
  id: string
  name: string
  tasks: Task[]
}

interface TeamMember {
  userId: string
  name: string
  email: string
  role: string
}

interface Props {
  accountId: string
  phases: Phase[]
  teamMembers: TeamMember[]
  isInternal: boolean
  canEdit: boolean
  currentUserId: string | null
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  BLOCKED: "bg-destructive/10 text-destructive",
  COMPLETE: "bg-green-500/10 text-green-400",
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  HIGH: "text-destructive",
  MEDIUM: "text-amber-400",
  LOW: "text-muted-foreground",
}

function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "COMPLETE") return false
  return new Date(dueDate) < new Date()
}

const EMPTY_FORM = {
  name: "",
  description: "",
  assigneeId: "",
  dueDate: "",
  priority: "MEDIUM" as TaskPriority,
  status: "NOT_STARTED" as TaskStatus,
  blockerReason: "",
}

export default function TasksClient({
  accountId,
  phases: initialPhases,
  teamMembers,
  isInternal,
  canEdit,
  currentUserId,
}: Props) {
  const [phases, setPhases] = useState(initialPhases)
  const [showForm, setShowForm] = useState<string | null>(null) // phaseId when adding
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [comment, setComment] = useState("")
  const [isPending, startTransition] = useTransition()

  // Filters
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL")
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "ALL">("ALL")
  const [filterAssignee, setFilterAssignee] = useState<string>("ALL")

  function openAdd(phaseId: string) {
    setForm({ ...EMPTY_FORM })
    setEditingTaskId(null)
    setShowForm(phaseId)
  }

  function openEdit(task: Task) {
    setForm({
      name: task.name,
      description: task.description,
      assigneeId: task.assigneeId ?? "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      priority: task.priority,
      status: task.status,
      blockerReason: task.blockerReason ?? "",
    })
    setEditingTaskId(task.id)
    setShowForm(task.phaseId)
  }

  function updateTaskInState(taskId: string, updates: Partial<Task>) {
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      }))
    )
  }

  function handleSubmit(phaseId: string) {
    startTransition(async () => {
      if (editingTaskId) {
        const res = await updateTask({ id: editingTaskId, accountId, ...form })
        if (res.success) {
          updateTaskInState(editingTaskId, {
            name: form.name,
            description: form.description,
            assigneeId: form.assigneeId || null,
            assignee: teamMembers.find((m) => m.userId === form.assigneeId)
              ? { id: form.assigneeId, name: teamMembers.find((m) => m.userId === form.assigneeId)!.name, email: "" }
              : null,
            dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
            priority: form.priority,
            status: form.status,
            blockerReason: form.blockerReason || null,
          })
          toast.success("Task updated")
        } else {
          toast.error(res.error)
          return
        }
      } else {
        const res = await createTask({ phaseId, accountId, ...form })
        if (res.success) {
          setPhases((prev) =>
            prev.map((p) =>
              p.id === phaseId
                ? {
                    ...p,
                    tasks: [
                      ...p.tasks,
                      {
                        id: res.id,
                        phaseId,
                        name: form.name,
                        description: form.description,
                        assigneeId: form.assigneeId || null,
                        assignee: null,
                        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
                        priority: form.priority,
                        status: form.status,
                        blockerReason: form.blockerReason || null,
                        createdAt: new Date().toISOString(),
                        comments: [],
                      },
                    ],
                  }
                : p
            )
          )
          toast.success("Task created")
        } else {
          toast.error(res.error)
          return
        }
      }
      setShowForm(null)
      setEditingTaskId(null)
    })
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      const res = await deleteTask(taskId, accountId)
      if (res.success) {
        setPhases((prev) =>
          prev.map((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }))
        )
        toast.success("Task deleted")
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleAddComment(taskId: string) {
    if (!comment.trim()) return
    startTransition(async () => {
      const res = await createTaskComment({ taskId, content: comment.trim() })
      if (res.success) {
        updateTaskInState(taskId, {
          comments: [
            ...(phases.flatMap((p) => p.tasks).find((t) => t.id === taskId)?.comments ?? []),
            {
              id: res.id,
              content: comment.trim(),
              authorId: currentUserId ?? "",
              authorName: "You",
              createdAt: res.createdAt,
            },
          ],
        })
        setComment("")
        toast.success("Comment added")
      } else {
        toast.error(res.error)
      }
    })
  }

  const allTasks = phases.flatMap((p) => p.tasks)
  const overdueCount = allTasks.filter((t) => isOverdue(t.dueDate, t.status)).length
  const blockedCount = allTasks.filter((t) => t.status === "BLOCKED").length
  const completeCount = allTasks.filter((t) => t.status === "COMPLETE").length

  function filterTask(t: Task) {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false
    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false
    if (filterAssignee !== "ALL" && t.assigneeId !== filterAssignee) return false
    return true
  }

  const selectClass =
    "rounded-md border border-border bg-input px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
  const inputClass =
    "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div className="space-y-6">
      {/* Stats + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{allTasks.length} total</span>
          <span>{completeCount} complete</span>
          {overdueCount > 0 && <span className="text-destructive font-medium">{overdueCount} overdue</span>}
          {blockedCount > 0 && <span className="text-destructive font-medium">{blockedCount} blocked</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <select className={selectClass} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "ALL")}>
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select className={selectClass} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "ALL")}>
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select className={selectClass} value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
            <option value="ALL">All Assignees</option>
            {teamMembers.map((m) => (
              <option key={m.userId} value={m.userId}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Phases + Tasks */}
      {phases.map((phase) => {
        const filteredTasks = phase.tasks.filter(filterTask)
        const isAdding = showForm === phase.id && !editingTaskId
        return (
          <div key={phase.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                {phase.name}
              </h2>
              {isInternal && (
                <button
                  onClick={() => openAdd(phase.id)}
                  className="text-xs text-primary hover:underline"
                >
                  + Add Task
                </button>
              )}
            </div>

            {/* Add form */}
            {isAdding && (
              <TaskForm
                form={form}
                setForm={setForm}
                onSubmit={() => handleSubmit(phase.id)}
                onCancel={() => { setShowForm(null) }}
                isPending={isPending}
                teamMembers={teamMembers}
                isNew
                inputClass={inputClass}
              />
            )}

            {filteredTasks.length === 0 && !isAdding && (
              <p className="text-xs text-muted-foreground px-1">No tasks match filters.</p>
            )}

            {filteredTasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status)
              const isExpanded = expandedTaskId === task.id
              const isEditingThis = editingTaskId === task.id && showForm === task.phaseId

              return (
                <div key={task.id} className={cn("rounded-xl border bg-card overflow-hidden", overdue ? "border-destructive/30" : "border-border")}>
                  {/* Task row */}
                  {isEditingThis ? (
                    <div className="p-4">
                      <TaskForm
                        form={form}
                        setForm={setForm}
                        onSubmit={() => handleSubmit(task.phaseId)}
                        onCancel={() => { setShowForm(null); setEditingTaskId(null) }}
                        isPending={isPending}
                        teamMembers={teamMembers}
                        isNew={false}
                        inputClass={inputClass}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("font-medium text-sm", overdue && "text-destructive")}>
                            {task.name}
                          </span>
                          {overdue && (
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Overdue</span>
                            </div>
                          )}
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_COLORS[task.status])}>
                            {STATUS_LABELS[task.status]}
                          </span>
                          <span className={cn("text-xs font-semibold uppercase tracking-wide", PRIORITY_COLORS[task.priority])}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                        )}
                        {task.status === "BLOCKED" && task.blockerReason && (
                          <p className="text-xs text-destructive mt-1 font-medium">
                            Blocker: {task.blockerReason}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                          {task.assignee && <span>Assigned to {task.assignee.name}</span>}
                          {task.dueDate && (
                            <span className={overdue ? "text-destructive" : ""}>
                              Due {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.comments.length > 0 && (
                            <button
                              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <MessageSquare className="h-3 w-3" />
                              {task.comments.length}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={() => openEdit(task)} className="text-xs text-primary hover:underline">Edit</button>
                            {isInternal && (
                              <button onClick={() => handleDelete(task.id)} className="text-xs text-destructive hover:underline">Delete</button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comment thread */}
                  {isExpanded && !isEditingThis && (
                    <div className="border-t border-border bg-muted/5 px-4 py-3 space-y-3">
                      {task.comments.map((c) => (
                        <div key={c.id} className="text-xs">
                          <span className="font-medium text-foreground">{c.authorName}</span>
                          <span className="text-muted-foreground ml-2">{formatDate(c.createdAt)}</span>
                          <p className="mt-0.5 text-foreground/80">{c.content}</p>
                        </div>
                      ))}
                      {task.comments.length === 0 && (
                        <p className="text-xs text-muted-foreground">No comments yet.</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <input
                          className="flex-1 rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Add a comment…"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(task.id) } }}
                        />
                        <button
                          onClick={() => handleAddComment(task.id)}
                          disabled={!comment.trim() || isPending}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {phases.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No phases or tasks yet. Tasks are organized by pilot phase.</p>
        </div>
      )}
    </div>
  )
}

function TaskForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  isPending,
  teamMembers,
  isNew,
  inputClass,
}: {
  form: typeof EMPTY_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>
  onSubmit: () => void
  onCancel: () => void
  isPending: boolean
  teamMembers: TeamMember[]
  isNew: boolean
  inputClass: string
}) {
  const needsBlocker = form.status === "BLOCKED"

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Task Name *</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="What needs to be done?" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
          <input className={inputClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Assignee</label>
          <select className={inputClass} value={form.assigneeId} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}>
            <option value="">Unassigned</option>
            {teamMembers.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Due Date</label>
          <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
          <select className={inputClass} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
          <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus, blockerReason: e.target.value !== "BLOCKED" ? "" : f.blockerReason }))}>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETE">Complete</option>
          </select>
        </div>
        {needsBlocker && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-destructive mb-1">Blocker Reason * (required)</label>
            <input className={`${inputClass} border-destructive/50`} value={form.blockerReason} onChange={(e) => setForm((f) => ({ ...f, blockerReason: e.target.value }))} placeholder="Describe what is blocking this task" />
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        <button
          onClick={onSubmit}
          disabled={isPending || !form.name || (needsBlocker && !form.blockerReason)}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : isNew ? "Create" : "Update"}
        </button>
      </div>
    </div>
  )
}
