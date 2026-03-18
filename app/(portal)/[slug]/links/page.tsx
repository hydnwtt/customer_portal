import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import ResourceLibraryClient from "./ResourceLibraryClient"

export const metadata = { title: "Resources" }

interface Props {
  params: Promise<{ slug: string }>
}

export default async function LinksPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const account = await db.account.findUnique({
    where: { slug },
    select: {
      id: true,
      helpfulLinks: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          url: true,
          category: true,
          description: true,
          thumbnailUrl: true,
          isRequiredReading: true,
        },
      },
    },
  })

  if (!account) notFound()

  const isInternal =
    session?.user?.role === "INTERNAL_ADMIN" || session?.user?.role === "INTERNAL_MEMBER"

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-foreground mb-1">Resource Library</h1>
        <p className="text-sm text-muted-foreground">
          Curated resources, documentation, and training for this pilot.
        </p>
      </div>
      <ResourceLibraryClient
        accountId={account.id}
        resources={account.helpfulLinks}
        isInternal={isInternal}
      />
    </div>
  )
}
