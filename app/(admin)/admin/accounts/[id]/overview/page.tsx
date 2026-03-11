import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { OverviewClient } from "./OverviewClient"
import type { Prisma } from "@prisma/client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OverviewPage({ params }: Props) {
  const { id } = await params

  const account = await db.account.findUnique({
    where: { id },
    include: {
      pilotSites: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      users: {
        where: { user: { role: { in: ["INTERNAL_ADMIN", "INTERNAL_MEMBER"] } } },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!account) notFound()

  const teamMembers = account.users.map(
    (au: Prisma.AccountUserGetPayload<{ include: { user: { select: { id: true; name: true; email: true } } } }>) =>
      au.user
  )

  return (
    <OverviewClient
      account={{
        id: account.id,
        name: account.name,
        slug: account.slug,
        logoUrl: account.logoUrl,
        status: account.status,
        pilotStartDate: account.pilotStartDate?.toISOString() ?? null,
        goNoGoDate: account.goNoGoDate?.toISOString() ?? null,
        primaryColor: account.primaryColor,
        pilotSites: account.pilotSites,
        teamMembers,
      }}
    />
  )
}
