"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@prisma/client"

interface AdminSidebarProps {
  userRole: UserRole
}

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: "All Accounts", href: "/admin/accounts", icon: Building2 },
    // User Management is INTERNAL_ADMIN only
    ...(userRole === "INTERNAL_ADMIN"
      ? [{ label: "User Management", href: "/admin/users", icon: Users }]
      : []),
  ]

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Wordmark */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <span className="text-lg font-bold text-gray-900">Pilot Hub</span>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
