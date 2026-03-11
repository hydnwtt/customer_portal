"use client"

import Link from "next/link"
import { ArrowUpDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { AccountStatusBadge } from "./AccountStatusBadge"
import { RiskScoreBadge } from "./RiskScoreBadge"
import { daysUntil, timeAgo } from "@/lib/utils"
import type { AccountStatus } from "@prisma/client"

export interface AccountRow {
  id: string
  name: string
  slug: string
  status: AccountStatus
  goNoGoDate: string | null
  csmName: string | null
  taskTotal: number
  taskCompleted: number
  metricCounts: { ON_TRACK: number; AT_RISK: number; ACHIEVED: number }
  lastCustomerLoginAt: string | null
  riskScore: number
  isHighRisk: boolean
}

type SortKey = "name" | "status" | "goNoGoDate" | "taskCompletion" | "lastLogin" | "riskScore"

interface AccountsTableProps {
  accounts: AccountRow[]
  sortKey: SortKey
  sortDir: "asc" | "desc"
  onSort: (key: SortKey) => void
}

function SortButton({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  dir: "asc" | "desc"
  onSort: (k: SortKey) => void
}) {
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => onSort(sortKey)}
      className="gap-1 px-0 font-medium"
    >
      {label}
      <ArrowUpDown
        className={`size-3 ${currentKey === sortKey ? "opacity-100" : "opacity-30"}`}
      />
    </Button>
  )
}

export function AccountsTable({ accounts, sortKey, sortDir, onSort }: AccountsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton label="Account" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead>
              <SortButton label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead>CSM</TableHead>
            <TableHead>
              <SortButton label="Go/No-Go" sortKey="goNoGoDate" currentKey={sortKey} dir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead>
              <SortButton label="Task Completion" sortKey="taskCompletion" currentKey={sortKey} dir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead>Metrics RAG</TableHead>
            <TableHead>
              <SortButton label="Last Login" sortKey="lastLogin" currentKey={sortKey} dir={sortDir} onSort={onSort} />
            </TableHead>
            <TableHead>
              <SortButton label="Risk" sortKey="riskScore" currentKey={sortKey} dir={sortDir} onSort={onSort} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No accounts found.
              </TableCell>
            </TableRow>
          )}
          {accounts.map((row) => {
            const completionPct =
              row.taskTotal === 0 ? 0 : Math.round((row.taskCompleted / row.taskTotal) * 100)
            const daysLeft = row.goNoGoDate ? daysUntil(row.goNoGoDate) : null

            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/accounts/${row.id}/overview`}
                    className="hover:underline"
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <AccountStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.csmName ?? "—"}
                </TableCell>
                <TableCell>
                  {daysLeft === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span
                      className={
                        daysLeft <= 3
                          ? "font-semibold text-destructive"
                          : daysLeft <= 14
                          ? "font-semibold text-amber-600 dark:text-amber-400"
                          : "text-foreground"
                      }
                    >
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={completionPct} className="h-1.5 w-20" />
                    <span className="text-xs text-muted-foreground">{completionPct}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="inline-flex size-2 rounded-full bg-green-500" title="On track" />
                    {row.metricCounts.ON_TRACK}
                    <span className="inline-flex size-2 rounded-full bg-amber-500 ml-1" title="At risk" />
                    {row.metricCounts.AT_RISK}
                    <span className="inline-flex size-2 rounded-full bg-blue-500 ml-1" title="Achieved" />
                    {row.metricCounts.ACHIEVED}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.lastCustomerLoginAt ? timeAgo(row.lastCustomerLoginAt) : "Never"}
                </TableCell>
                <TableCell>
                  <RiskScoreBadge score={row.riskScore} isHighRisk={row.isHighRisk} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
