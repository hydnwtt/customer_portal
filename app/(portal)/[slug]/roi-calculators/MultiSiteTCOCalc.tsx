"use client"

import { useState, useEffect } from "react"
import { ROI_DEFAULTS } from "@/lib/roi-defaults"
import { CalcLayout, CalcInput, CalcResult, fmt$, fmtN } from "./CalcLayout"

type Inputs = typeof ROI_DEFAULTS.multiSiteTCO & Record<string, number>

interface Props {
  storageKey: string
  readOnly: boolean
  sharedData: Record<string, unknown> | null
}

export default function MultiSiteTCOCalc({ storageKey, readOnly, sharedData }: Props) {
  const [inputs, setInputs] = useState<Inputs>(() => {
    if (sharedData) return sharedData as Inputs
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { ...ROI_DEFAULTS.multiSiteTCO }
  })

  useEffect(() => {
    if (!readOnly) localStorage.setItem(storageKey, JSON.stringify(inputs))
  }, [inputs, storageKey, readOnly])

  function set(key: keyof typeof inputs, val: number) {
    if (!readOnly) setInputs((prev) => ({ ...prev, [key]: val }))
  }

  const currentAnnualCost = inputs.sites * inputs.currentCostPerSitePerYear
  const platformAnnualCost = inputs.sites * inputs.platformCostPerSitePerYear
  const annualOpSavings = inputs.sites * inputs.expectedOpSavingsPerSitePerYear
  const annualSaving = currentAnnualCost - platformAnnualCost + annualOpSavings
  // Break-even: implementation cost / monthly net saving
  const monthlySaving = annualSaving / 12
  const breakEvenMonths = monthlySaving > 0 ? inputs.implementationCost / monthlySaving : Infinity

  const tco3yrCurrent = currentAnnualCost * 3
  const tco3yrPlatform = platformAnnualCost * 3 + inputs.implementationCost
  const netSavings3yr = tco3yrCurrent - tco3yrPlatform + annualOpSavings * 3

  return (
    <CalcLayout
      inputs={
        <>
          <CalcInput label="Number of sites" value={inputs.sites} onChange={(v) => set("sites", v)} readOnly={readOnly} />
          <CalcInput label="Current cost per site per year" value={inputs.currentCostPerSitePerYear} onChange={(v) => set("currentCostPerSitePerYear", v)} prefix="$" readOnly={readOnly} />
          <CalcInput label="Platform cost per site per year" value={inputs.platformCostPerSitePerYear} onChange={(v) => set("platformCostPerSitePerYear", v)} prefix="$" readOnly={readOnly} />
          <CalcInput label="One-time implementation cost" value={inputs.implementationCost} onChange={(v) => set("implementationCost", v)} prefix="$" readOnly={readOnly} />
          <CalcInput label="Expected operational savings per site / year" value={inputs.expectedOpSavingsPerSitePerYear} onChange={(v) => set("expectedOpSavingsPerSitePerYear", v)} prefix="$" readOnly={readOnly} />
        </>
      }
      outputs={
        <>
          <CalcResult label="Break-even point" value={isFinite(breakEvenMonths) ? `${fmtN(breakEvenMonths, 1)} months` : "N/A"} highlight />
          <CalcResult label="3-year TCO — current" value={fmt$(tco3yrCurrent)} />
          <CalcResult label="3-year TCO — platform" value={fmt$(tco3yrPlatform)} />
          <CalcResult label="Net savings over 3 years" value={fmt$(netSavings3yr)} highlight />
        </>
      }
    />
  )
}
