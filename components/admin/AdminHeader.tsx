"use client"

import { signOut } from "next-auth/react"
import { LogOut, ChevronDown } from "lucide-react"
import { useState } from "react"

interface AdminHeaderProps {
  userName: string
  userEmail: string
}

export default function AdminHeader({ userName, userEmail }: AdminHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-16 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-6">
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <span className="font-medium">{userName || userEmail}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 text-gray-400" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
