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
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { HelpfulLinkSheet } from "./HelpfulLinkSheet"
import { deleteLink } from "@/app/(admin)/admin/accounts/[id]/links/actions"

interface SerializedLink {
  id: string
  title: string
  url: string
  category: string
  description: string | null
  isRequiredReading: boolean
}

interface HelpfulLinksSectionProps {
  accountId: string
  links: SerializedLink[]
}

export function HelpfulLinksSection({ accountId, links }: HelpfulLinksSectionProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<SerializedLink | undefined>(undefined)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditingLink(undefined)
    setSheetMode("create")
    setSheetError(null)
    setSheetOpen(true)
  }

  function openEdit(link: SerializedLink) {
    setEditingLink(link)
    setSheetMode("edit")
    setSheetError(null)
    setSheetOpen(true)
  }

  function handleDelete(linkId: string, title: string) {
    if (!confirm(`Delete link "${title}"? This cannot be undone.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteLink({ accountId, linkId })
      if (!result.success) setDeleteError(result.error)
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Helpful Links</h2>
            <p className="text-sm text-muted-foreground">
              Curated resources and documentation for the customer portal.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4" />
            Add Link
          </Button>
        </div>

        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
        {sheetError && <p className="text-sm text-destructive">{sheetError}</p>}

        {links.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No links yet. Add one to build the resource library.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Required Reading</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.title}
                      {link.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {link.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[220px] truncate text-sm text-muted-foreground">
                        {link.url}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {link.category}
                    </TableCell>
                    <TableCell>
                      {link.isRequiredReading ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(link)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(link.id, link.title)}
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

      <HelpfulLinkSheet
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        accountId={accountId}
        link={editingLink}
        onError={(e) => setSheetError(e)}
      />
    </>
  )
}
