"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart2, Clock, CheckSquare, BookOpen, Users, Calculator, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AccountConfig } from "@/lib/account-config"

const NAV_ITEMS = [
  { label: "Welcome",        href: "welcome",         icon: Home,        gate: "enableWelcomePage"     as keyof AccountConfig },
  { label: "Success Plan",   href: "success-plan",    icon: BarChart2,   gate: "enableSuccessMetrics"  as keyof AccountConfig },
  { label: "Timeline",       href: "timeline",        icon: Clock,       gate: "enableTimeline"        as keyof AccountConfig },
  { label: "Tasks",          href: "tasks",           icon: CheckSquare, gate: "enableTimeline"        as keyof AccountConfig },
  { label: "ROI Calculators",href: "roi-calculators", icon: Calculator,  gate: "enableRoiCalculator"   as keyof AccountConfig },
  { label: "Resources",      href: "links",           icon: BookOpen,    gate: "enableHelpfulLinks"    as keyof AccountConfig },
  { label: "Stakeholders",   href: "stakeholders",    icon: Users,       gate: "enableStakeholders"    as keyof AccountConfig },
]

interface PortalSidebarProps {
  slug: string
  config: AccountConfig
  isOpen: boolean
  onClose: () => void
}

export default function PortalSidebar({ slug, config, isOpen, onClose }: PortalSidebarProps) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => config[item.gate] !== false)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-200 ease-in-out",
          "lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end p-4 lg:hidden">
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4 lg:pt-6">
          {visibleItems.map((item) => {
            const href = `/${slug}/${item.href}`
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
