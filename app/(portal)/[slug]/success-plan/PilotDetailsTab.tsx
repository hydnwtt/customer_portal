"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updatePilotDetails } from "./actions"
import { formatDate } from "@/lib/utils"

interface TeamMember {
  userId: string
  role: string
  name: string
  email: string
  userRole: string
}

interface Props {
  account: {
    id: string
    name: string
    pilotStartDate: string | null
    goNoGoDate: string | null
    pilotSites: { id: string; name: string }[]
    teamMembers: TeamMember[]
  }
  msp: {
    id: string
    keyPainPoints: string
    definitionOfDone: string
    outOfScope: string
    expansionOpportunities: string
  } | null
  isEditor: boolean
}

export default function PilotDetailsTab({ account, msp, isEditor }: Props) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    keyPainPoints: msp?.keyPainPoints ?? "",
    definitionOfDone: msp?.definitionOfDone ?? "",
    outOfScope: msp?.outOfScope ?? "",
    expansionOpportunities: msp?.expansionOpportunities ?? "",
  })

  function handleSave() {
    startTransition(async () => {
      const res = await updatePilotDetails({ accountId: account.id, ...form })
      if (res.success) {
        toast.success("Pilot details saved")
        setEditing(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  const ae = account.teamMembers.find((m) => m.userRole === "INTERNAL_MEMBER" || m.userRole === "INTERNAL_ADMIN")

  const labelClass = "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
  const valueClass = "text-sm text-foreground"
  const textareaClass =
    "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"

  return (
    <div className="space-y-6">
      {/* Overview grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className={labelClass}>Pilot Start</p>
          <p className={valueClass}>{account.pilotStartDate ? formatDate(account.pilotStartDate) : "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className={labelClass}>Go/No-Go Date</p>
          <p className={`${valueClass} font-semibold`}>
            {account.goNoGoDate ? formatDate(account.goNoGoDate) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className={labelClass}>Pilot Sites</p>
          <p className={valueClass}>{account.pilotSites.length > 0 ? account.pilotSites.map((s) => s.name).join(", ") : "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className={labelClass}>Team</p>
          <p className={valueClass}>
            {account.teamMembers.length > 0
              ? account.teamMembers.map((m) => m.name).join(", ")
              : "—"}
          </p>
        </div>
      </div>

      {/* Rich text fields */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-base font-semibold text-foreground">Pilot Scope</h2>
          {isEditor && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          )}
          {editing && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>

        {[
          { key: "keyPainPoints" as const, label: "Key Pain Points" },
          { key: "definitionOfDone" as const, label: "Definition of Done" },
          { key: "outOfScope" as const, label: "Out of Scope" },
          { key: "expansionOpportunities" as const, label: "Expansion Opportunities" },
        ].map(({ key, label }) => (
          <div key={key}>
            <p className={labelClass}>{label}</p>
            {editing ? (
              <textarea
                rows={4}
                className={textareaClass}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={`Enter ${label.toLowerCase()}…`}
              />
            ) : (
              <div className="min-h-[3rem]">
                {form[key] ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{form[key]}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not yet defined.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
