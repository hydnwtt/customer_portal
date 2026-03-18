export interface AccountConfig {
  enableRoiCalculator: boolean
  enableHelpfulLinks: boolean
  enableTimeline: boolean
  enableStakeholders: boolean
  enableSuccessMetrics: boolean
  enableWelcomePage: boolean
  // Individual ROI calculator toggles (only applied when enableRoiCalculator is true)
  enableCalcSpeedOfService: boolean
  enableCalcLossPrevention: boolean
  enableCalcLaborOptimization: boolean
  enableCalcMultiSiteTCO: boolean
  enableCalcDMTimeSavings: boolean
}

const DEFAULTS: AccountConfig = {
  enableRoiCalculator: true,
  enableHelpfulLinks: true,
  enableTimeline: true,
  enableStakeholders: true,
  enableSuccessMetrics: true,
  enableWelcomePage: true,
  enableCalcSpeedOfService: true,
  enableCalcLossPrevention: true,
  enableCalcLaborOptimization: true,
  enableCalcMultiSiteTCO: true,
  enableCalcDMTimeSavings: true,
}

function bool(val: unknown, fallback: boolean): boolean {
  return typeof val === "boolean" ? val : fallback
}

export function parseAccountConfig(raw: unknown): AccountConfig {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULTS }
  }
  const o = raw as Record<string, unknown>
  return {
    enableRoiCalculator:         bool(o.enableRoiCalculator,         DEFAULTS.enableRoiCalculator),
    enableHelpfulLinks:          bool(o.enableHelpfulLinks,          DEFAULTS.enableHelpfulLinks),
    enableTimeline:              bool(o.enableTimeline,              DEFAULTS.enableTimeline),
    enableStakeholders:          bool(o.enableStakeholders,          DEFAULTS.enableStakeholders),
    enableSuccessMetrics:        bool(o.enableSuccessMetrics,        DEFAULTS.enableSuccessMetrics),
    enableWelcomePage:           bool(o.enableWelcomePage,           DEFAULTS.enableWelcomePage),
    enableCalcSpeedOfService:    bool(o.enableCalcSpeedOfService,    DEFAULTS.enableCalcSpeedOfService),
    enableCalcLossPrevention:    bool(o.enableCalcLossPrevention,    DEFAULTS.enableCalcLossPrevention),
    enableCalcLaborOptimization: bool(o.enableCalcLaborOptimization, DEFAULTS.enableCalcLaborOptimization),
    enableCalcMultiSiteTCO:      bool(o.enableCalcMultiSiteTCO,      DEFAULTS.enableCalcMultiSiteTCO),
    enableCalcDMTimeSavings:     bool(o.enableCalcDMTimeSavings,     DEFAULTS.enableCalcDMTimeSavings),
  }
}
