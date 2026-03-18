"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { DISCLAIMER, ROI_DEFAULTS } from "@/lib/roi-defaults"
import SpeedOfServiceCalc from "./SpeedOfServiceCalc"
import LossPreventionCalc from "./LossPreventionCalc"
import LaborOptimizationCalc from "./LaborOptimizationCalc"
import MultiSiteTCOCalc from "./MultiSiteTCOCalc"
import DMTimeSavingsCalc from "./DMTimeSavingsCalc"

const CALCS = [
  { id: "sos", label: "Speed of Service" },
  { id: "lp", label: "Loss Prevention" },
  { id: "labor", label: "Labor Optimization" },
  { id: "tco", label: "Multi-Site TCO" },
  { id: "dm", label: "DM Time Savings" },
] as const

type CalcId = (typeof CALCS)[number]["id"]

interface Props {
  slug: string
  initialCalc: string
  sharedData: Record<string, unknown> | null
  readOnly: boolean
}

function storageKey(slug: string, calcId: CalcId) {
  return `roi-${slug}-${calcId}`
}

export default function ROICalculatorsClient({ slug, initialCalc, sharedData, readOnly }: Props) {
  const [activeCalc, setActiveCalc] = useState<CalcId>(
    CALCS.some((c) => c.id === initialCalc) ? (initialCalc as CalcId) : "sos"
  )

  function handleShare() {
    const key = storageKey(slug, activeCalc)
    const data = localStorage.getItem(key)
    if (!data) return
    const encoded = btoa(data)
    const url = `${window.location.origin}${window.location.pathname}?calc=${activeCalc}&data=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      alert("Share link copied to clipboard!")
    })
  }

  const sharedCalcData = sharedData && activeCalc ? (sharedData as Record<string, unknown>) : null

  return (
    <div className="space-y-6">
      {readOnly && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          You are viewing a shared read-only snapshot of this calculator.
        </div>
      )}

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {CALCS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCalc(c.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeCalc === c.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Active calculator */}
      <div className="space-y-4">
        {activeCalc === "sos" && (
          <SpeedOfServiceCalc
            storageKey={storageKey(slug, "sos")}
            readOnly={readOnly}
            sharedData={sharedCalcData}
          />
        )}
        {activeCalc === "lp" && (
          <LossPreventionCalc
            storageKey={storageKey(slug, "lp")}
            readOnly={readOnly}
            sharedData={sharedCalcData}
          />
        )}
        {activeCalc === "labor" && (
          <LaborOptimizationCalc
            storageKey={storageKey(slug, "labor")}
            readOnly={readOnly}
            sharedData={sharedCalcData}
          />
        )}
        {activeCalc === "tco" && (
          <MultiSiteTCOCalc
            storageKey={storageKey(slug, "tco")}
            readOnly={readOnly}
            sharedData={sharedCalcData}
          />
        )}
        {activeCalc === "dm" && (
          <DMTimeSavingsCalc
            storageKey={storageKey(slug, "dm")}
            readOnly={readOnly}
            sharedData={sharedCalcData}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start justify-between gap-4 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground italic max-w-xl">{DISCLAIMER}</p>
        {!readOnly && (
          <button
            onClick={handleShare}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            Share Link
          </button>
        )}
      </div>
    </div>
  )
}
