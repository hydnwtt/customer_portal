export interface AccountConfig {
  enableRoiCalculator: boolean
  enableHelpfulLinks: boolean
  enableTimeline: boolean
  enableStakeholders: boolean
  enableSuccessMetrics: boolean
  enableWelcomePage: boolean
}

const DEFAULTS: AccountConfig = {
  enableRoiCalculator: true,
  enableHelpfulLinks: true,
  enableTimeline: true,
  enableStakeholders: true,
  enableSuccessMetrics: true,
  enableWelcomePage: true,
}

export function parseAccountConfig(raw: unknown): AccountConfig {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULTS }
  }
  const obj = raw as Record<string, unknown>
  return {
    enableRoiCalculator: typeof obj.enableRoiCalculator === "boolean" ? obj.enableRoiCalculator : DEFAULTS.enableRoiCalculator,
    enableHelpfulLinks: typeof obj.enableHelpfulLinks === "boolean" ? obj.enableHelpfulLinks : DEFAULTS.enableHelpfulLinks,
    enableTimeline: typeof obj.enableTimeline === "boolean" ? obj.enableTimeline : DEFAULTS.enableTimeline,
    enableStakeholders: typeof obj.enableStakeholders === "boolean" ? obj.enableStakeholders : DEFAULTS.enableStakeholders,
    enableSuccessMetrics: typeof obj.enableSuccessMetrics === "boolean" ? obj.enableSuccessMetrics : DEFAULTS.enableSuccessMetrics,
    enableWelcomePage: typeof obj.enableWelcomePage === "boolean" ? obj.enableWelcomePage : DEFAULTS.enableWelcomePage,
  }
}
