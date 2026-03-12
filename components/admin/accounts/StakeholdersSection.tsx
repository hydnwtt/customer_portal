"use client"

import { useState, useTransition } from "react"
import { InvolvementLevel, StakeholderCompany } from "@prisma/client"
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
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { StakeholderSheet } from "./StakeholderSheet"
import { deleteStakeholder } from "@/app/(admin)/admin/accounts/[id]/stakeholders/actions"
import { formatDate } from "@/lib/utils"

interface SerializedStakeholder {
  id: string
  name: string
  company: StakeholderCompany
  title: string | null
  email: string
  phone: string | null
  involvementLevel: InvolvementLevel
  lastEngagedAt: string | null
  notes: string | null
}

interface StakeholdersSectionProps {
  accountId: string
  stakeholders: SerializedStakeholder[]
}

const INVOLVEMENT_LABEL: Record<InvolvementLevel, string> = {
  DECISION_MAKER: "Decision Maker",
  CHAMPION: "Champion",
  INFLUENCER: "Influencer",
  INFORMED: "Informed",
}

const COMPANY_LABEL: Record<StakeholderCompany, string> = {
  CUSTOMER: "Customer",
  INTERNAL: "Internal",
}

function involvementBadge(level: InvolvementLevel) {
  switch (level) {
    case "DECISION_MAKER":
      return <Badge variant="default">{INVOLVEMENT_LABEL[level]}</Badge>
    case "CHAMPION":
      return (
        <Badge variant="secondary" className="text-amber-600">
          {INVOLVEMENT_LABEL[level]}
        </Badge>
      )
    case "INFLUENCER":
      return <Badge variant="secondary">{INVOLVEMENT_LABEL[level]}</Badge>
    case "INFORMED":
      return <Badge variant="outline">{INVOLVEMENT_LABEL[level]}</Badge>
  }
}

function isStale(lastEngagedAt: string | null): boolean {
  if (!lastEngagedAt) return false
  const days = (Date.now() - new Date(lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24)
  return days > 14
}

export function StakeholdersSection({ accountId, stakeholders }: StakeholdersSectionProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState<
    SerializedStakeholder | undefined
  >(undefined)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingStakeholder(undefined)
    setSheetMode("create")
    setSheetError(null)
    setSheetOpen(true)
  }

  function openEdit(stakeholder: SerializedStakeholder) {
    setEditingStakeholder(stakeholder)
    setSheetMode("edit")
    setSheetError(null)
    setSheetOpen(true)
  }

  function handleDelete(stakeholderId: string, name: string) {
    if (!confirm(`Delete stakeholder "${name}"? This cannot be undone.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteStakeholder({ accountId, stakeholderId })
      if (!result.success) setDeleteError(result.error)
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Stakeholders</h2>
            <p className="text-sm text-muted-foreground">
              Key contacts and their involvement in the pilot.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4" />
            Add Stakeholder
          </Button>
        </div>

        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
        {sheetError && <p className="text-sm text-destructive">{sheetError}</p>}

        {stakeholders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No stakeholders yet. Add key contacts to track engagement.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Involvement</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last Engaged</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stakeholders.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {COMPANY_LABEL[s.company]}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.title ?? "—"}
                    </TableCell>
                    <TableCell>{involvementBadge(s.involvementLevel)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.email}
                    </TableCell>
                    <TableCell>
                      {s.lastEngagedAt ? (
                        <span
                          className={
                            isStale(s.lastEngagedAt)
                              ? "text-sm text-amber-600"
                              : "text-sm text-muted-foreground"
                          }
                        >
                          {formatDate(s.lastEngagedAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(s)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(s.id, s.name)}
                          disabled={isPending}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <StakeholderSheet
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        accountId={accountId}
        stakeholder={editingStakeholder}
        onError={(e) => setSheetError(e)}
      />
    </>
  )
}
