import ROICalculatorsClient from "./ROICalculatorsClient"

export const metadata = { title: "ROI Calculators" }

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ calc?: string; data?: string }>
}

export default async function ROICalculatorsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { calc, data } = await searchParams

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
      />
    </div>
  )
}
