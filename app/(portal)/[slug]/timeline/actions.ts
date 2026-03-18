"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PhaseStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"

async function requireInternal() {
  const session = await auth()
  if (!session?.user) return null
  const { role } = session.user
  if (role !== "INTERNAL_ADMIN" && role !== "INTERNAL_MEMBER") return null
  return session.user
}

const phaseSchema = z.object({
  accountId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  targetEndDate: z.string().optional().or(z.literal("")),
  actualEndDate: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(PhaseStatus),
  parentPhaseId: z.string().cuid().optional().or(z.literal("")),
  order: z.number().int().min(0).default(0),
})

export async function createPhase(
  input: z.infer<typeof phaseSchema>
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = phaseSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  const phase = await db.phase.create({
    data: {
      accountId: data.accountId,
      name: data.name,
      description: data.description || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
      actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
      status: data.status,
      parentPhaseId: data.parentPhaseId || null,
      order: data.order,
    },
  })

  await writeAuditLog({
    accountId: data.accountId,
    userId: user.id,
    entityType: "Phase",
    entityId: phase.id,
    field: "created",
    newValue: data.name,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true, id: phase.id }
}

const updatePhaseSchema = phaseSchema.partial().extend({
  id: z.string().cuid(),
  accountId: z.string().cuid(),
})

export async function updatePhase(
  input: z.infer<typeof updatePhaseSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = updatePhaseSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const { id, accountId, ...rest } = parsed.data

  await db.phase.update({
    where: { id },
    data: {
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.description !== undefined && { description: rest.description || null }),
      ...(rest.startDate !== undefined && { startDate: rest.startDate ? new Date(rest.startDate) : null }),
      ...(rest.targetEndDate !== undefined && { targetEndDate: rest.targetEndDate ? new Date(rest.targetEndDate) : null }),
      ...(rest.actualEndDate !== undefined && { actualEndDate: rest.actualEndDate ? new Date(rest.actualEndDate) : null }),
      ...(rest.status !== undefined && { status: rest.status }),
      ...(rest.order !== undefined && { order: rest.order }),
    },
  })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "Phase",
    entityId: id,
    field: "updated",
    newValue: rest.name ?? rest.status,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

export async function deletePhase(
  id: string,
  accountId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  await db.phase.delete({ where: { id } })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "Phase",
    entityId: id,
    field: "deleted",
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}
