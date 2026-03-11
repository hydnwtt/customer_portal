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
import { InviteUserSheet } from "./InviteUserSheet"
import { revokeUserAccess } from "@/app/(admin)/admin/accounts/[id]/users/actions"
import { timeAgo } from "@/lib/utils"
import type { UserRole } from "@prisma/client"

interface UserRow {
  userId: string
  name: string
  email: string
  role: UserRole
  lastLoginAt: string | null
}

interface AccountUsersTableProps {
  accountId: string
  users: UserRow[]
}

export function AccountUsersTable({ accountId, users }: AccountUsersTableProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRevoke(userId: string) {
    if (!confirm("Remove this user's access? They can be re-invited later.")) return
    startTransition(async () => {
      await revokeUserAccess({ accountId, userId })
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Customer Users</h2>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <PlusIcon className="size-4" />
          Invite User
        </Button>
      </div>

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
                  No customer users yet. Invite someone to get started.
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.userId}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "CUSTOMER_ADMIN" ? "default" : "secondary"}>
                    {u.role === "CUSTOMER_ADMIN" ? "Admin" : "Viewer"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRevoke(u.userId)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InviteUserSheet accountId={accountId} open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  )
}
