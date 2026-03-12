import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { MutualSuccessPlanForm } from "@/components/admin/accounts/MutualSuccessPlanForm"
import { SuccessMetricsTable } from "@/components/admin/accounts/SuccessMetricsTable"
import { RisksTable } from "@/components/admin/accounts/RisksTable"

export const metadata = { title: "Success Plan" }

export default async function SuccessPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const account = await db.account.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!account) notFound()

  // Upsert guarantees the MSP record exists
  const msp = await db.mutualSuccessPlan.upsert({
    where: { accountId: id },
    update: {},
    create: { accountId: id },
    include: {
      successMetrics: {
        include: { owner: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      risks: { orderBy: { createdAt: "asc" } },
    },
  })

  // Account users for the owner dropdown on metrics
  const accountUsers = await db.accountUser.findMany({
    where: { accountId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })

  // Serialize metrics
  const serializedMetrics = msp.successMetrics.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    baselineValue: m.baselineValue,
    targetValue: m.targetValue,
    currentValue: m.currentValue,
    status: m.status,
    ownerId: m.ownerId,
    ownerName: m.owner?.name ?? null,
    ownerEmail: m.owner?.email ?? null,
    createdAt: m.createdAt.toISOString(),
  }))

  // Serialize risks
  const serializedRisks = msp.risks.map((r) => ({
    id: r.id,
    description: r.description,
    severity: r.severity,
    mitigationPlan: r.mitigationPlan,
    owner: r.owner,
    createdAt: r.createdAt.toISOString(),
  }))

  // Account users for dropdown
  const users = accountUsers.map((au) => ({
    id: au.user.id,
    name: au.user.name,
    email: au.user.email,
  }))

  return (
    <div className="space-y-10">
      <MutualSuccessPlanForm
        accountId={id}
        initialKeyPainPoints={msp.keyPainPoints}
        initialDefinitionOfDone={msp.definitionOfDone}
        initialOutOfScope={msp.outOfScope}
        initialExpansionOpportunities={msp.expansionOpportunities}
      />

      <div className="border-t pt-8">
        <SuccessMetricsTable
          accountId={id}
          mspId={msp.id}
          metrics={serializedMetrics}
          accountUsers={users}
        />
      </div>

      <div className="border-t pt-8">
        <RisksTable accountId={id} mspId={msp.id} risks={serializedRisks} />
      </div>
    </div>
  )
}
