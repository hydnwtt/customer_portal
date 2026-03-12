import { db } from "@/lib/db"
import { StakeholdersContent } from "@/components/portal/stakeholders/StakeholdersContent"

export const metadata = { title: "Stakeholders" }

export default async function StakeholdersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const stakeholders = await db.stakeholder.findMany({
    where: { account: { slug } },
    orderBy: [{ company: "asc" }, { involvementLevel: "asc" }],
    select: {
      id: true,
      name: true,
      company: true,
      title: true,
      email: true,
      involvementLevel: true,
    },
  })

  return <StakeholdersContent stakeholders={stakeholders} />
}
