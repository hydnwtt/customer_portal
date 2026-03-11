"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { AccountStatus } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isReservedSlug } from "@/lib/utils"
import { writeAuditLog } from "@/lib/audit"

const accountSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  status: z.nativeEnum(AccountStatus),
  pilotStartDate: z.string().optional(),
  goNoGoDate: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  siteNames: z.array(z.string().min(1)).max(20).default([]),
  aeUserId: z.string().cuid().optional().or(z.literal("")),
  csmUserId: z.string().cuid().optional().or(z.literal("")),
  ilUserId: z.string().cuid().optional().or(z.literal("")),
})

export type CreateAccountInput = z.infer<typeof accountSchema>


export async function createAccount(
  input: CreateAccountInput
): Promise<{ success: true; accountId: string } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user || session.user.role !== "INTERNAL_ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const data = parsed.data

  if (isReservedSlug(data.slug)) {
    return { success: false, error: `"${data.slug}" is a reserved slug` }
  }

  const existing = await db.account.findUnique({ where: { slug: data.slug }, select: { id: true } })
  if (existing) {
    return { success: false, error: `Slug "${data.slug}" is already taken` }
  }

  const teamUserIds = [data.aeUserId, data.csmUserId, data.ilUserId]
    .filter((id): id is string => Boolean(id))

  const account = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const acct = await tx.account.create({
      data: {
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl || null,
        status: data.status,
        pilotStartDate: data.pilotStartDate ? new Date(data.pilotStartDate) : null,
        goNoGoDate: data.goNoGoDate ? new Date(data.goNoGoDate) : null,
        primaryColor: data.primaryColor || null,
      },
    })

    await tx.mutualSuccessPlan.create({
      data: { accountId: acct.id },
    })

    await tx.welcomePage.create({
      data: { accountId: acct.id },
    })

    if (data.siteNames.length > 0) {
      await tx.pilotSite.createMany({
        data: data.siteNames.map((name) => ({ accountId: acct.id, name })),
      })
    }

    if (teamUserIds.length > 0) {
      const uniqueIds = [...new Set(teamUserIds)]
      await tx.accountUser.createMany({
        data: uniqueIds.map((userId) => ({
          accountId: acct.id,
          userId,
          role: "INTERNAL_MEMBER" as const,
        })),
        skipDuplicates: true,
      })
    }

    return acct
  })

  await writeAuditLog({
    accountId: account.id,
    userId: session.user.id,
    entityType: "Account",
    entityId: account.id,
    field: "created",
    newValue: data.name,
  })

  revalidatePath("/admin/accounts")
  return { success: true, accountId: account.id }
}

const updateAccountSchema = accountSchema.partial().extend({
  id: z.string().cuid(),
})

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>

export async function updateAccount(
  input: UpdateAccountInput
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user || !["INTERNAL_ADMIN", "INTERNAL_MEMBER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = updateAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { id, slug, ...rest } = parsed.data

  const current = await db.account.findUnique({ where: { id }, select: { slug: true, name: true } })
  if (!current) return { success: false, error: "Account not found" }

  if (slug && slug !== current.slug) {
    if (isReservedSlug(slug)) {
      return { success: false, error: `"${slug}" is a reserved slug` }
    }
    const conflict = await db.account.findFirst({ where: { slug, NOT: { id } }, select: { id: true } })
    if (conflict) return { success: false, error: `Slug "${slug}" is already taken` }
  }

  await db.account.update({
    where: { id },
    data: {
      ...(rest.name !== undefined && { name: rest.name }),
      ...(slug !== undefined && { slug }),
      ...(rest.logoUrl !== undefined && { logoUrl: rest.logoUrl || null }),
      ...(rest.status !== undefined && { status: rest.status }),
      ...(rest.pilotStartDate !== undefined && {
        pilotStartDate: rest.pilotStartDate ? new Date(rest.pilotStartDate) : null,
      }),
      ...(rest.goNoGoDate !== undefined && {
        goNoGoDate: rest.goNoGoDate ? new Date(rest.goNoGoDate) : null,
      }),
      ...(rest.primaryColor !== undefined && { primaryColor: rest.primaryColor || null }),
    },
  })

  await writeAuditLog({
    accountId: id,
    userId: session.user.id,
    entityType: "Account",
    entityId: id,
    field: "updated",
    newValue: rest.name ?? current.name,
  })

  revalidatePath("/admin/accounts")
  revalidatePath(`/admin/accounts/${id}/overview`)
  return { success: true }
}
