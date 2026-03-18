import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { parseAccountConfig } from "@/lib/account-config"
import ROICalculatorsClient from "./ROICalculatorsClient"

export const metadata = { title: "ROI Calculators" }

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ calc?: string; data?: string }>
}

const CALC_ID_MAP = [
  { id: "sos", flag: "enableCalcSpeedOfService" },
  { id: "lp", flag: "enableCalcLossPrevention" },
  { id: "labor", flag: "enableCalcLaborOptimization" },
  { id: "tco", flag: "enableCalcMultiSiteTCO" },
  { id: "dm", flag: "enableCalcDMTimeSavings" },
] as const

export default async function ROICalculatorsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { calc, data } = await searchParams

  const account = await db.account.findUnique({
    where: { slug },
    select: { config: true },
  })
  if (!account) notFound()

  const config = parseAccountConfig(account.config)
  const enabledCalcIds = CALC_ID_MAP
    .filter(({ flag }) => config[flag] !== false)
    .map(({ id }) => id)

  // Decode shared link data
  let sharedData: Record<string, unknown> | null = null
  if (data) {
    try {
      sharedData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"))
    } catch {
      // ignore malformed share links
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-foreground mb-1">ROI Calculators</h1>
        <p className="text-sm text-muted-foreground">
          Quantify the value of your pilot across five key areas.
        </p>
      </div>
      <ROICalculatorsClient
        slug={slug}
        initialCalc={calc ?? "sos"}
        sharedData={sharedData}
        readOnly={!!data}
        enabledCalcIds={enabledCalcIds}
      />
    </div>
  )
}
