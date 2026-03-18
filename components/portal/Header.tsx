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
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : days <= 14
          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
          : "bg-primary/10 text-primary border-primary/20"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Left: hamburger + customer logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
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
          <span className="text-sm font-semibold text-foreground">{account.name}</span>
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
          <span className="text-sm font-medium text-muted-foreground">
            {process.env.NEXT_PUBLIC_COMPANY_NAME || "Pilot Hub"}
          </span>
        )}
      </div>
    </header>
  )
}
