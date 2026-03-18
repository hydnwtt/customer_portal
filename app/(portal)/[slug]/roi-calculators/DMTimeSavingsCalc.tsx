"use client"

import { useState, useEffect } from "react"
import { ROI_DEFAULTS } from "@/lib/roi-defaults"
import { CalcLayout, CalcInput, CalcResult, fmt$, fmtN } from "./CalcLayout"

type Inputs = typeof ROI_DEFAULTS.dmTimeSavings & Record<string, number>

interface Props {
  storageKey: string
  readOnly: boolean
  sharedData: Record<string, unknown> | null
}

export default function DMTimeSavingsCalc({ storageKey, readOnly, sharedData }: Props) {
  const [inputs, setInputs] = useState<Inputs>(() => {
    if (sharedData) return sharedData as Inputs
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { ...ROI_DEFAULTS.dmTimeSavings }
  })

  useEffect(() => {
    if (!readOnly) localStorage.setItem(storageKey, JSON.stringify(inputs))
  }, [inputs, storageKey, readOnly])

  function set(key: keyof typeof inputs, val: number) {
    if (!readOnly) setInputs((prev) => ({ ...prev, [key]: val }))
  }

  const visitsReducedPerDMPerMonth =
    inputs.storeVisitsPerMonth * (inputs.expectedVisitReduction / 100)
  const hoursSavedPerDMPerMonth = visitsReducedPerDMPerMonth * inputs.hoursPerVisit
  const totalAnnualHoursSaved = hoursSavedPerDMPerMonth * 12 * inputs.numDMs
  const dollarValueRecovered = totalAnnualHoursSaved * inputs.dmHourlyCost
  const extraStoresSupported =
    inputs.storeVisitsPerMonth > 0
      ? visitsReducedPerDMPerMonth / (inputs.storeVisitsPerMonth / inputs.storesPerDM)
      : 0

  return (
    <CalcLayout
      inputs={
        <>
          <CalcInput label="Number of District Managers" value={inputs.numDMs} onChange={(v) => set("numDMs", v)} readOnly={readOnly} />
          <CalcInput label="Average stores per DM" value={inputs.storesPerDM} onChange={(v) => set("storesPerDM", v)} readOnly={readOnly} />
          <CalcInput label="Store visits per month (current)" value={inputs.storeVisitsPerMonth} onChange={(v) => set("storeVisitsPerMonth", v)} readOnly={readOnly} />
          <CalcInput label="Hours per store visit (travel + on-site)" value={inputs.hoursPerVisit} onChange={(v) => set("hoursPerVisit", v)} suffix="hrs" readOnly={readOnly} />
          <CalcInput label="DM fully-loaded hourly cost" value={inputs.dmHourlyCost} onChange={(v) => set("dmHourlyCost", v)} prefix="$" readOnly={readOnly} />
          <CalcInput label="Expected visit reduction via remote visibility" value={inputs.expectedVisitReduction} onChange={(v) => set("expectedVisitReduction", v)} suffix="%" readOnly={readOnly} />
        </>
      }
      outputs={
        <>
          <CalcResult label="Hours saved per DM per month" value={fmtN(hoursSavedPerDMPerMonth, 1)} highlight />
          <CalcResult label="Total hours saved across DM team / year" value={fmtN(totalAnnualHoursSaved)} />
          <CalcResult label="Dollar value of time recovered" value={fmt$(dollarValueRecovered)} highlight />
          <CalcResult label="Equivalent additional stores a DM could support" value={fmtN(extraStoresSupported, 1)} sub="Per DM" />
        </>
      }
    />
  )
}
