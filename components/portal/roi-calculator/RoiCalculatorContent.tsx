"use client"

import type { MetricStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

interface SerializedSite {
  id: string
  name: string
}

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

interface RoiCalculatorContentProps {
  sites: SerializedSite[]
  metrics: SerializedMetric[]
}

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
      return (
        <Badge variant="secondary" className="text-amber-600">
          {STATUS_LABEL[status]}
        </Badge>
      )
    case "ACHIEVED":
      return (
        <Badge variant="outline" className="border-green-600 text-green-600">
          {STATUS_LABEL[status]}
        </Badge>
      )
  }
}

function progressPct(metric: SerializedMetric): number | null {
  const baseline = metric.baselineValue !== null ? parseFloat(metric.baselineValue) : null
  const current = metric.currentValue !== null ? parseFloat(metric.currentValue) : null
  const target = metric.targetValue !== null ? parseFloat(metric.targetValue) : null
  if (baseline === null || current === null || target === null) return null
  if (isNaN(baseline) || isNaN(current) || isNaN(target)) return null
  if (target === baseline) return current >= target ? 100 : 0
  return Math.max(0, Math.min(100, ((current - baseline) / (target - baseline)) * 100))
}

function formatValue(val: string): string {
  const n = parseFloat(val)
  if (isNaN(n)) return val
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "")
}

export function RoiCalculatorContent({ sites, metrics }: RoiCalculatorContentProps) {
  const onTrackCount = metrics.filter(
    (m) => m.status === "ON_TRACK" || m.status === "ACHIEVED"
  ).length

  const metricsWithProgress = metrics.filter((m) => progressPct(m) !== null)
  const avgCompletion =
    metricsWithProgress.length > 0
      ? metricsWithProgress.reduce((sum, m) => sum + progressPct(m)!, 0) /
        metricsWithProgress.length
      : null

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">ROI Calculator</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Track the business impact of your pilot.
      </p>

      {metrics.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Your ROI summary will appear here once your CSM has set up success metrics.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Impact Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Pilot Sites card */}
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pilot Sites
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">{sites.length}</p>
              {sites.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sites.map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-xs">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Metrics Tracked card */}
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Metrics Tracked
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">{metrics.length}</p>
              {avgCompletion !== null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {Math.round(avgCompletion)}% avg completion
                </p>
              )}
            </div>

            {/* On Track card */}
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                On Track / Achieved
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {onTrackCount}
                <span className="text-lg font-normal text-muted-foreground">
                  {" "}/ {metrics.length}
                </span>
              </p>
            </div>
          </div>

          {/* Success Metrics */}
          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Success Metrics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.map((m) => {
                const pct = progressPct(m)
                return (
                  <div
                    key={m.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      {metricStatusBadge(m.status)}
                    </div>

                    {pct !== null && (
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}

                    {(m.baselineValue !== null ||
                      m.currentValue !== null ||
                      m.targetValue !== null) && (
                      <p className="text-xs text-muted-foreground">
                        {[
                          m.baselineValue !== null && `Baseline: ${formatValue(m.baselineValue)}`,
                          m.currentValue !== null && `Current: ${formatValue(m.currentValue)}`,
                          m.targetValue !== null && `Target: ${formatValue(m.targetValue)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}

                    {m.ownerName && (
                      <p className="text-xs text-muted-foreground">Owner: {m.ownerName}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
