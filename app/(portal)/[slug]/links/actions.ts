"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
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

const VALID_CATEGORIES = ["Documentation", "Training", "Support", "Product Updates", "Legal", "Proposals", "Other"] as const

const resourceSchema = z.object({
  accountId: z.string().cuid(),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  category: z.enum(VALID_CATEGORIES),
  description: z.string().max(500).optional().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  isRequiredReading: z.boolean().default(false),
})

export async function createResource(
  input: z.infer<typeof resourceSchema>
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = resourceSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  const link = await db.helpfulLink.create({
    data: {
      accountId: data.accountId,
      title: data.title,
      url: data.url,
      category: data.category,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
      isRequiredReading: data.isRequiredReading,
    },
  })

  await writeAuditLog({
    accountId: data.accountId,
    userId: user.id,
    entityType: "HelpfulLink",
    entityId: link.id,
    field: "created",
    newValue: data.title,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true, id: link.id }
}

const updateResourceSchema = resourceSchema.partial().extend({
  id: z.string().cuid(),
  accountId: z.string().cuid(),
})

export async function updateResource(
  input: z.infer<typeof updateResourceSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = updateResourceSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const { id, accountId, ...rest } = parsed.data

  await db.helpfulLink.update({
    where: { id },
    data: {
      ...(rest.title !== undefined && { title: rest.title }),
      ...(rest.url !== undefined && { url: rest.url }),
      ...(rest.category !== undefined && { category: rest.category }),
      ...(rest.description !== undefined && { description: rest.description || null }),
      ...(rest.thumbnailUrl !== undefined && { thumbnailUrl: rest.thumbnailUrl || null }),
      ...(rest.isRequiredReading !== undefined && { isRequiredReading: rest.isRequiredReading }),
    },
  })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "HelpfulLink",
    entityId: id,
    field: "updated",
    newValue: rest.title,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

export async function deleteResource(
  id: string,
  accountId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternal()
  if (!user) return { success: false, error: "Unauthorized" }

  await db.helpfulLink.delete({ where: { id } })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

export const RESOURCE_CATEGORIES = VALID_CATEGORIES
