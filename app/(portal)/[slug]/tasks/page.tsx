import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { tiptapJsonToText } from "@/lib/tiptap-text"
import TasksClient from "./TasksClient"

export const metadata = { title: "Tasks" }

interface Props {
  params: Promise<{ slug: string }>
}

export default async function TasksPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const account = await db.account.findUnique({
    where: { slug },
    select: {
      id: true,
      phases: {
        orderBy: [{ order: "asc" }, { startDate: "asc" }],
        select: {
          id: true,
          name: true,
          tasks: {
            orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              comments: {
                include: { author: { select: { id: true, name: true } } },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
      users: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  })

  if (!account) notFound()

  const isInternal =
    session?.user?.role === "INTERNAL_ADMIN" || session?.user?.role === "INTERNAL_MEMBER"
  const canEdit =
    isInternal || session?.user?.role === "CUSTOMER_ADMIN"
  const currentUserId = session?.user?.id ?? null

  const phases = account.phases.map((phase) => ({
    id: phase.id,
    name: phase.name,
    tasks: phase.tasks.map((t) => ({
      id: t.id,
      phaseId: t.phaseId,
      name: t.name,
      description: tiptapJsonToText(t.description),
      assigneeId: t.assigneeId,
      assignee: t.assignee,
      dueDate: t.dueDate?.toISOString() ?? null,
      priority: t.priority,
      status: t.status,
      blockerReason: t.blockerReason,
      createdAt: t.createdAt.toISOString(),
      comments: t.comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorId: c.authorId,
        authorName: c.author.name,
        createdAt: c.createdAt.toISOString(),
      })),
    })),
  }))

  const teamMembers = account.users.map((u) => ({
    userId: u.userId,
    name: u.user.name,
    email: u.user.email,
    role: u.user.role,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-foreground mb-1">Action Plan</h1>
        <p className="text-sm text-muted-foreground">Shared task list for completing your pilot successfully.</p>
      </div>
      <TasksClient
        accountId={account.id}
        phases={phases}
        teamMembers={teamMembers}
        isInternal={isInternal}
        canEdit={canEdit}
        currentUserId={currentUserId}
      />
    </div>
  )
}
