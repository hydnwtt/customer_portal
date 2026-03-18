import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { HelpfulLinksSection } from "@/components/admin/accounts/HelpfulLinksSection"

export const metadata = { title: "Links" }

export default async function LinksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const account = await db.account.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!account) notFound()

  const links = await db.helpfulLink.findMany({
    where: { accountId: id },
    orderBy: { createdAt: "asc" },
  })

  return <HelpfulLinksSection accountId={id} links={links} />
}
