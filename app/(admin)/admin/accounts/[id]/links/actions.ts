"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
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

async function getSlug(accountId: string) {
  const account = await db.account.findUnique({
    where: { id: accountId },
    select: { slug: true },
  })
  return account?.slug ?? null
}

function revalidateAll(accountId: string, slug: string) {
  revalidatePath(`/admin/accounts/${accountId}/links`)
  revalidatePath(`/${slug}/links`)
  revalidatePath(`/${slug}/welcome`)
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createLinkSchema = z.object({
  accountId: z.string().cuid(),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  category: z.string().min(1).max(100).default("Documentation"),
  description: z.string().max(500).optional(),
  isRequiredReading: z.boolean().default(false),
})

const updateLinkSchema = z.object({
  accountId: z.string().cuid(),
  linkId: z.string().cuid(),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  category: z.string().min(1).max(100).default("Documentation"),
  description: z.string().max(500).optional(),
  isRequiredReading: z.boolean().default(false),
})

const deleteLinkSchema = z.object({
  accountId: z.string().cuid(),
  linkId: z.string().cuid(),
})

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createLink(
  input: z.infer<typeof createLinkSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = createLinkSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, ...fields } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  const link = await db.helpfulLink.create({
    data: { accountId, ...fields },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "HelpfulLink",
    entityId: link.id,
    field: "created",
    oldValue: null,
    newValue: link.title,
  })

  revalidateAll(accountId, slug)
  return { success: true }
}

export async function updateLink(
  input: z.infer<typeof updateLinkSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = updateLinkSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, linkId, ...fields } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  const link = await db.helpfulLink.update({
    where: { id: linkId },
    data: fields,
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "HelpfulLink",
    entityId: link.id,
    field: "updated",
    oldValue: null,
    newValue: link.title,
  })

  revalidateAll(accountId, slug)
  return { success: true }
}

export async function deleteLink(
  input: z.infer<typeof deleteLinkSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = deleteLinkSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, linkId } = parsed.data
  const slug = await getSlug(accountId)
  if (!slug) return { success: false, error: "Account not found" }

  await db.helpfulLink.delete({ where: { id: linkId } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "HelpfulLink",
    entityId: linkId,
    field: "deleted",
    oldValue: null,
    newValue: null,
  })

  revalidateAll(accountId, slug)
  return { success: true }
}
