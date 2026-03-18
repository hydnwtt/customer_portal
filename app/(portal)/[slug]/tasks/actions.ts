"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { TaskStatus, TaskPriority } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"
import { textToTiptapJson } from "@/lib/tiptap-text"

async function getSession() {
  const session = await auth()
  return session?.user ?? null
}

function canEdit(role: string) {
  return role === "INTERNAL_ADMIN" || role === "INTERNAL_MEMBER" || role === "CUSTOMER_ADMIN"
}

// ─── Task CRUD ───────────────────────────────────────────────────────────────

const taskSchema = z.object({
  phaseId: z.string().cuid(),
  accountId: z.string().cuid(),
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional().or(z.literal("")),
  assigneeId: z.string().cuid().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  blockerReason: z.string().max(500).optional().or(z.literal("")),
})

export async function createTask(
  input: z.infer<typeof taskSchema>
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await getSession()
  if (!user || !["INTERNAL_ADMIN", "INTERNAL_MEMBER"].includes(user.role)) {
    return { success: false, error: "Only internal team members can create tasks" }
  }

  const parsed = taskSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  if (data.status === "BLOCKED" && !data.blockerReason) {
    return { success: false, error: "Blocker reason is required when status is Blocked" }
  }

  const task = await db.task.create({
    data: {
      phaseId: data.phaseId,
      name: data.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: data.description ? (textToTiptapJson(data.description) as any) : undefined,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority,
      status: data.status,
      blockerReason: data.blockerReason || null,
    },
  })

  await writeAuditLog({
    accountId: data.accountId,
    userId: user.id,
    entityType: "Task",
    entityId: task.id,
    field: "created",
    newValue: data.name,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true, id: task.id }
}

const updateTaskSchema = z.object({
  id: z.string().cuid(),
  accountId: z.string().cuid(),
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().or(z.literal("")),
  assigneeId: z.string().cuid().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  blockerReason: z.string().max(500).optional().or(z.literal("")),
})

export async function updateTask(
  input: z.infer<typeof updateTaskSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getSession()
  if (!user || !canEdit(user.role)) return { success: false, error: "Unauthorized" }

  const parsed = updateTaskSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const { id, accountId, description, ...rest } = parsed.data

  if (rest.status === "BLOCKED" && !rest.blockerReason) {
    return { success: false, error: "Blocker reason is required when marking a task as Blocked" }
  }

  await db.task.update({
    where: { id },
    data: {
      ...(rest.name !== undefined && { name: rest.name }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(description !== undefined && { description: description ? (textToTiptapJson(description) as any) : undefined }),
      ...(rest.assigneeId !== undefined && { assigneeId: rest.assigneeId || undefined }),
      ...(rest.dueDate !== undefined && { dueDate: rest.dueDate ? new Date(rest.dueDate) : null }),
      ...(rest.priority !== undefined && { priority: rest.priority }),
      ...(rest.status !== undefined && { status: rest.status }),
      ...(rest.blockerReason !== undefined && { blockerReason: rest.blockerReason || null }),
    },
  })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "Task",
    entityId: id,
    field: "updated",
    newValue: rest.status ?? rest.name,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

export async function deleteTask(
  id: string,
  accountId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getSession()
  if (!user || !["INTERNAL_ADMIN", "INTERNAL_MEMBER"].includes(user.role)) {
    return { success: false, error: "Only internal team members can delete tasks" }
  }

  await db.task.delete({ where: { id } })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "Task",
    entityId: id,
    field: "deleted",
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

// Lightweight status-only update used by the customer-facing TasksContent component
const updateTaskStatusSchema = z.object({
  taskId: z.string().cuid(),
  status: z.nativeEnum(TaskStatus),
  blockerReason: z.string().max(1000).optional(),
})

export async function updateTaskStatus(
  input: z.infer<typeof updateTaskStatusSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const isInternal =
    session.user.role === "INTERNAL_ADMIN" || session.user.role === "INTERNAL_MEMBER"
  const isCustomerAdmin = session.user.accountRole === "CUSTOMER_ADMIN"
  if (!isInternal && !isCustomerAdmin) return { success: false, error: "Unauthorized" }

  const parsed = updateTaskStatusSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }

  const { taskId, status, blockerReason } = parsed.data

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { phase: { select: { accountId: true } } },
  })
  if (!task) return { success: false, error: "Task not found" }

  if (!isInternal && task.phase.accountId !== session.user.accountId) {
    return { success: false, error: "Unauthorized" }
  }

  await db.task.update({
    where: { id: taskId },
    data: {
      status,
      blockerReason: status === TaskStatus.BLOCKED ? (blockerReason ?? null) : null,
    },
  })

  await writeAuditLog({
    accountId: task.phase.accountId,
    userId: session.user.id,
    entityType: "Task",
    entityId: taskId,
    field: "status",
    oldValue: task.status,
    newValue: status,
  })

  const account = await db.account.findUnique({
    where: { id: task.phase.accountId },
    select: { slug: true },
  })
  if (account?.slug) revalidatePath(`/${account.slug}/tasks`)

  return { success: true }
}

// ─── Task Comments ───────────────────────────────────────────────────────────

const commentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1).max(2000),
})

const deleteCommentSchema = z.object({
  commentId: z.string().cuid(),
})

export async function createTaskComment(
  input: z.infer<typeof commentSchema>
): Promise<{ success: true; id: string; createdAt: string } | { success: false; error: string }> {
  const user = await getSession()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = commentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  const comment = await db.taskComment.create({
    data: {
      taskId: data.taskId,
      authorId: user.id,
      content: data.content,
    },
  })

  revalidatePath(`/admin/accounts`)
  return { success: true, id: comment.id, createdAt: comment.createdAt.toISOString() }
}

export async function deleteTaskComment(
  input: z.infer<typeof deleteCommentSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const parsed = deleteCommentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { commentId } = parsed.data
  const isInternal =
    session.user.role === "INTERNAL_ADMIN" || session.user.role === "INTERNAL_MEMBER"

  const comment = await db.taskComment.findUnique({
    where: { id: commentId },
    include: {
      task: { include: { phase: { select: { accountId: true } } } },
    },
  })
  if (!comment) return { success: false, error: "Comment not found" }

  // Own comment OR internal user can delete
  if (!isInternal && comment.authorId !== session.user.id) {
    return { success: false, error: "Unauthorized" }
  }

  if (!isInternal && comment.task.phase.accountId !== session.user.accountId) {
    return { success: false, error: "Unauthorized" }
  }

  await db.taskComment.delete({ where: { id: commentId } })

  await writeAuditLog({
    accountId: comment.task.phase.accountId,
    userId: session.user.id,
    entityType: "TaskComment",
    entityId: commentId,
    field: "deleted",
    oldValue: comment.content,
  })

  const account = await db.account.findUnique({
    where: { id: comment.task.phase.accountId },
    select: { slug: true },
  })
  if (account?.slug) revalidatePath(`/${account.slug}/tasks`)

  return { success: true }
}
