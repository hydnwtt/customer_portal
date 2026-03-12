"use client"

import { useState, useTransition } from "react"
import { RiskSeverity } from "@prisma/client"
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
import { RiskSheet } from "./RiskSheet"
import { deleteRisk } from "@/app/(admin)/admin/accounts/[id]/success-plan/actions"

interface SerializedRisk {
  id: string
  description: string
  severity: RiskSeverity
  mitigationPlan: string | null
  owner: string | null
  createdAt: string
}

interface RisksTableProps {
  accountId: string
  mspId: string
  risks: SerializedRisk[]
}

function severityBadge(severity: RiskSeverity) {
  switch (severity) {
    case "HIGH":
      return <Badge variant="destructive">High</Badge>
    case "MEDIUM":
      return (
        <Badge variant="secondary" className="text-amber-600">
          Medium
        </Badge>
      )
    case "LOW":
      return <Badge variant="secondary">Low</Badge>
  }
}

export function RisksTable({ accountId, mspId, risks }: RisksTableProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<SerializedRisk | undefined>(undefined)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingRisk(undefined)
    setSheetMode("create")
    setSheetError(null)
    setSheetOpen(true)
  }

  function openEdit(risk: SerializedRisk) {
    setEditingRisk(risk)
    setSheetMode("edit")
    setSheetError(null)
    setSheetOpen(true)
  }

  function handleDelete(riskId: string) {
    if (!confirm("Delete this risk? This cannot be undone.")) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteRisk({ accountId, riskId })
      if (!result.success) setDeleteError(result.error)
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Risks</h2>
            <p className="text-sm text-muted-foreground">
              Known risks and mitigation plans for this pilot.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4" />
            Add Risk
          </Button>
        </div>

        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Mitigation Plan</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No risks documented yet.
                  </TableCell>
                </TableRow>
              )}
              {risks.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-xs font-medium">
                    <p className="line-clamp-2">{r.description}</p>
                  </TableCell>
                  <TableCell>{severityBadge(r.severity)}</TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {r.mitigationPlan ? (
                      <p className="line-clamp-2">{r.mitigationPlan}</p>
                    ) : (
                      <span className="italic">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.owner ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(r)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(r.id)}
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
      </div>

      <RiskSheet
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        accountId={accountId}
        mspId={mspId}
        risk={editingRisk}
        onError={(e) => setSheetError(e)}
      />
      {sheetError && <p className="text-sm text-destructive">{sheetError}</p>}
    </>
  )
}
