"use client"

import { useState, useEffect } from "react"
import { ROI_DEFAULTS } from "@/lib/roi-defaults"
import { CalcLayout, CalcInput, CalcResult, fmt$, fmtN } from "./CalcLayout"

type Inputs = typeof ROI_DEFAULTS.speedOfService & Record<string, number>

interface Props {
  storageKey: string
  readOnly: boolean
  sharedData: Record<string, unknown> | null
}

export default function SpeedOfServiceCalc({ storageKey, readOnly, sharedData }: Props) {
  const [inputs, setInputs] = useState<Inputs>(() => {
    if (sharedData) return sharedData as Inputs
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { ...ROI_DEFAULTS.speedOfService }
  })

  useEffect(() => {
    if (!readOnly) localStorage.setItem(storageKey, JSON.stringify(inputs))
  }, [inputs, storageKey, readOnly])

  function set(key: keyof typeof inputs, val: number) {
    if (!readOnly) setInputs((prev) => ({ ...prev, [key]: val }))
  }

  const newSOS = inputs.currentSOS * (1 - inputs.expectedImprovement / 100)
  const timeSavedPerTx = inputs.currentSOS - newSOS // seconds
  const peakTransactions = inputs.dailyTransactions * (inputs.peakHourShare / 100)
  // Extra transactions = peak throughput increase. Assume 1 hr peak.
  const extraTxPerHourPerLocation = (3600 / newSOS) - (3600 / inputs.currentSOS)
  const extraTxPerLocationPerYear = Math.max(0, extraTxPerHourPerLocation * 365)
  const revenueUpliftPerLocation = extraTxPerLocationPerYear * inputs.avgTicketValue
  const totalRevenueUplift = revenueUpliftPerLocation * inputs.locations

  return (
    <CalcLayout
      inputs={
        <>
          <CalcInput label="Number of locations" value={inputs.locations} onChange={(v) => set("locations", v)} readOnly={readOnly} />
          <CalcInput label="Daily transactions per location" value={inputs.dailyTransactions} onChange={(v) => set("dailyTransactions", v)} readOnly={readOnly} />
          <CalcInput label="Average ticket value" value={inputs.avgTicketValue} onChange={(v) => set("avgTicketValue", v)} prefix="$" readOnly={readOnly} />
          <CalcInput label="Current speed of service" value={inputs.currentSOS} onChange={(v) => set("currentSOS", v)} suffix="sec" readOnly={readOnly} />
          <CalcInput label="Expected improvement" value={inputs.expectedImprovement} onChange={(v) => set("expectedImprovement", v)} suffix="%" min={0} readOnly={readOnly} />
          <CalcInput label="Peak hour share" value={inputs.peakHourShare} onChange={(v) => set("peakHourShare", v)} suffix="%" min={0} readOnly={readOnly} />
        </>
      }
      outputs={
        <>
          <CalcResult label="New SOS target" value={`${fmtN(newSOS, 1)} sec`} sub={`${fmtN(timeSavedPerTx, 1)} sec saved per transaction`} highlight />
          <CalcResult label="Extra transactions / location / year" value={fmtN(extraTxPerLocationPerYear)} />
          <CalcResult label="Revenue uplift per location / year" value={fmt$(revenueUpliftPerLocation)} />
          <CalcResult label="Total annual revenue uplift" value={fmt$(totalRevenueUplift)} highlight />
        </>
      }
    />
  )
}
