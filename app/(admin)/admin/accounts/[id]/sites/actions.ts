"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"

function assertInternal(role: string | undefined) {
  if (role !== "INTERNAL_ADMIN" && role !== "INTERNAL_MEMBER") {
    throw new Error("Unauthorized")
  }
}

const createPilotSiteSchema = z.object({
  accountId: z.string().cuid(),
  name: z.string().min(1).max(200),
})

const deletePilotSiteSchema = z.object({
  accountId: z.string().cuid(),
  siteId: z.string().cuid(),
})

export async function createPilotSite(
  input: z.infer<typeof createPilotSiteSchema>
): Promise<{ success: true; site: { id: string; name: string } } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    assertInternal(session.user.role)
  } catch {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = createPilotSiteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, name } = parsed.data

  const site = await db.pilotSite.create({
    data: { accountId, name },
    select: { id: true, name: true },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "PilotSite",
    entityId: site.id,
    field: "created",
    newValue: name,
  })

  revalidatePath(`/admin/accounts/${accountId}/overview`)

  return { success: true, site }
}

export async function deletePilotSite(
  input: z.infer<typeof deletePilotSiteSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    assertInternal(session.user.role)
  } catch {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = deletePilotSiteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, siteId } = parsed.data

  const site = await db.pilotSite.findUnique({ where: { id: siteId } })
  if (!site || site.accountId !== accountId) {
    return { success: false, error: "Site not found" }
  }

  await db.pilotSite.delete({ where: { id: siteId } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "PilotSite",
    entityId: siteId,
    field: "deleted",
    oldValue: site.name,
  })

  revalidatePath(`/admin/accounts/${accountId}/overview`)

  return { success: true }
}
