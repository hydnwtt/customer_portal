import { db } from "@/lib/db"
import { SuccessPlanContent } from "@/components/portal/success-plan/SuccessPlanContent"

export const metadata = { title: "Success Plan" }

export default async function SuccessPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const msp = await db.mutualSuccessPlan.findFirst({
    where: { account: { slug } },
    include: {
      successMetrics: {
        include: { owner: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      risks: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!msp) {
    return <SuccessPlanContent msp={null} />
  }

  const serialized = {
    id: msp.id,
    keyPainPoints: msp.keyPainPoints,
    definitionOfDone: msp.definitionOfDone,
    outOfScope: msp.outOfScope,
    expansionOpportunities: msp.expansionOpportunities,
    successMetrics: msp.successMetrics.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      baselineValue: m.baselineValue,
      targetValue: m.targetValue,
      currentValue: m.currentValue,
      status: m.status,
      ownerName: m.owner?.name ?? null,
    })),
    risks: msp.risks.map((r) => ({
      id: r.id,
      description: r.description,
      severity: r.severity,
      mitigationPlan: r.mitigationPlan,
      owner: r.owner,
    })),
  }

  return <SuccessPlanContent msp={serialized} />
}
