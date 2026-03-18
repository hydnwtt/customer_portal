"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { MetricStatus, RiskSeverity, StakeholderCompany, InvolvementLevel } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"
import { textToTiptapJson } from "@/lib/tiptap-text"

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireInternalOrCustomerAdmin(accountId?: string) {
  const session = await auth()
  if (!session?.user) return null
  const { role } = session.user
  if (role === "INTERNAL_ADMIN" || role === "INTERNAL_MEMBER") return session.user
  if ((role === "CUSTOMER_ADMIN") && accountId) {
    const link = await db.accountUser.findFirst({
      where: { userId: session.user.id, accountId },
      select: { id: true },
    })
    if (link) return session.user
  }
  return null
}

// ─── MSP Pilot Details ────────────────────────────────────────────────────────

const pilotDetailsSchema = z.object({
  accountId: z.string().cuid(),
  keyPainPoints: z.string().max(5000).default(""),
  definitionOfDone: z.string().max(5000).default(""),
  outOfScope: z.string().max(5000).default(""),
  expansionOpportunities: z.string().max(5000).default(""),
})

export async function updatePilotDetails(
  input: z.infer<typeof pilotDetailsSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(input.accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = pilotDetailsSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  const msp = await db.mutualSuccessPlan.findUnique({
    where: { accountId: data.accountId },
    select: { id: true },
  })
  if (!msp) return { success: false, error: "MSP not found" }

  await db.mutualSuccessPlan.update({
    where: { id: msp.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      keyPainPoints: textToTiptapJson(data.keyPainPoints) as any,
      definitionOfDone: textToTiptapJson(data.definitionOfDone) as any,
      outOfScope: textToTiptapJson(data.outOfScope) as any,
      expansionOpportunities: textToTiptapJson(data.expansionOpportunities) as any,
    },
  })

  await writeAuditLog({
    accountId: data.accountId,
    userId: user.id,
    entityType: "MutualSuccessPlan",
    entityId: msp.id,
    field: "updated",
    newValue: "pilot details",
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

// ─── Success Metrics ──────────────────────────────────────────────────────────

const metricSchema = z.object({
  accountId: z.string().cuid(),
  mspId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  baselineValue: z.string().max(100).optional().or(z.literal("")),
  targetValue: z.string().max(100).optional().or(z.literal("")),
  currentValue: z.string().max(100).optional().or(z.literal("")),
  status: z.nativeEnum(MetricStatus),
  ownerId: z.string().cuid().optional().or(z.literal("")),
})

export async function createSuccessMetric(
  input: z.infer<typeof metricSchema>
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(input.accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = metricSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  const metric = await db.successMetric.create({
    data: {
      mspId: data.mspId,
      name: data.name,
      description: data.description || null,
      baselineValue: data.baselineValue || null,
      targetValue: data.targetValue || null,
      currentValue: data.currentValue || null,
      status: data.status,
      ownerId: data.ownerId || null,
    },
  })

  await writeAuditLog({
    accountId: data.accountId,
    userId: user.id,
    entityType: "SuccessMetric",
    entityId: metric.id,
    field: "created",
    newValue: data.name,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true, id: metric.id }
}

const updateMetricSchema = metricSchema.partial().extend({
  id: z.string().cuid(),
  accountId: z.string().cuid(),
})

export async function updateSuccessMetric(
  input: z.infer<typeof updateMetricSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(input.accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = updateMetricSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const { id, accountId, mspId, ...rest } = parsed.data

  await db.successMetric.update({
    where: { id },
    data: {
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.description !== undefined && { description: rest.description || null }),
      ...(rest.baselineValue !== undefined && { baselineValue: rest.baselineValue || null }),
      ...(rest.targetValue !== undefined && { targetValue: rest.targetValue || null }),
      ...(rest.currentValue !== undefined && { currentValue: rest.currentValue || null }),
      ...(rest.status !== undefined && { status: rest.status }),
      ...(rest.ownerId !== undefined && { ownerId: rest.ownerId || null }),
    },
  })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "SuccessMetric",
    entityId: id,
    field: "updated",
    newValue: rest.name,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

export async function deleteSuccessMetric(
  id: string,
  accountId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  await db.successMetric.delete({ where: { id } })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "SuccessMetric",
    entityId: id,
    field: "deleted",
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

// ─── Stakeholders ─────────────────────────────────────────────────────────────

const stakeholderSchema = z.object({
  accountId: z.string().cuid(),
  name: z.string().min(1).max(200),
  company: z.nativeEnum(StakeholderCompany),
  title: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email(),
  phone: z.string().max(50).optional().or(z.literal("")),
  involvementLevel: z.nativeEnum(InvolvementLevel),
  lastEngagedAt: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
})

export async function createStakeholder(
  input: z.infer<typeof stakeholderSchema>
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(input.accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = stakeholderSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  const stakeholder = await db.stakeholder.create({
    data: {
      accountId: data.accountId,
      name: data.name,
      company: data.company,
      title: data.title || null,
      email: data.email,
      phone: data.phone || null,
      involvementLevel: data.involvementLevel,
      lastEngagedAt: data.lastEngagedAt ? new Date(data.lastEngagedAt) : null,
      notes: data.notes || null,
    },
  })

  await writeAuditLog({
    accountId: data.accountId,
    userId: user.id,
    entityType: "Stakeholder",
    entityId: stakeholder.id,
    field: "created",
    newValue: data.name,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true, id: stakeholder.id }
}

const updateStakeholderSchema = stakeholderSchema.partial().extend({
  id: z.string().cuid(),
  accountId: z.string().cuid(),
})

export async function updateStakeholder(
  input: z.infer<typeof updateStakeholderSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(input.accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = updateStakeholderSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const { id, accountId, ...rest } = parsed.data

  await db.stakeholder.update({
    where: { id },
    data: {
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.company !== undefined && { company: rest.company }),
      ...(rest.title !== undefined && { title: rest.title || null }),
      ...(rest.email !== undefined && { email: rest.email }),
      ...(rest.phone !== undefined && { phone: rest.phone || null }),
      ...(rest.involvementLevel !== undefined && { involvementLevel: rest.involvementLevel }),
      ...(rest.lastEngagedAt !== undefined && {
        lastEngagedAt: rest.lastEngagedAt ? new Date(rest.lastEngagedAt) : null,
      }),
      ...(rest.notes !== undefined && { notes: rest.notes || null }),
    },
  })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "Stakeholder",
    entityId: id,
    field: "updated",
    newValue: rest.name,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

export async function deleteStakeholder(
  id: string,
  accountId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  await db.stakeholder.delete({ where: { id } })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "Stakeholder",
    entityId: id,
    field: "deleted",
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}

// ─── Known Risks ──────────────────────────────────────────────────────────────

const riskSchema = z.object({
  accountId: z.string().cuid(),
  mspId: z.string().cuid(),
  description: z.string().min(1).max(500),
  severity: z.nativeEnum(RiskSeverity),
  mitigationPlan: z.string().max(500).optional().or(z.literal("")),
  owner: z.string().max(200).optional().or(z.literal("")),
})

export async function createRisk(
  input: z.infer<typeof riskSchema>
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(input.accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = riskSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  const data = parsed.data

  const risk = await db.risk.create({
    data: {
      mspId: data.mspId,
      description: data.description,
      severity: data.severity,
      mitigationPlan: data.mitigationPlan || null,
      owner: data.owner || null,
    },
  })

  await writeAuditLog({
    accountId: data.accountId,
    userId: user.id,
    entityType: "Risk",
    entityId: risk.id,
    field: "created",
    newValue: data.description,
  })

  revalidatePath(`/admin/accounts`)
  return { success: true, id: risk.id }
}

export async function deleteRisk(
  id: string,
  accountId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireInternalOrCustomerAdmin(accountId)
  if (!user) return { success: false, error: "Unauthorized" }

  await db.risk.delete({ where: { id } })

  await writeAuditLog({
    accountId,
    userId: user.id,
    entityType: "Risk",
    entityId: id,
    field: "deleted",
  })

  revalidatePath(`/admin/accounts`)
  return { success: true }
}
