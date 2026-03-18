import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import TimelineClient from "./TimelineClient"

export const metadata = { title: "Timeline" }

interface Props {
  params: Promise<{ slug: string }>
}

export default async function TimelinePage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const account = await db.account.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      goNoGoDate: true,
      phases: {
        orderBy: [{ order: "asc" }, { startDate: "asc" }],
        include: {
          tasks: { select: { id: true, status: true, dueDate: true } },
        },
      },
    },
  })

  if (!account) notFound()

  const isInternal =
    session?.user?.role === "INTERNAL_ADMIN" || session?.user?.role === "INTERNAL_MEMBER"

  const phases = account.phases.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    startDate: p.startDate?.toISOString() ?? null,
    targetEndDate: p.targetEndDate?.toISOString() ?? null,
    actualEndDate: p.actualEndDate?.toISOString() ?? null,
    status: p.status,
    parentPhaseId: p.parentPhaseId,
    order: p.order,
    taskCount: p.tasks.length,
    completedTaskCount: p.tasks.filter((t) => t.status === "COMPLETE").length,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-foreground mb-1">Phase Timeline</h1>
        <p className="text-sm text-muted-foreground">Visual overview of pilot phases and milestones.</p>
      </div>
      <TimelineClient
        accountId={account.id}
        phases={phases}
        goNoGoDate={account.goNoGoDate?.toISOString() ?? null}
        isInternal={isInternal}
      />
    </div>
  )
}
