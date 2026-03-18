"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectionCategory, ObjectionStatus } from "@prisma/client"
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

const objectionSchema = z.object({
  accountId: z.string().cuid(),
  objection: z.string().min(1).max(1000),
  raisedBy: z.string().max(200).optional().or(z.literal("")),
  dateRaised: z.string().optional().or(z.literal("")),
  category: z.nativeEnum(ObjectionCategory),
  status: z.nativeEnum(ObjectionStatus).default("OPEN"),
  resolutionNotes: z.string().max(1000).optional().or(z.literal("")),
  owner: z.string().max(200).optional().or(z.literal("")),
})

export async function createObjection(
  input: z.infer<typeof objectionSchema>
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = objectionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  const obj = await db.objection.create({
    data: {
      accountId: data.accountId,
      objection: data.objection,
      raisedBy: data.raisedBy || null,
      dateRaised: data.dateRaised ? new Date(data.dateRaised) : new Date(),
      category: data.category,
      status: data.status,
      resolutionNotes: data.resolutionNotes || null,
      owner: data.owner || null,
    },
  })

  await writeAuditLog({
    accountId: data.accountId,
    userId: user.id,
    entityType: "Objection",
    entityId: obj.id,
    field: "created",
    newValue: data.objection.slice(0, 100),
  })

  revalidatePath(`/admin/accounts/${data.accountId}/objections`)
  return { success: true, id: obj.id }
}

const updateObjectionSchema = objectionSchema.partial().extend({
  id: z.string().cuid(),
  accountId: z.string().cuid(),
})

export async function updateObjection(
  input: z.infer<typeof updateObjectionSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = updateObjectionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const { id, accountId, ...rest } = parsed.data

  await db.objection.update({
    where: { id },
    data: {
      ...(rest.objection !== undefined && { objection: rest.objection }),
      ...(rest.raisedBy !== undefined && { raisedBy: rest.raisedBy || null }),
      ...(rest.dateRaised !== undefined && { dateRaised: rest.dateRaised ? new Date(rest.dateRaised) : undefined }),
      ...(rest.category !== undefined && { category: rest.category }),
      ...(rest.status !== undefined && { status: rest.status }),
      ...(rest.resolutionNotes !== undefined && { resolutionNotes: rest.resolutionNotes || null }),
      ...(rest.owner !== undefined && { owner: rest.owner || null }),
    },
  })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "Objection",
    entityId: id,
    field: "updated",
    newValue: rest.status,
  })

  revalidatePath(`/admin/accounts/${accountId}/objections`)
  return { success: true }
}

export async function deleteObjection(
  id: string,
  accountId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  await db.objection.delete({ where: { id } })

  revalidatePath(`/admin/accounts/${accountId}/objections`)
  return { success: true }
}
