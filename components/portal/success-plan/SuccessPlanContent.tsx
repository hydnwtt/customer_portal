"use client"

import { TiptapRenderer } from "@/components/tiptap/TiptapRenderer"
import { Badge } from "@/components/ui/badge"
import type { MetricStatus, RiskSeverity } from "@prisma/client"

interface SerializedMetric {
  id: string
  name: string
  description: string | null
  baselineValue: string | null
  targetValue: string | null
  currentValue: string | null
  status: MetricStatus
  ownerName: string | null
}

interface SerializedRisk {
  id: string
  description: string
  severity: RiskSeverity
  mitigationPlan: string | null
  owner: string | null
}

interface SerializedMSP {
  id: string
  keyPainPoints: unknown
  definitionOfDone: unknown
  outOfScope: unknown
  expansionOpportunities: unknown
  successMetrics: SerializedMetric[]
  risks: SerializedRisk[]
}

interface SuccessPlanContentProps {
  msp: SerializedMSP | null
}

const NARRATIVE_SECTIONS = [
  { key: "keyPainPoints" as const, label: "Key Pain Points" },
  { key: "definitionOfDone" as const, label: "Definition of Done" },
  { key: "outOfScope" as const, label: "Out of Scope" },
  { key: "expansionOpportunities" as const, label: "Expansion Opportunities" },
]

const STATUS_LABEL: Record<MetricStatus, string> = {
  NOT_STARTED: "Not Started",
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  ACHIEVED: "Achieved",
}

function metricStatusBadge(status: MetricStatus) {
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

function riskSeverityBadge(severity: RiskSeverity) {
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

function hasContent(msp: SerializedMSP): boolean {
  return (
    msp.keyPainPoints != null ||
    msp.definitionOfDone != null ||
    msp.outOfScope != null ||
    msp.expansionOpportunities != null ||
    msp.successMetrics.length > 0 ||
    msp.risks.length > 0
  )
}

export function SuccessPlanContent({ msp }: SuccessPlanContentProps) {
  if (!msp || !hasContent(msp)) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Mutual Success Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Goals, scope, stakeholders, and success metrics for this pilot.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Your success plan is being prepared — check back soon.
          </p>
        </div>
      </div>
    )
  }

  const narrativeSections = NARRATIVE_SECTIONS.filter((s) => msp[s.key] != null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mutual Success Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Goals, scope, stakeholders, and success metrics for this pilot.
        </p>
      </div>

      {/* Narrative sections */}
      {narrativeSections.length > 0 && (
        <div className="space-y-6">
          {narrativeSections.map((section) => (
            <div
              key={section.key}
              className="rounded-lg border border-border bg-card p-6"
            >
              <h2 className="mb-3 text-base font-semibold text-foreground">{section.label}</h2>
              <TiptapRenderer content={msp[section.key]} />
            </div>
          ))}
        </div>
      )}

      {/* Success Metrics */}
      {msp.successMetrics.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">Success Metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {msp.successMetrics.map((metric) => (
              <div
                key={metric.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-snug">{metric.name}</p>
                  {metricStatusBadge(metric.status)}
                </div>
                {metric.description && (
                  <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                    {metric.description}
                  </p>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Baseline</span>
                    <span className="font-medium">{metric.baselineValue ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium">{metric.targetValue ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current</span>
                    <span className="font-medium text-foreground">
                      {metric.currentValue ?? "—"}
                    </span>
                  </div>
                </div>
                {metric.ownerName && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Owner: <span className="text-foreground">{metric.ownerName}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Risks */}
      {msp.risks.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">Risks</h2>
          <div className="space-y-3">
            {msp.risks.map((risk) => (
              <div
                key={risk.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-foreground">{risk.description}</p>
                  {riskSeverityBadge(risk.severity)}
                </div>
                {(risk.mitigationPlan || risk.owner) && (
                  <div className="mt-3 space-y-1 border-t border-border pt-3">
                    {risk.mitigationPlan && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Mitigation: </span>
                        {risk.mitigationPlan}
                      </p>
                    )}
                    {risk.owner && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Owner: </span>
                        {risk.owner}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
