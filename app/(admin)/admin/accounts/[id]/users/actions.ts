"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"
import { generateTempPassword, hashPassword } from "@/lib/passwords"
import { generateInviteToken } from "@/lib/invite-token"
import { sendInviteEmail } from "@/lib/email"

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

  // Fetch account for name + slug (needed for email)
  const account = await db.account.findUnique({
    where: { id: accountId },
    select: { name: true, slug: true },
  })
  if (!account) return { success: false, error: "Account not found" }

  const existingUser = await db.user.findUnique({
    where: { email },
    include: { accounts: { where: { accountId } } },
  })

  let userId: string
  let tempPassword: string | null = null
  let isNewUser = false

  if (existingUser) {
    if (existingUser.accounts.length > 0) {
      return { success: false, error: "This user already has access to this account." }
    }
    userId = existingUser.id
    await db.accountUser.create({
      data: { accountId, userId, role },
    })
  } else {
    // Generate a temp password as fallback if email sending fails
    tempPassword = generateTempPassword()
    const hashedPassword = await hashPassword(tempPassword)
    const newUser = await db.user.create({
      data: { name, email, hashedPassword, role },
    })
    userId = newUser.id
    isNewUser = true
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

  // Attempt to send invite email for new users
  if (isNewUser) {
    try {
      const token = generateInviteToken({ userId, accountSlug: account.slug })
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
      const inviteUrl = `${appUrl}/auth/accept-invite?token=${token}`
      const emailResult = await sendInviteEmail({
        to: email,
        name,
        accountName: account.name,
        inviteUrl,
      })
      if (emailResult.success) {
        return { success: true, tempPassword: null } // email sent — don't show temp password
      }
    } catch (err) {
      console.error("[invite] Failed to send invite email:", err)
    }
    // Email failed — fall back to showing the temp password
    return { success: true, tempPassword }
  }

  return { success: true, tempPassword: null }
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
