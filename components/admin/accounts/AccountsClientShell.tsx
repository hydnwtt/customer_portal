"use client"

import { useState, useMemo } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AccountsTable, type AccountRow } from "./AccountsTable"
import { CreateAccountSheet } from "./CreateAccountSheet"
import type { AccountStatus } from "@prisma/client"

type SortKey = "name" | "status" | "goNoGoDate" | "taskCompletion" | "lastLogin" | "riskScore"

interface InternalUser {
  id: string
  name: string
  email: string
}

interface AccountsClientShellProps {
  accounts: AccountRow[]
  internalUsers: InternalUser[]
}

export function AccountsClientShell({ accounts, internalUsers }: AccountsClientShellProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "ALL">("ALL")
  const [filterCsm, setFilterCsm] = useState<string>("ALL")
  const [filterRisk, setFilterRisk] = useState<"ALL" | "HIGH">("ALL")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const csmOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: InternalUser[] = []
    for (const acct of accounts) {
      if (acct.csmName) {
        const match = internalUsers.find((u) => u.name === acct.csmName)
        if (match && !seen.has(match.id)) {
          seen.add(match.id)
          opts.push(match)
        }
      }
    }
    return opts
  }, [accounts, internalUsers])

  const filtered = useMemo(() => {
    let result = [...accounts]

    if (filterStatus !== "ALL") {
      result = result.filter((a) => a.status === filterStatus)
    }
    if (filterCsm !== "ALL") {
      const user = internalUsers.find((u) => u.id === filterCsm)
      if (user) result = result.filter((a) => a.csmName === user.name)
    }
    if (filterRisk === "HIGH") {
      result = result.filter((a) => a.isHighRisk)
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
        case "goNoGoDate":
          cmp = (a.goNoGoDate ?? "").localeCompare(b.goNoGoDate ?? "")
          break
        case "taskCompletion": {
          const pctA = a.taskTotal === 0 ? 0 : a.taskCompleted / a.taskTotal
          const pctB = b.taskTotal === 0 ? 0 : b.taskCompleted / b.taskTotal
          cmp = pctA - pctB
          break
        }
        case "lastLogin":
          cmp = (a.lastCustomerLoginAt ?? "").localeCompare(b.lastCustomerLoginAt ?? "")
          break
        case "riskScore":
          cmp = a.riskScore - b.riskScore
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [accounts, filterStatus, filterCsm, filterRisk, sortKey, sortDir, internalUsers])

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and monitor all active pilot accounts.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          New Account
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as AccountStatus | "ALL")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE_PILOT">Active Pilot</SelectItem>
            <SelectItem value="EVALUATION">Evaluation</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
            <SelectItem value="CHURNED">Churned</SelectItem>
          </SelectContent>
        </Select>

        {csmOptions.length > 0 && (
          <Select value={filterCsm} onValueChange={(v: string | null) => setFilterCsm(v ?? "ALL")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="CSM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All CSMs</SelectItem>
              {csmOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filterRisk} onValueChange={(v) => setFilterRisk(v as "ALL" | "HIGH")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Risk Levels</SelectItem>
            <SelectItem value="HIGH">High Risk Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <AccountsTable
          accounts={filtered}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </div>

      <CreateAccountSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        internalUsers={internalUsers}
      />
    </>
  )
}
