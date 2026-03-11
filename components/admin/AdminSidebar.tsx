"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { UserRole } from "@prisma/client"

interface AdminSidebarProps {
  userRole: UserRole
}

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: "All Accounts", href: "/admin/accounts", icon: Building2 },
    ...(userRole === "INTERNAL_ADMIN"
      ? [{ label: "User Management", href: "/admin/users", icon: Users }]
      : []),
  ]

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-background">
      {/* Wordmark */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-lg font-bold">Pilot Hub</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                "w-full justify-start gap-3"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
