export interface RiskScoreInput {
  lastCustomerLoginAt: Date | null
  tasks: Array<{ status: string; dueDate: Date | null }>
  successMetrics: Array<{ status: string }>
  goNoGoDate: Date | null
}

export interface RiskScoreResult {
  score: number
  isHighRisk: boolean
  signals: {
    loginStaleness: number
    overdueTasks: number
    atRiskMetrics: number
    goNoGoUrgency: number
  }
}

export function computeRiskScore(input: RiskScoreInput): RiskScoreResult {
  const now = new Date()

  // Signal A — Login staleness (25 pts)
  let loginStaleness: number
  if (input.lastCustomerLoginAt === null) {
    loginStaleness = 25
  } else {
    const daysSince = Math.max(
      0,
      (now.getTime() - input.lastCustomerLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    loginStaleness = (Math.min(daysSince, 30) / 30) * 25
  }

  // Signal B — Overdue tasks (30 pts)
  let overdueTasks: number
  const totalTasks = input.tasks.length
  if (totalTasks === 0) {
    overdueTasks = 0
  } else {
    const overdueCount = input.tasks.filter(
      (t) =>
        t.dueDate !== null &&
        t.dueDate < now &&
        t.status !== "COMPLETED" &&
        t.status !== "CANCELLED"
    ).length
    overdueTasks = (overdueCount / totalTasks) * 30
  }

  // Signal C — AT_RISK metrics (25 pts)
  const atRiskCount = input.successMetrics.filter((m) => m.status === "AT_RISK").length
  const atRiskMetrics = (Math.min(atRiskCount, 4) / 4) * 25

  // Signal D — Go/No-Go urgency (20 pts)
  let goNoGoUrgency: number
  if (input.goNoGoDate === null) {
    goNoGoUrgency = 0
  } else {
    const daysLeft = (input.goNoGoDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    goNoGoUrgency = (Math.max(0, 60 - daysLeft) / 60) * 20
  }

  const score = Math.min(
    100,
    Math.round(loginStaleness + overdueTasks + atRiskMetrics + goNoGoUrgency)
  )

  return {
    score,
    isHighRisk: score > 65,
    signals: {
      loginStaleness: Math.round(loginStaleness),
      overdueTasks: Math.round(overdueTasks),
      atRiskMetrics: Math.round(atRiskMetrics),
      goNoGoUrgency: Math.round(goNoGoUrgency),
    },
  }
}
