import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { StakeholdersSection } from "@/components/admin/accounts/StakeholdersSection"

export const metadata = { title: "Stakeholders" }

export default async function StakeholdersPage({
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

  const stakeholders = await db.stakeholder.findMany({
    where: { accountId: id },
    orderBy: { createdAt: "asc" },
  })

  const serialized = stakeholders.map((s) => ({
    id: s.id,
    name: s.name,
    company: s.company,
    title: s.title,
    email: s.email,
    phone: s.phone,
    involvementLevel: s.involvementLevel,
    lastEngagedAt: s.lastEngagedAt?.toISOString() ?? null,
    notes: s.notes,
  }))

  return <StakeholdersSection accountId={id} stakeholders={serialized} />
}
