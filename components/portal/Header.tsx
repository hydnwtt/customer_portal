"use client"

import Image from "next/image"
import { Menu, LogOut, ChevronDown, User } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn, daysUntil } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface PortalHeaderProps {
  account: {
    name: string
    logoUrl: string | null
    goNoGoDate: string | null
    primaryColor: string | null
  }
  user: {
    name: string | null
    email: string | null
  }
  onMenuClick: () => void
}

export default function PortalHeader({ account, user, onMenuClick }: PortalHeaderProps) {
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

  const displayName = user.name || user.email || "Account"

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

      {/* Right: Savi logo + user menu */}
      <div className="flex items-center gap-3">
        <Image
          src="/savi-logo.svg"
          alt="Savi"
          width={44}
          height={33}
          className="hidden sm:block shrink-0"
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium",
              "text-muted-foreground hover:bg-accent hover:text-foreground transition-colors outline-none"
            )}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              {user.name && (
                <p className="text-sm font-medium text-foreground">{user.name}</p>
              )}
              {user.email && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
