import { Badge } from "@/components/ui/badge"
import type { AccountStatus } from "@prisma/client"

const STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE_PILOT: { label: "Active Pilot", variant: "default" },
  EVALUATION: { label: "Evaluation", variant: "secondary" },
  CHURNED: { label: "Churned", variant: "destructive" },
  CONVERTED: { label: "Converted", variant: "outline" },
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
