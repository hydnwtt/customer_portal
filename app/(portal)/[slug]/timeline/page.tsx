import { db } from "@/lib/db"
import { TimelineContent } from "@/components/portal/timeline/TimelineContent"

export const metadata = { title: "Timeline" }

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const phases = await db.phase.findMany({
    where: { account: { slug } },
    include: {
      tasks: { select: { status: true } },
    },
    orderBy: { order: "asc" },
  })

  const serialized = phases.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    startDate: p.startDate?.toISOString() ?? null,
    targetEndDate: p.targetEndDate?.toISOString() ?? null,
    status: p.status,
    tasks: p.tasks.map((t) => ({ status: t.status })),
  }))

  return <TimelineContent phases={serialized} />
}
