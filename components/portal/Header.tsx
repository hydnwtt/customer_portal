"use client"

import Image from "next/image"
import { Menu } from "lucide-react"
import { cn, daysUntil } from "@/lib/utils"

interface PortalHeaderProps {
  account: {
    name: string
    logoUrl: string | null
    goNoGoDate: string | null
    primaryColor: string | null
  }
  onMenuClick: () => void
}

export default function PortalHeader({ account, onMenuClick }: PortalHeaderProps) {
  const days = account.goNoGoDate ? daysUntil(account.goNoGoDate) : null

  const countdownLabel =
    days === null
      ? null
      : days < 0
        ? "Go/No-Go Decision Passed"
        : days === 0
          ? "Go/No-Go Decision: Today"
          : `${days} day${days === 1 ? "" : "s"} to Go/No-Go`

  const countdownColor =
    days === null
      ? ""
      : days <= 3
        ? "bg-red-100 text-red-700 border-red-200"
        : days <= 14
          ? "bg-amber-100 text-amber-700 border-amber-200"
          : "bg-blue-50 text-blue-700 border-blue-200"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Left: hamburger + customer logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {account.logoUrl ? (
          <Image
            src={account.logoUrl}
            alt={`${account.name} logo`}
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
          />
        ) : (
          <span className="text-sm font-semibold text-gray-900">{account.name}</span>
        )}
      </div>

      {/* Center: Go/No-Go countdown badge */}
      {countdownLabel && (
        <div
          className={cn(
            "hidden rounded-full border px-3 py-1.5 text-xs font-semibold sm:block",
            countdownColor
          )}
        >
          {countdownLabel}
        </div>
      )}

      {/* Right: company logo */}
      <div className="flex items-center">
        {process.env.NEXT_PUBLIC_COMPANY_LOGO_URL ? (
          <Image
            src={process.env.NEXT_PUBLIC_COMPANY_LOGO_URL}
            alt="Company logo"
            width={100}
            height={28}
            className="h-7 w-auto object-contain"
          />
        ) : (
          <span className="text-sm font-medium text-gray-400">
            {process.env.NEXT_PUBLIC_COMPANY_NAME || "Pilot Hub"}
          </span>
        )}
      </div>
    </header>
  )
}
