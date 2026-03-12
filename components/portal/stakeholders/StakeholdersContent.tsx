"use client"

import { InvolvementLevel, StakeholderCompany } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

interface SerializedStakeholder {
  id: string
  name: string
  company: StakeholderCompany
  title: string | null
  email: string
  involvementLevel: InvolvementLevel
}

interface StakeholdersContentProps {
  stakeholders: SerializedStakeholder[]
}

const INVOLVEMENT_LABEL: Record<InvolvementLevel, string> = {
  DECISION_MAKER: "Decision Maker",
  CHAMPION: "Champion",
  INFLUENCER: "Influencer",
  INFORMED: "Informed",
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

function groupByCompany(
  stakeholders: SerializedStakeholder[]
): [StakeholderCompany, SerializedStakeholder[]][] {
  // CUSTOMER first, then INTERNAL
  const order: StakeholderCompany[] = ["CUSTOMER", "INTERNAL"]
  const map = new Map<StakeholderCompany, SerializedStakeholder[]>()
  for (const s of stakeholders) {
    const group = map.get(s.company) ?? []
    group.push(s)
    map.set(s.company, group)
  }
  return order.flatMap((company) => {
    const group = map.get(company)
    return group ? [[company, group]] : []
  })
}

const GROUP_LABEL: Record<StakeholderCompany, string> = {
  CUSTOMER: "Customer Contacts",
  INTERNAL: "Internal Team",
}

export function StakeholdersContent({ stakeholders }: StakeholdersContentProps) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Stakeholders</h1>
      <p className="mb-8 text-sm text-muted-foreground">Key contacts for this pilot.</p>

      {stakeholders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Your pilot contacts will appear here once your CSM has added them.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupByCompany(stakeholders).map(([company, group]) => (
            <section key={company}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {GROUP_LABEL[company]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      {involvementBadge(s.involvementLevel)}
                    </div>
                    {s.title && (
                      <p className="text-sm text-muted-foreground">{s.title}</p>
                    )}
                    <a
                      href={`mailto:${s.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {s.email}
                    </a>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
