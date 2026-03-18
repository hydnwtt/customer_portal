"use client"

import { useRef, useState, useTransition } from "react"
import { TiptapEditor, type TiptapEditorHandle } from "@/components/tiptap/TiptapEditor"
import { Button } from "@/components/ui/button"
import { updateMutualSuccessPlan } from "@/app/(admin)/admin/accounts/[id]/success-plan/actions"

interface MutualSuccessPlanFormProps {
  accountId: string
  initialKeyPainPoints: unknown
  initialDefinitionOfDone: unknown
  initialOutOfScope: unknown
  initialExpansionOpportunities: unknown
}

const SECTIONS = [
  {
    key: "keyPainPoints" as const,
    label: "Key Pain Points",
    description: "What challenges is the customer facing that this pilot addresses?",
    placeholder: "Describe the customer's core challenges…",
  },
  {
    key: "definitionOfDone" as const,
    label: "Definition of Done",
    description: "What does a successful pilot outcome look like?",
    placeholder: "What does a successful pilot look like?",
  },
  {
    key: "outOfScope" as const,
    label: "Out of Scope",
    description: "What is explicitly excluded from this pilot?",
    placeholder: "What is explicitly excluded from this pilot?",
  },
  {
    key: "expansionOpportunities" as const,
    label: "Expansion Opportunities",
    description: "Potential growth areas following a successful pilot.",
    placeholder: "Potential future growth areas…",
  },
]

export function MutualSuccessPlanForm({
  accountId,
  initialKeyPainPoints,
  initialDefinitionOfDone,
  initialOutOfScope,
  initialExpansionOpportunities,
}: MutualSuccessPlanFormProps) {
  const refs = {
    keyPainPoints: useRef<TiptapEditorHandle>(null),
    definitionOfDone: useRef<TiptapEditorHandle>(null),
    outOfScope: useRef<TiptapEditorHandle>(null),
    expansionOpportunities: useRef<TiptapEditorHandle>(null),
  }

  const initialContent = {
    keyPainPoints: initialKeyPainPoints,
    definitionOfDone: initialDefinitionOfDone,
    outOfScope: initialOutOfScope,
    expansionOpportunities: initialExpansionOpportunities,
  }

  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setServerError(null)
    startTransition(async () => {
      const result = await updateMutualSuccessPlan({
        accountId,
        keyPainPoints: refs.keyPainPoints.current?.getJSON(),
        definitionOfDone: refs.definitionOfDone.current?.getJSON(),
        outOfScope: refs.outOfScope.current?.getJSON(),
        expansionOpportunities: refs.expansionOpportunities.current?.getJSON(),
      })
      if (!result.success) {
        setServerError(result.error)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Narrative</h2>
          <p className="text-sm text-muted-foreground">
            Document the goals, scope, and opportunities for this pilot.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-600">Saved!</span>}
          {serverError && <span className="text-sm text-destructive">{serverError}</span>}
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? "Saving…" : "Save Narrative"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.key} className="space-y-1.5">
            <div>
              <p className="text-sm font-medium">{section.label}</p>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
            <TiptapEditor
              ref={refs[section.key]}
              initialContent={initialContent[section.key]}
              placeholder={section.placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
