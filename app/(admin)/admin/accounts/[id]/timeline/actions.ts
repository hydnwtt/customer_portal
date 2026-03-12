"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PhaseStatus, TaskPriority, TaskStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function assertInternal() {
  const session = await auth()
  if (
    !session?.user ||
    !["INTERNAL_ADMIN", "INTERNAL_MEMBER"].includes(session.user.role)
  )
    return null
  return session
}

function toDate(val: string | undefined | null): Date | undefined {
  if (!val) return undefined
  const d = new Date(val)
  return isNaN(d.getTime()) ? undefined : d
}

async function getSlug(accountId: string) {
  const account = await db.account.findUnique({
    where: { id: accountId },
    select: { slug: true },
  })
  return account?.slug ?? null
}

// ─── Phases ───────────────────────────────────────────────────────────────────

const createPhaseSchema = z.object({
  accountId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  status: z.nativeEnum(PhaseStatus).default(PhaseStatus.NOT_STARTED),
  order: z.number().int().optional(),
})

export async function createPhase(
  input: z.infer<typeof createPhaseSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = createPhaseSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, startDate, targetEndDate, order, ...fields } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  // Default order to end of list
  let resolvedOrder = order
  if (resolvedOrder === undefined) {
    const count = await db.phase.count({ where: { accountId } })
    resolvedOrder = count
  }

  const phase = await db.phase.create({
    data: {
      accountId,
      ...fields,
      startDate: toDate(startDate),
      targetEndDate: toDate(targetEndDate),
      order: resolvedOrder,
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Phase",
    entityId: phase.id,
    field: "created",
    oldValue: null,
    newValue: phase.name,
  })

  revalidatePath(`/admin/accounts/${accountId}/timeline`)
  revalidatePath(`/${slug}/timeline`)

  return { success: true }
}

const updatePhaseSchema = z.object({
  accountId: z.string().cuid(),
  phaseId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  status: z.nativeEnum(PhaseStatus),
  order: z.number().int().optional(),
})

export async function updatePhase(
  input: z.infer<typeof updatePhaseSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = updatePhaseSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, phaseId, startDate, targetEndDate, actualEndDate, order, ...fields } =
    parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  const phase = await db.phase.update({
    where: { id: phaseId },
    data: {
      ...fields,
      startDate: toDate(startDate) ?? null,
      targetEndDate: toDate(targetEndDate) ?? null,
      actualEndDate: toDate(actualEndDate) ?? null,
      ...(order !== undefined && { order }),
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Phase",
    entityId: phase.id,
    field: "updated",
    oldValue: null,
    newValue: phase.name,
  })

  revalidatePath(`/admin/accounts/${accountId}/timeline`)
  revalidatePath(`/${slug}/timeline`)

  return { success: true }
}

const deletePhaseSchema = z.object({
  accountId: z.string().cuid(),
  phaseId: z.string().cuid(),
})

export async function deletePhase(
  input: z.infer<typeof deletePhaseSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = deletePhaseSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, phaseId } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  await db.phase.delete({ where: { id: phaseId } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Phase",
    entityId: phaseId,
    field: "deleted",
    oldValue: null,
    newValue: null,
  })

  revalidatePath(`/admin/accounts/${accountId}/timeline`)
  revalidatePath(`/${slug}/timeline`)
  revalidatePath(`/${slug}/tasks`)

  return { success: true }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  accountId: z.string().cuid(),
  phaseId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().cuid().optional(),
  dueDate: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.NOT_STARTED),
  blockerReason: z.string().max(1000).optional(),
})

export async function createTask(
  input: z.infer<typeof createTaskSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = createTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, dueDate, assigneeId, blockerReason, ...fields } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  const task = await db.task.create({
    data: {
      ...fields,
      dueDate: toDate(dueDate),
      assigneeId: assigneeId ?? null,
      blockerReason: fields.status === TaskStatus.BLOCKED ? (blockerReason ?? null) : null,
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Task",
    entityId: task.id,
    field: "created",
    oldValue: null,
    newValue: task.name,
  })

  revalidatePath(`/admin/accounts/${accountId}/timeline`)
  revalidatePath(`/${slug}/tasks`)

  return { success: true }
}

const updateTaskSchema = z.object({
  accountId: z.string().cuid(),
  taskId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().cuid().optional(),
  dueDate: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  blockerReason: z.string().max(1000).optional(),
})

export async function updateTask(
  input: z.infer<typeof updateTaskSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = updateTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, taskId, dueDate, assigneeId, blockerReason, ...fields } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      ...fields,
      dueDate: toDate(dueDate) ?? null,
      assigneeId: assigneeId ?? null,
      blockerReason: fields.status === TaskStatus.BLOCKED ? (blockerReason ?? null) : null,
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Task",
    entityId: task.id,
    field: "updated",
    oldValue: null,
    newValue: task.name,
  })

  revalidatePath(`/admin/accounts/${accountId}/timeline`)
  revalidatePath(`/${slug}/tasks`)

  return { success: true }
}

const deleteTaskSchema = z.object({
  accountId: z.string().cuid(),
  taskId: z.string().cuid(),
})

export async function deleteTask(
  input: z.infer<typeof deleteTaskSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = deleteTaskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, taskId } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  await db.task.delete({ where: { id: taskId } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Task",
    entityId: taskId,
    field: "deleted",
    oldValue: null,
    newValue: null,
  })

  revalidatePath(`/admin/accounts/${accountId}/timeline`)
  revalidatePath(`/${slug}/tasks`)

  return { success: true }
}
