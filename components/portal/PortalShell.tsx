"use client"

import { useState } from "react"
import PortalSidebar from "@/components/portal/Sidebar"
import PortalHeader from "@/components/portal/Header"
import type { AccountConfig } from "@/lib/account-config"

interface PortalShellProps {
  children: React.ReactNode
  slug: string
  account: {
    name: string
    logoUrl: string | null
    goNoGoDate: string | null
    primaryColor: string | null
    config: AccountConfig
  }
}

export function PortalShell({ children, slug, account }: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      style={account.primaryColor ? ({ "--portal-primary": account.primaryColor } as React.CSSProperties) : undefined}
    >
      <PortalSidebar
        slug={slug}
        config={account.config}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PortalHeader
          account={account}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
