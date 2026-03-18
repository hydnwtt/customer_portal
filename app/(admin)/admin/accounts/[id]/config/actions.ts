"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"
import { parseAccountConfig, type AccountConfig } from "@/lib/account-config"

const configSchema = z.object({
  accountId: z.string().cuid(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  enableRoiCalculator: z.boolean(),
  enableHelpfulLinks: z.boolean(),
  enableTimeline: z.boolean(),
  enableStakeholders: z.boolean(),
  enableSuccessMetrics: z.boolean(),
  enableWelcomePage: z.boolean(),
  enableCalcSpeedOfService: z.boolean(),
  enableCalcLossPrevention: z.boolean(),
  enableCalcLaborOptimization: z.boolean(),
  enableCalcMultiSiteTCO: z.boolean(),
  enableCalcDMTimeSavings: z.boolean(),
})

export type UpdateAccountConfigInput = z.infer<typeof configSchema>

export async function updateAccountConfig(
  input: UpdateAccountConfigInput
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user || !["INTERNAL_ADMIN", "INTERNAL_MEMBER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = configSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, logoUrl, primaryColor, ...flags } = parsed.data

  const account = await db.account.findUnique({
    where: { id: accountId },
    select: { config: true, slug: true },
  })
  if (!account) return { success: false, error: "Account not found" }

  const existingConfig = parseAccountConfig(account.config)
  const newConfig: AccountConfig = { ...existingConfig, ...flags }

  const changedFields: string[] = []
  for (const key of Object.keys(flags) as (keyof AccountConfig)[]) {
    if (flags[key] !== existingConfig[key]) {
      changedFields.push(key)
    }
  }
  if (logoUrl !== undefined) changedFields.push("logoUrl")
  if (primaryColor !== undefined) changedFields.push("primaryColor")

  // Cast AccountConfig to a plain object for Prisma's JSON field
  const configJson = JSON.parse(JSON.stringify(newConfig))

  await db.account.update({
    where: { id: accountId },
    data: {
      config: configJson,
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(primaryColor !== undefined && { primaryColor: primaryColor || null }),
    },
  })

  for (const field of changedFields) {
    const oldVal = (existingConfig as unknown as Record<string, unknown>)[field]
    const newVal = (newConfig as unknown as Record<string, unknown>)[field] ??
      (flags as Record<string, unknown>)[field]
    await writeAuditLog({
      accountId,
      userId: session.user.id,
      entityType: "Account",
      entityId: accountId,
      field,
      oldValue: oldVal !== undefined ? String(oldVal) : null,
      newValue: newVal !== undefined ? String(newVal) : null,
    })
  }

  revalidatePath(`/admin/accounts/${accountId}/config`)
  revalidatePath(`/${account.slug}`)
  return { success: true }
}
