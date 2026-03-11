"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart2, Clock, CheckSquare, BookOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Welcome", href: "welcome", icon: Home },
  { label: "Success Plan", href: "success-plan", icon: BarChart2 },
  { label: "Timeline", href: "timeline", icon: Clock },
  { label: "Tasks", href: "tasks", icon: CheckSquare },
  { label: "Links", href: "links", icon: BookOpen },
] as const

interface PortalSidebarProps {
  slug: string
  isOpen: boolean
  onClose: () => void
}

export default function PortalSidebar({ slug, isOpen, onClose }: PortalSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-gray-200",
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
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4 lg:pt-6">
          {NAV_ITEMS.map((item) => {
            const href = `/${slug}/${item.href}`
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
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
