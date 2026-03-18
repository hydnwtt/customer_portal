"use client"

import { useState, useEffect } from "react"
import { ROI_DEFAULTS } from "@/lib/roi-defaults"
import { CalcLayout, CalcInput, CalcResult, fmt$, fmtN } from "./CalcLayout"

type Inputs = typeof ROI_DEFAULTS.laborOptimization & Record<string, number>

interface Props {
  storageKey: string
  readOnly: boolean
  sharedData: Record<string, unknown> | null
}

export default function LaborOptimizationCalc({ storageKey, readOnly, sharedData }: Props) {
  const [inputs, setInputs] = useState<Inputs>(() => {
    if (sharedData) return sharedData as Inputs
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { ...ROI_DEFAULTS.laborOptimization }
  })

  useEffect(() => {
    if (!readOnly) localStorage.setItem(storageKey, JSON.stringify(inputs))
  }, [inputs, storageKey, readOnly])

  function set(key: keyof typeof inputs, val: number) {
    if (!readOnly) setInputs((prev) => ({ ...prev, [key]: val }))
  }

  const annualHoursSavedPerLocation = inputs.hoursSavedPerLocationPerWeek * inputs.weeksPerYear
  const annualSavingsPerLocation = annualHoursSavedPerLocation * inputs.avgHourlyLaborCost
  const totalAnnualSavings = annualSavingsPerLocation * inputs.locations
  const fteRecovered = (annualHoursSavedPerLocation * inputs.locations) / 2080 // standard FTE hours

  return (
    <CalcLayout
      inputs={
        <>
          <CalcInput label="Number of locations" value={inputs.locations} onChange={(v) => set("locations", v)} readOnly={readOnly} />
          <CalcInput label="Average hourly labor cost" value={inputs.avgHourlyLaborCost} onChange={(v) => set("avgHourlyLaborCost", v)} prefix="$" readOnly={readOnly} />
          <CalcInput label="Hours saved per location per week" value={inputs.hoursSavedPerLocationPerWeek} onChange={(v) => set("hoursSavedPerLocationPerWeek", v)} suffix="hrs" readOnly={readOnly} />
          <CalcInput label="Weeks per year" value={inputs.weeksPerYear} onChange={(v) => set("weeksPerYear", v)} readOnly={readOnly} />
        </>
      }
      outputs={
        <>
          <CalcResult label="Annual hours saved per location" value={fmtN(annualHoursSavedPerLocation)} />
          <CalcResult label="Annual labor savings per location" value={fmt$(annualSavingsPerLocation)} />
          <CalcResult label="Total annual labor savings" value={fmt$(totalAnnualSavings)} highlight />
          <CalcResult label="FTE equivalent recovered" value={fmtN(fteRecovered, 1)} sub="Based on 2,080 hrs/year" />
        </>
      }
    />
  )
}
