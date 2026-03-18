"use client"

import { useState, useTransition } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { InviteInternalUserSheet } from "./InviteInternalUserSheet"
import { removeInternalUser } from "@/app/(admin)/admin/users/actions"
import { timeAgo } from "@/lib/utils"
import type { UserRole } from "@prisma/client"

interface InternalUserRow {
  id: string
  name: string
  email: string
  role: UserRole
  lastLoginAt: string | null
}

interface InternalUsersTableProps {
  currentUserId: string
  users: InternalUserRow[]
}

export function InternalUsersTable({ currentUserId, users }: InternalUsersTableProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [removeError, setRemoveError] = useState<string | null>(null)

  function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the team? This cannot be undone.`)) return
    setRemoveError(null)
    startTransition(async () => {
      const result = await removeInternalUser({ userId })
      if (!result.success) setRemoveError(result.error)
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div />
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <PlusIcon className="size-4" />
          Invite Team Member
        </Button>
      </div>

      {removeError && (
        <p className="mb-3 text-sm text-destructive">{removeError}</p>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No team members yet.
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "INTERNAL_ADMIN" ? "default" : "secondary"}>
                    {u.role === "INTERNAL_ADMIN" ? "Admin" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(u.id, u.name)}
                    disabled={isPending || u.id === currentUserId}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InviteInternalUserSheet open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  )
}
