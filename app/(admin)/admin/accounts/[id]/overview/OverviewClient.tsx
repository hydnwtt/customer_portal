"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AccountStatusBadge } from "@/components/admin/accounts/AccountStatusBadge"
import { EditAccountSheet, type AccountForEdit } from "@/components/admin/accounts/EditAccountSheet"
import { formatDate } from "@/lib/utils"
import type { AccountStatus } from "@prisma/client"
import { PilotSitesSection } from "@/components/admin/accounts/PilotSitesSection"

interface AccountData extends AccountForEdit {
  pilotSites: Array<{ id: string; name: string }>
  teamMembers: Array<{ id: string; name: string; email: string }>
}

export function OverviewClient({ account }: { account: AccountData }) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AccountStatusBadge status={account.status as AccountStatus} />
          <span className="font-mono text-sm text-muted-foreground">/{account.slug}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <PencilIcon className="size-4" />
          Edit
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">
        <Field
          label="Pilot Start Date"
          value={account.pilotStartDate ? formatDate(account.pilotStartDate) : "—"}
        />
        <Field
          label="Go/No-Go Date"
          value={account.goNoGoDate ? formatDate(account.goNoGoDate) : "—"}
        />
        <Field label="Logo URL" value={account.logoUrl ?? "—"} />
        <Field label="Primary Color">
          {account.primaryColor ? (
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-4 rounded border"
                style={{ background: account.primaryColor }}
              />
              <span className="font-mono text-sm">{account.primaryColor}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Field>
      </div>

      <div className="mt-6">
        <PilotSitesSection accountId={account.id} initialSites={account.pilotSites} />
      </div>

      {account.teamMembers.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-muted-foreground">Internal Team</p>
          <ul className="space-y-1 text-sm">
            {account.teamMembers.map((m) => (
              <li key={m.id}>
                {m.name}{" "}
                <span className="text-muted-foreground">({m.email})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <EditAccountSheet open={editOpen} onOpenChange={setEditOpen} account={account} />
    </>
  )
}

function Field({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm">{children ?? value}</div>
    </div>
  )
}
