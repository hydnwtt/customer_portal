"use server"

import { z } from "zod"
import { signIn } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/passwords"
import { verifyInviteToken } from "@/lib/invite-token"
import { isRedirectError } from "next/dist/client/components/redirect-error"

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function acceptInvite(
  input: z.infer<typeof acceptInviteSchema>
): Promise<{ success: false; error: string }> {
  const parsed = acceptInviteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { token, password } = parsed.data

  const payload = verifyInviteToken(token)
  if (!payload) {
    return { success: false, error: "This invite link is invalid or has expired." }
  }

  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    return { success: false, error: "User not found." }
  }

  await db.user.update({
    where: { id: user.id },
    data: { hashedPassword: await hashPassword(password) },
  })

  // Determine redirect based on role — internal users go to admin, customers to their portal
  const isInternal = user.role === "INTERNAL_ADMIN" || user.role === "INTERNAL_MEMBER"
  const redirectTo = isInternal ? "/admin/accounts" : `/${payload.accountSlug}/welcome`

  // Sign the user in immediately — this throws a NEXT_REDIRECT which we re-throw
  try {
    await signIn("credentials", {
      email: user.email,
      password,
      redirectTo,
    })
  } catch (error) {
    if (isRedirectError(error)) throw error
    return { success: false, error: "Password saved, but sign-in failed. Please sign in manually." }
  }

  // This line is never reached due to the redirect above
  return { success: false, error: "Unexpected error." }
}
