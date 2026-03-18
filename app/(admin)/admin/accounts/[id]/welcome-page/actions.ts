"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/audit"

const schema = z.object({
  accountId: z.string().cuid(),
  content: z.unknown(),
})

export async function updateWelcomePage(
  input: z.infer<typeof schema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user || !["INTERNAL_ADMIN", "INTERNAL_MEMBER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { accountId, content } = parsed.data

  const account = await db.account.findUnique({
    where: { id: accountId },
    select: {
      slug: true,
      welcomePage: { select: { id: true, content: true, versions: true } },
    },
  })
  if (!account) return { success: false, error: "Account not found" }

  const welcomePage = account.welcomePage
  if (!welcomePage) return { success: false, error: "Welcome page not found" }

  // Build new version entry from current content before overwriting
  const existingVersions = Array.isArray(welcomePage.versions) ? welcomePage.versions : []
  const versionEntry = {
    content: welcomePage.content,
    savedAt: new Date().toISOString(),
    savedBy: session.user.name ?? session.user.email ?? "Unknown",
  }
  const newVersions = [versionEntry, ...existingVersions].slice(0, 10)

  const contentJson = JSON.parse(JSON.stringify(content))

  await db.welcomePage.update({
    where: { id: welcomePage.id },
    data: {
      content: contentJson,
      versions: newVersions,
    },
  })

  await writeAuditLog({
    accountId,
    userId: session.user.id,
    entityType: "WelcomePage",
    entityId: welcomePage.id,
    field: "content",
    oldValue: welcomePage.content ? "set" : null,
    newValue: "updated",
  })

  revalidatePath(`/admin/accounts/${accountId}/welcome-page`)
  revalidatePath(`/${account.slug}/welcome`)

  return { success: true }
}
