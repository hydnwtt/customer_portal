"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createPilotSite, deletePilotSite } from "@/app/(admin)/admin/accounts/[id]/sites/actions"

interface Site {
  id: string
  name: string
}

interface PilotSitesSectionProps {
  accountId: string
  initialSites: Site[]
}

export function PilotSitesSection({ accountId, initialSites }: PilotSitesSectionProps) {
  const [sites, setSites] = useState<Site[]>(initialSites)
  const [newName, setNewName] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setAddError(null)
    startTransition(async () => {
      const result = await createPilotSite({ accountId, name: trimmed })
      if (!result.success) {
        setAddError(result.error)
      } else {
        setSites((prev) => [...prev, result.site])
        setNewName("")
      }
    })
  }

  function handleDelete(siteId: string, siteName: string) {
    if (!confirm(`Remove pilot site "${siteName}"?`)) return
    setDeleteError(null)
    // Optimistic removal
    setSites((prev) => prev.filter((s) => s.id !== siteId))
    startTransition(async () => {
      const result = await deletePilotSite({ accountId, siteId })
      if (!result.success) {
        setDeleteError(result.error)
        // Restore removed site on failure
        setSites(initialSites)
      }
    })
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">Pilot Sites</p>

      {sites.length > 0 && (
        <ul className="mb-3 space-y-1">
          {sites.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2">
              <span className="text-sm">{s.name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(s.id, s.name)}
                disabled={isPending}
                className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Inline add row */}
      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New site name"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={isPending || !newName.trim()}
        >
          Add
        </Button>
      </div>

      {addError && <p className="mt-1 text-xs text-destructive">{addError}</p>}
      {deleteError && <p className="mt-1 text-xs text-destructive">{deleteError}</p>}
    </div>
  )
}
