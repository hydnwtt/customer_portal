import { db } from "@/lib/db"
import { RoiCalculatorContent } from "@/components/portal/roi-calculator/RoiCalculatorContent"

export const metadata = { title: "ROI Calculator" }

export default async function RoiCalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [sites, metrics] = await Promise.all([
    db.pilotSite.findMany({
      where: { account: { slug } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.successMetric.findMany({
      where: { msp: { account: { slug } } },
      include: { owner: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const serializedMetrics = metrics.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    baselineValue: m.baselineValue,
    targetValue: m.targetValue,
    currentValue: m.currentValue,
    status: m.status,
    ownerName: m.owner?.name ?? null,
  }))

  return <RoiCalculatorContent sites={sites} metrics={serializedMetrics} />
}
