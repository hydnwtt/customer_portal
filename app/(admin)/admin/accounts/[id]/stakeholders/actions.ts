"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { StakeholderCompany, InvolvementLevel } from "@prisma/client"
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

function revalidateAll(accountId: string, slug: string) {
  revalidatePath(`/admin/accounts/${accountId}/stakeholders`)
  revalidatePath(`/${slug}/stakeholders`)
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const stakeholderFields = {
  accountId: z.string().cuid(),
  name: z.string().min(1).max(200),
  company: z.nativeEnum(StakeholderCompany),
  title: z.string().max(200).optional(),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  involvementLevel: z.nativeEnum(InvolvementLevel),
  lastEngagedAt: z.string().optional(),
  notes: z.string().max(1000).optional(),
}

const createStakeholderSchema = z.object(stakeholderFields)

const updateStakeholderSchema = z.object({
  ...stakeholderFields,
  stakeholderId: z.string().cuid(),
})

const deleteStakeholderSchema = z.object({
  accountId: z.string().cuid(),
  stakeholderId: z.string().cuid(),
})

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createStakeholder(
  input: z.infer<typeof createStakeholderSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = createStakeholderSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, lastEngagedAt, ...fields } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  const stakeholder = await db.stakeholder.create({
    data: {
      accountId,
      ...fields,
      lastEngagedAt: toDate(lastEngagedAt),
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Stakeholder",
    entityId: stakeholder.id,
    field: "created",
    oldValue: null,
    newValue: stakeholder.name,
  })

  revalidateAll(accountId, slug)
  return { success: true }
}

export async function updateStakeholder(
  input: z.infer<typeof updateStakeholderSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = updateStakeholderSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, stakeholderId, lastEngagedAt, ...fields } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  const stakeholder = await db.stakeholder.update({
    where: { id: stakeholderId },
    data: {
      ...fields,
      lastEngagedAt: toDate(lastEngagedAt) ?? null,
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Stakeholder",
    entityId: stakeholder.id,
    field: "updated",
    oldValue: null,
    newValue: stakeholder.name,
  })

  revalidateAll(accountId, slug)
  return { success: true }
}

export async function deleteStakeholder(
  input: z.infer<typeof deleteStakeholderSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = deleteStakeholderSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, stakeholderId } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  await db.stakeholder.delete({ where: { id: stakeholderId } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Stakeholder",
    entityId: stakeholderId,
    field: "deleted",
    oldValue: null,
    newValue: null,
  })

  revalidateAll(accountId, slug)
  return { success: true }
}
