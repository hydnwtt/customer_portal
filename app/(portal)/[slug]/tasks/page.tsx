import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { TasksContent } from "@/components/portal/tasks/TasksContent"

export const metadata = { title: "Tasks" }

export default async function TasksPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()

  const canEdit =
    session?.user?.accountRole === "CUSTOMER_ADMIN" ||
    session?.user?.role === "INTERNAL_ADMIN" ||
    session?.user?.role === "INTERNAL_MEMBER"

  const currentUserId = session?.user?.id ?? null

  const phases = await db.phase.findMany({
    where: { account: { slug } },
    include: {
      tasks: {
        include: {
          assignee: { select: { name: true } },
          comments: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  const serialized = phases.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      priority: t.priority,
      assigneeName: t.assignee?.name ?? null,
      dueDate: t.dueDate?.toISOString() ?? null,
      blockerReason: t.blockerReason,
      comments: t.comments.map((c) => ({
        id: c.id,
        authorId: c.author.id,
        authorName: c.author.name ?? "Unknown",
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    })),
  }))

  return <TasksContent phases={serialized} canEdit={canEdit} slug={slug} currentUserId={currentUserId} />
}
