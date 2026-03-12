import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PhasesSection } from "@/components/admin/accounts/PhasesSection"

export const metadata = { title: "Timeline" }

export default async function TimelinePage({
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

  const phases = await db.phase.findMany({
    where: { accountId: id },
    include: {
      tasks: {
        include: { assignee: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  const accountUsers = await db.accountUser.findMany({
    where: { accountId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })

  const serializedPhases = phases.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    startDate: p.startDate?.toISOString() ?? null,
    targetEndDate: p.targetEndDate?.toISOString() ?? null,
    actualEndDate: p.actualEndDate?.toISOString() ?? null,
    status: p.status,
    order: p.order,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description as string | null,
      status: t.status,
      priority: t.priority,
      assigneeId: t.assigneeId,
      assigneeName: t.assignee?.name ?? null,
      assigneeEmail: t.assignee?.email ?? null,
      dueDate: t.dueDate?.toISOString() ?? null,
      blockerReason: t.blockerReason,
    })),
  }))

  const users = accountUsers.map((au) => ({
    id: au.user.id,
    name: au.user.name,
    email: au.user.email,
  }))

  return (
    <PhasesSection accountId={id} phases={serializedPhases} accountUsers={users} />
  )
}
