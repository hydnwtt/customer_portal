"use client"

import { signOut } from "next-auth/react"
import { LogOut, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface AdminHeaderProps {
  userName: string
  userEmail: string
}

export default function AdminHeader({ userName, userEmail }: AdminHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-end border-b bg-background px-6">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
        >
          <span className="font-medium">{userName || userEmail}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="gap-2"
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
