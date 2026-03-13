"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"
import { generateTempPassword, hashPassword } from "@/lib/passwords"
import { generateInviteToken } from "@/lib/invite-token"
import { sendTeamInviteEmail } from "@/lib/email"

// ─── Invite Internal User ────────────────────────────────────────────────────

const inviteSchema = z.object({
  name: z.string().min(1, "Required").max(100),
  email: z.string().email("Must be a valid email"),
  role: z.enum([UserRole.INTERNAL_ADMIN, UserRole.INTERNAL_MEMBER]),
})

export type InviteInternalUserInput = z.infer<typeof inviteSchema>

export async function inviteInternalUser(
  input: InviteInternalUserInput
): Promise<
  | { success: true; tempPassword: string | null }
  | { success: false; error: string }
> {
  const session = await auth()
  if (session?.user?.role !== "INTERNAL_ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { name, email, role } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: "A user with this email already exists." }
  }

  const tempPassword = generateTempPassword()
  const hashedPassword = await hashPassword(tempPassword)

  const newUser = await db.user.create({
    data: { name, email, hashedPassword, role },
  })

  await writeAuditLog({
    userId: session.user.id,
    entityType: "User",
    entityId: newUser.id,
    field: "invited",
    newValue: `${email} (${role})`,
  })

  revalidatePath("/admin/users")

  // Attempt to send invite email
  try {
    const token = generateInviteToken({ userId: newUser.id, accountSlug: "" })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const inviteUrl = `${appUrl}/auth/accept-invite?token=${token}`
    const emailResult = await sendTeamInviteEmail({ to: email, name, inviteUrl })
    if (emailResult.success) {
      return { success: true, tempPassword: null } // email sent — don't show temp password
    }
  } catch (err) {
    console.error("[invite] Failed to send team invite email:", err)
  }

  // Email failed — fall back to showing the temp password
  return { success: true, tempPassword }
}

// ─── Remove Internal User ────────────────────────────────────────────────────

const removeSchema = z.object({
  userId: z.string().cuid(),
})

export async function removeInternalUser(
  input: z.infer<typeof removeSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (session?.user?.role !== "INTERNAL_ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = removeSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Invalid input" }
  }

  const { userId } = parsed.data

  if (userId === session.user.id) {
    return { success: false, error: "You cannot remove your own account." }
  }

  await db.user.delete({ where: { id: userId } })

  await writeAuditLog({
    userId: session.user.id,
    entityType: "User",
    entityId: userId,
    field: "removed",
    newValue: null,
  })

  revalidatePath("/admin/users")
  return { success: true }
}
