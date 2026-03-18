"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { textToTiptapJson, tiptapJsonToText } from "@/lib/tiptap-text"
import { writeAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"

async function requireInternal() {
  const session = await auth()
  if (
    session?.user?.role !== "INTERNAL_ADMIN" &&
    session?.user?.role !== "INTERNAL_MEMBER"
  ) {
    throw new Error("Unauthorized")
  }
  return session
}

type VersionEntry = { content: string; savedAt: string; savedBy: string }

export async function saveWelcomeContent(accountId: string, content: string) {
  try {
    const session = await requireInternal()

    const existing = await db.welcomePage.findUnique({
      where: { accountId },
      select: { id: true, content: true, versions: true },
    })

    // Build version history: prepend current content as a version, keep last 10
    const existingVersions: VersionEntry[] = Array.isArray(existing?.versions)
      ? (existing.versions as VersionEntry[])
      : []

    const oldText = existing?.content ? tiptapJsonToText(existing.content) : null

    const newVersions: VersionEntry[] = oldText
      ? [
          { content: oldText, savedAt: new Date().toISOString(), savedBy: session.user?.name ?? "Unknown" },
          ...existingVersions,
        ].slice(0, 10)
      : existingVersions

    const tiptapContent = textToTiptapJson(content)

    if (existing) {
      await db.welcomePage.update({
        where: { accountId },
        data: {
          content: tiptapContent as object,
          versions: newVersions as object[],
        },
      })
    } else {
      await db.welcomePage.create({
        data: {
          accountId,
          content: tiptapContent as object,
          versions: newVersions as object[],
        },
      })
    }

    await writeAuditLog({
      entityType: "WelcomePage",
      entityId: accountId,
      accountId,
      userId: session.user?.id,
      field: "content",
      oldValue: oldText ?? null,
      newValue: content,
    })

    const account = await db.account.findUnique({ where: { id: accountId }, select: { slug: true } })
    if (account) revalidatePath(`/${account.slug}/welcome`)

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save" }
  }
}
