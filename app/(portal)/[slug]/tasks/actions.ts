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

const commentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1).max(2000),
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
