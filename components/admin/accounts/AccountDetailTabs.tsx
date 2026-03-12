"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Overview", href: "overview" },
  { label: "Users", href: "users" },
  { label: "Hub Config", href: "config" },
  { label: "Welcome Page", href: "welcome-page" },
  { label: "Success Plan", href: "success-plan" },
  { label: "Timeline", href: "timeline" },
  { label: "Links", href: "links" },
  { label: "Stakeholders", href: "stakeholders" },
]

export function AccountDetailTabs({ accountId }: { accountId: string }) {
  const pathname = usePathname()
  const base = `/admin/accounts/${accountId}`

  return (
    <div className="flex gap-1 border-b">
      {TABS.map((tab) => {
        const href = `${base}/${tab.href}`
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
