import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = { title: "User Management" }

export default async function UsersPage() {
  const session = await auth()

  // Double-check at page level — only INTERNAL_ADMIN can reach this page
  if (session?.user?.role !== "INTERNAL_ADMIN") {
    redirect("/admin/accounts")
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invite and manage customer users across all accounts.
        </p>
      </div>

      {/* Placeholder — Epic 2 (Task 2.2) will build user management */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-400">
          User management coming in Epic 2 — Internal Admin Backend
        </p>
      </div>
    </div>
  )
}
