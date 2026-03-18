import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminHeader from "@/components/admin/AdminHeader"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect("/auth/signin")

  const { role, name, email } = session.user
  if (role !== "INTERNAL_ADMIN" && role !== "INTERNAL_MEMBER") {
    redirect("/auth/unauthorized")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar userRole={role} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader userName={name ?? ""} userEmail={email ?? ""} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
