import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { WelcomePageEditorForm } from "@/components/admin/accounts/WelcomePageEditorForm"

interface Props {
  params: Promise<{ id: string }>
}

export default async function WelcomePageEditorPage({ params }: Props) {
  const { id } = await params

  const account = await db.account.findUnique({
    where: { id },
    select: {
      welcomePage: {
        select: { id: true, content: true, versions: true },
      },
    },
  })

  if (!account) notFound()

  // Serialize versions to safe shape (omit bulky content field from history list)
  const rawVersions = Array.isArray(account.welcomePage?.versions)
    ? (account.welcomePage.versions as Array<{ content: unknown; savedAt: string; savedBy: string }>)
    : []

  const versions = rawVersions.map((v) => ({
    savedAt: v.savedAt ?? "",
    savedBy: v.savedBy ?? "Unknown",
  }))

  return (
    <WelcomePageEditorForm
      accountId={id}
      initialContent={account.welcomePage?.content ?? null}
      versions={versions}
    />
  )
}
