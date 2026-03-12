"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { MetricStatus, RiskSeverity } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isInternal(role: string) {
  return role === "INTERNAL_ADMIN" || role === "INTERNAL_MEMBER"
}

async function assertInternal() {
  const session = await auth()
  if (!session?.user || !isInternal(session.user.role)) return null
  return session
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toJson(value: unknown): any {
  return JSON.parse(JSON.stringify(value))
}

// ─── Narrative ────────────────────────────────────────────────────────────────

const narrativeSchema = z.object({
  accountId: z.string().cuid(),
  keyPainPoints: z.unknown().optional(),
  definitionOfDone: z.unknown().optional(),
  outOfScope: z.unknown().optional(),
  expansionOpportunities: z.unknown().optional(),
})

export async function updateMutualSuccessPlan(
  input: z.infer<typeof narrativeSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = narrativeSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, keyPainPoints, definitionOfDone, outOfScope, expansionOpportunities } =
    parsed.data

  const account = await db.account.findUnique({
    where: { id: accountId },
    select: { slug: true },
  })
  if (!account) return { success: false, error: "Account not found" }

  const msp = await db.mutualSuccessPlan.upsert({
    where: { accountId },
    update: {
      ...(keyPainPoints !== undefined && { keyPainPoints: toJson(keyPainPoints) }),
      ...(definitionOfDone !== undefined && { definitionOfDone: toJson(definitionOfDone) }),
      ...(outOfScope !== undefined && { outOfScope: toJson(outOfScope) }),
      ...(expansionOpportunities !== undefined && {
        expansionOpportunities: toJson(expansionOpportunities),
      }),
    },
    create: {
      accountId,
      keyPainPoints: keyPainPoints ? toJson(keyPainPoints) : undefined,
      definitionOfDone: definitionOfDone ? toJson(definitionOfDone) : undefined,
      outOfScope: outOfScope ? toJson(outOfScope) : undefined,
      expansionOpportunities: expansionOpportunities ? toJson(expansionOpportunities) : undefined,
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "MutualSuccessPlan",
    entityId: msp.id,
    field: "narrative",
    oldValue: null,
    newValue: "updated",
  })

  revalidatePath(`/admin/accounts/${accountId}/success-plan`)
  revalidatePath(`/${account.slug}/success-plan`)

  return { success: true }
}

// ─── Success Metrics ──────────────────────────────────────────────────────────

const createMetricSchema = z.object({
  accountId: z.string().cuid(),
  mspId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  baselineValue: z.string().max(100).optional(),
  targetValue: z.string().max(100).optional(),
  currentValue: z.string().max(100).optional(),
  status: z.nativeEnum(MetricStatus).default(MetricStatus.NOT_STARTED),
  ownerId: z.string().cuid().optional(),
})

export async function createSuccessMetric(
  input: z.infer<typeof createMetricSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = createMetricSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, mspId, ownerId, ...fields } = parsed.data

  const account = await db.account.findUnique({ where: { id: accountId }, select: { slug: true } })
  if (!account) return { success: false, error: "Account not found" }

  const metric = await db.successMetric.create({
    data: {
      mspId,
      ...fields,
      ownerId: ownerId ?? null,
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "SuccessMetric",
    entityId: metric.id,
    field: "created",
    oldValue: null,
    newValue: metric.name,
  })

  revalidatePath(`/admin/accounts/${accountId}/success-plan`)
  revalidatePath(`/${account.slug}/success-plan`)

  return { success: true }
}

const updateMetricSchema = z.object({
  accountId: z.string().cuid(),
  metricId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  baselineValue: z.string().max(100).optional(),
  targetValue: z.string().max(100).optional(),
  currentValue: z.string().max(100).optional(),
  status: z.nativeEnum(MetricStatus),
  ownerId: z.string().cuid().optional(),
})

export async function updateSuccessMetric(
  input: z.infer<typeof updateMetricSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = updateMetricSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, metricId, ownerId, ...fields } = parsed.data

  const account = await db.account.findUnique({ where: { id: accountId }, select: { slug: true } })
  if (!account) return { success: false, error: "Account not found" }

  const metric = await db.successMetric.update({
    where: { id: metricId },
    data: { ...fields, ownerId: ownerId ?? null },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "SuccessMetric",
    entityId: metric.id,
    field: "updated",
    oldValue: null,
    newValue: metric.name,
  })

  revalidatePath(`/admin/accounts/${accountId}/success-plan`)
  revalidatePath(`/${account.slug}/success-plan`)

  return { success: true }
}

const deleteMetricSchema = z.object({
  accountId: z.string().cuid(),
  metricId: z.string().cuid(),
})

export async function deleteSuccessMetric(
  input: z.infer<typeof deleteMetricSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = deleteMetricSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, metricId } = parsed.data

  const account = await db.account.findUnique({ where: { id: accountId }, select: { slug: true } })
  if (!account) return { success: false, error: "Account not found" }

  await db.successMetric.delete({ where: { id: metricId } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "SuccessMetric",
    entityId: metricId,
    field: "deleted",
    oldValue: null,
    newValue: null,
  })

  revalidatePath(`/admin/accounts/${accountId}/success-plan`)
  revalidatePath(`/${account.slug}/success-plan`)

  return { success: true }
}

// ─── Risks ────────────────────────────────────────────────────────────────────

const createRiskSchema = z.object({
  accountId: z.string().cuid(),
  mspId: z.string().cuid(),
  description: z.string().min(1).max(1000),
  severity: z.nativeEnum(RiskSeverity).default(RiskSeverity.MEDIUM),
  mitigationPlan: z.string().max(1000).optional(),
  owner: z.string().max(200).optional(),
})

export async function createRisk(
  input: z.infer<typeof createRiskSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = createRiskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, mspId, ...fields } = parsed.data

  const account = await db.account.findUnique({ where: { id: accountId }, select: { slug: true } })
  if (!account) return { success: false, error: "Account not found" }

  const risk = await db.risk.create({ data: { mspId, ...fields } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Risk",
    entityId: risk.id,
    field: "created",
    oldValue: null,
    newValue: fields.severity,
  })

  revalidatePath(`/admin/accounts/${accountId}/success-plan`)
  revalidatePath(`/${account.slug}/success-plan`)

  return { success: true }
}

const updateRiskSchema = z.object({
  accountId: z.string().cuid(),
  riskId: z.string().cuid(),
  description: z.string().min(1).max(1000),
  severity: z.nativeEnum(RiskSeverity),
  mitigationPlan: z.string().max(1000).optional(),
  owner: z.string().max(200).optional(),
})

export async function updateRisk(
  input: z.infer<typeof updateRiskSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = updateRiskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, riskId, ...fields } = parsed.data

  const account = await db.account.findUnique({ where: { id: accountId }, select: { slug: true } })
  if (!account) return { success: false, error: "Account not found" }

  const risk = await db.risk.update({ where: { id: riskId }, data: fields })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Risk",
    entityId: risk.id,
    field: "updated",
    oldValue: null,
    newValue: fields.severity,
  })

  revalidatePath(`/admin/accounts/${accountId}/success-plan`)
  revalidatePath(`/${account.slug}/success-plan`)

  return { success: true }
}

const deleteRiskSchema = z.object({
  accountId: z.string().cuid(),
  riskId: z.string().cuid(),
})

export async function deleteRisk(
  input: z.infer<typeof deleteRiskSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await assertInternal()
  if (!session) return { success: false, error: "Unauthorized" }

  const parsed = deleteRiskSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, riskId } = parsed.data

  const account = await db.account.findUnique({ where: { id: accountId }, select: { slug: true } })
  if (!account) return { success: false, error: "Account not found" }

  await db.risk.delete({ where: { id: riskId } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "Risk",
    entityId: riskId,
    field: "deleted",
    oldValue: null,
    newValue: null,
  })

  revalidatePath(`/admin/accounts/${accountId}/success-plan`)
  revalidatePath(`/${account.slug}/success-plan`)

  return { success: true }
}
