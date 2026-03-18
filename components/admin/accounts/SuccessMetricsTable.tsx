"use client"

import { useState, useTransition } from "react"
import { MetricStatus } from "@prisma/client"
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
import { MetricSheet } from "./MetricSheet"
import { deleteSuccessMetric } from "@/app/(admin)/admin/accounts/[id]/success-plan/actions"

interface SerializedMetric {
  id: string
  name: string
  description: string | null
  baselineValue: string | null
  targetValue: string | null
  currentValue: string | null
  status: MetricStatus
  ownerId: string | null
  ownerName: string | null
  ownerEmail: string | null
  createdAt: string
}

interface AccountUser {
  id: string
  name: string | null
  email: string
}

interface SuccessMetricsTableProps {
  accountId: string
  mspId: string
  metrics: SerializedMetric[]
  accountUsers: AccountUser[]
}

const STATUS_LABEL: Record<MetricStatus, string> = {
  NOT_STARTED: "Not Started",
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  ACHIEVED: "Achieved",
}

function statusBadge(status: MetricStatus) {
  switch (status) {
    case "NOT_STARTED":
      return <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>
    case "ON_TRACK":
      return <Badge variant="default">{STATUS_LABEL[status]}</Badge>
    case "AT_RISK":
      return <Badge variant="destructive">{STATUS_LABEL[status]}</Badge>
    case "ACHIEVED":
      return (
        <Badge variant="outline" className="border-green-600 text-green-600">
          {STATUS_LABEL[status]}
        </Badge>
      )
  }
}

export function SuccessMetricsTable({
  accountId,
  mspId,
  metrics,
  accountUsers,
}: SuccessMetricsTableProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<SerializedMetric | undefined>(undefined)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingMetric(undefined)
    setSheetMode("create")
    setSheetError(null)
    setSheetOpen(true)
  }

  function openEdit(metric: SerializedMetric) {
    setEditingMetric(metric)
    setSheetMode("edit")
    setSheetError(null)
    setSheetOpen(true)
  }

  function handleDelete(metricId: string, name: string) {
    if (!confirm(`Delete metric "${name}"? This cannot be undone.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteSuccessMetric({ accountId, metricId })
      if (!result.success) setDeleteError(result.error)
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Success Metrics</h2>
            <p className="text-sm text-muted-foreground">
              Measurable outcomes that define pilot success.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4" />
            Add Metric
          </Button>
        </div>

        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Baseline → Target → Current</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No metrics yet. Add one to track pilot success.
                  </TableCell>
                </TableRow>
              )}
              {metrics.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.name}
                    {m.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {m.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span>{m.baselineValue ?? "—"}</span>
                    <span className="mx-1.5 text-muted-foreground/50">→</span>
                    <span>{m.targetValue ?? "—"}</span>
                    <span className="mx-1.5 text-muted-foreground/50">→</span>
                    <span className="font-medium text-foreground">{m.currentValue ?? "—"}</span>
                  </TableCell>
                  <TableCell>{statusBadge(m.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.ownerName ?? m.ownerEmail ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(m)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(m.id, m.name)}
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

      <MetricSheet
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        accountId={accountId}
        mspId={mspId}
        metric={editingMetric}
        accountUsers={accountUsers}
        onError={(e) => setSheetError(e)}
      />
      {sheetError && <p className="text-sm text-destructive">{sheetError}</p>}
    </>
  )
}
