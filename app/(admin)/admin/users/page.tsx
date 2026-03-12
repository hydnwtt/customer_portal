import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { InternalUsersTable } from "@/components/admin/users/InternalUsersTable"

export const metadata = { title: "User Management" }

export default async function UsersPage() {
  const session = await auth()

  if (session?.user?.role !== "INTERNAL_ADMIN") {
    redirect("/admin/accounts")
  }

  const users = await db.user.findMany({
    where: { role: { in: ["INTERNAL_ADMIN", "INTERNAL_MEMBER"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
    },
  })

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage internal team members who have access to the admin panel.
        </p>
      </div>

      <InternalUsersTable currentUserId={session.user.id} users={serialized} />
    </div>
  )
}
