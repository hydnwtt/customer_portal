"use client"

import { useState, useEffect } from "react"
import { ROI_DEFAULTS } from "@/lib/roi-defaults"
import { CalcLayout, CalcInput, CalcResult, fmt$ } from "./CalcLayout"

type Inputs = typeof ROI_DEFAULTS.lossPrevention & Record<string, number>

interface Props {
  storageKey: string
  readOnly: boolean
  sharedData: Record<string, unknown> | null
}

export default function LossPreventionCalc({ storageKey, readOnly, sharedData }: Props) {
  const [inputs, setInputs] = useState<Inputs>(() => {
    if (sharedData) return sharedData as Inputs
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { ...ROI_DEFAULTS.lossPrevention }
  })

  useEffect(() => {
    if (!readOnly) localStorage.setItem(storageKey, JSON.stringify(inputs))
  }, [inputs, storageKey, readOnly])

  function set(key: keyof typeof inputs, val: number) {
    if (!readOnly) setInputs((prev) => ({ ...prev, [key]: val }))
  }

  const totalRevenue = inputs.locations * inputs.annualRevenuePerLocation
  const currentShrinkCost = totalRevenue * (inputs.currentShrinkRate / 100)
  const shrinkReduction = currentShrinkCost * (inputs.expectedShrinkReduction / 100)
  const roi1yr = shrinkReduction
  const roi2yr = shrinkReduction * 2
  const roi3yr = shrinkReduction * 3

  return (
    <CalcLayout
      inputs={
        <>
          <CalcInput label="Number of locations" value={inputs.locations} onChange={(v) => set("locations", v)} readOnly={readOnly} />
          <CalcInput label="Annual revenue per location" value={inputs.annualRevenuePerLocation} onChange={(v) => set("annualRevenuePerLocation", v)} prefix="$" readOnly={readOnly} />
          <CalcInput label="Current shrink rate" value={inputs.currentShrinkRate} onChange={(v) => set("currentShrinkRate", v)} suffix="%" readOnly={readOnly} />
          <CalcInput label="Expected shrink reduction" value={inputs.expectedShrinkReduction} onChange={(v) => set("expectedShrinkReduction", v)} suffix="%" readOnly={readOnly} />
        </>
      }
      outputs={
        <>
          <CalcResult label="Current annual shrink cost" value={fmt$(currentShrinkCost)} sub="Across all locations" />
          <CalcResult label="Projected shrink reduction" value={fmt$(shrinkReduction)} highlight />
          <CalcResult label="ROI — Year 1" value={fmt$(roi1yr)} />
          <CalcResult label="ROI — Year 2" value={fmt$(roi2yr)} />
          <CalcResult label="ROI — Year 3" value={fmt$(roi3yr)} highlight />
        </>
      }
    />
  )
}
