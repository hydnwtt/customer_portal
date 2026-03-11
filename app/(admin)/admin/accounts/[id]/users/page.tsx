import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { AccountUsersTable } from "@/components/admin/accounts/AccountUsersTable"
import type { Prisma } from "@prisma/client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AccountUsersPage({ params }: Props) {
  const { id } = await params

  const account = await db.account.findUnique({
    where: { id },
    include: {
      users: {
        where: { user: { role: { in: ["CUSTOMER_ADMIN", "CUSTOMER_VIEWER"] } } },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, lastLoginAt: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!account) notFound()

  type AUWithUser = Prisma.AccountUserGetPayload<{
    include: { user: { select: { id: true; name: true; email: true; role: true; lastLoginAt: true } } }
  }>

  const users = account.users.map((au: AUWithUser) => ({
    userId: au.user.id,
    name: au.user.name,
    email: au.user.email,
    role: au.role,
    lastLoginAt: au.user.lastLoginAt?.toISOString() ?? null,
  }))

  return <AccountUsersTable accountId={id} users={users} />
}
