import { cn } from "@/lib/utils"

interface RiskScoreBadgeProps {
  score: number
  isHighRisk: boolean
}

export function RiskScoreBadge({ score, isHighRisk }: RiskScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        isHighRisk
          ? "bg-destructive/10 text-destructive"
          : score > 40
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      )}
    >
      {score}
    </span>
  )
}
