"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { TaskStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"

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
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { taskId, status, blockerReason } = parsed.data

  // Verify task belongs to the user's account (security check)
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

  // Get slug for revalidation
  const account = await db.account.findUnique({
    where: { id: task.phase.accountId },
    select: { slug: true },
  })
  if (account?.slug) {
    revalidatePath(`/${account.slug}/tasks`)
  }

  return { success: true }
}
