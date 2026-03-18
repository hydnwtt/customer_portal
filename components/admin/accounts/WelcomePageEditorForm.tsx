"use client"

import { useRef, useState, useTransition } from "react"
import { TiptapEditor, type TiptapEditorHandle } from "@/components/tiptap/TiptapEditor"
import { Button } from "@/components/ui/button"
import { updateWelcomePage } from "@/app/(admin)/admin/accounts/[id]/welcome-page/actions"
import { formatDate } from "@/lib/utils"

interface VersionEntry {
  savedAt: string
  savedBy: string
}

interface WelcomePageEditorFormProps {
  accountId: string
  initialContent: unknown
  versions: VersionEntry[]
}

export function WelcomePageEditorForm({
  accountId,
  initialContent,
  versions: initialVersions,
}: WelcomePageEditorFormProps) {
  const editorRef = useRef<TiptapEditorHandle>(null)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [versions, setVersions] = useState(initialVersions)

  function handleSave() {
    const content = editorRef.current?.getJSON()
    if (!content) return

    setServerError(null)
    startTransition(async () => {
      const result = await updateWelcomePage({ accountId, content })
      if (!result.success) {
        setServerError(result.error)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      // Optimistically prepend a new version entry
      setVersions((prev) => [
        { savedAt: new Date().toISOString(), savedBy: "You" },
        ...prev,
      ].slice(0, 10))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Welcome Page</h2>
          <p className="text-sm text-muted-foreground">
            This content is displayed to customers when they log in to their portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          {serverError && <span className="text-sm text-destructive">{serverError}</span>}
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <TiptapEditor
        ref={editorRef}
        initialContent={initialContent}
        placeholder="Write a welcome message for this account's portal…"
        className="min-h-[320px]"
      />

      {versions.length > 0 && (
        <details className="rounded-md border border-border">
          <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            Version History ({versions.length})
          </summary>
          <ul className="divide-y divide-border border-t">
            {versions.map((v, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{formatDate(v.savedAt)}</span>
                <span className="text-foreground">{v.savedBy}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
