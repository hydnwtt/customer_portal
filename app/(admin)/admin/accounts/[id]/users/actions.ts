"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"
import { generateTempPassword, hashPassword } from "@/lib/passwords"

const inviteSchema = z.object({
  accountId: z.string().cuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum([UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_VIEWER]),
})

export type InviteUserInput = z.infer<typeof inviteSchema>

export async function inviteCustomerUser(
  input: InviteUserInput
): Promise<
  | { success: true; tempPassword: string | null }
  | { success: false; error: string }
> {
  const session = await auth()
  if (!session?.user || !["INTERNAL_ADMIN", "INTERNAL_MEMBER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, name, email, role } = parsed.data

  const existingUser = await db.user.findUnique({
    where: { email },
    include: { accounts: { where: { accountId } } },
  })

  let userId: string
  let tempPassword: string | null = null

  if (existingUser) {
    if (existingUser.accounts.length > 0) {
      return { success: false, error: "This user already has access to this account." }
    }
    userId = existingUser.id
    await db.accountUser.create({
      data: { accountId, userId, role },
    })
  } else {
    tempPassword = generateTempPassword()
    const hashedPassword = await hashPassword(tempPassword)
    const newUser = await db.user.create({
      data: { name, email, hashedPassword, role },
    })
    userId = newUser.id
    await db.accountUser.create({
      data: { accountId, userId, role },
    })
  }

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "AccountUser",
    entityId: userId,
    field: "invited",
    newValue: email,
  })

  revalidatePath(`/admin/accounts/${accountId}/users`)
  return { success: true, tempPassword }
}

const revokeSchema = z.object({
  accountId: z.string().cuid(),
  userId: z.string().cuid(),
})

export async function revokeUserAccess(
  input: z.infer<typeof revokeSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user || !["INTERNAL_ADMIN", "INTERNAL_MEMBER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = revokeSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Invalid input" }
  }

  const { accountId, userId } = parsed.data

  await db.accountUser.deleteMany({ where: { accountId, userId } })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "AccountUser",
    entityId: userId,
    field: "revoked",
    newValue: null,
  })

  revalidatePath(`/admin/accounts/${accountId}/users`)
  return { success: true }
}
