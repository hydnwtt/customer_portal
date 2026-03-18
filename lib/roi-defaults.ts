/**
 * Industry benchmark defaults for ROI calculators.
 * Values are pre-populated in calculator inputs and can be edited by users.
 */

export const ROI_DEFAULTS = {
  speedOfService: {
    locations: 5,
    dailyTransactions: 500,
    avgTicketValue: 12,
    currentSOS: 180,       // seconds
    expectedImprovement: 10, // percent
    peakHourShare: 55,     // percent
  },
  lossPrevention: {
    locations: 5,
    annualRevenuePerLocation: 800000,
    currentShrinkRate: 2.5, // percent
    expectedShrinkReduction: 30, // percent
  },
  laborOptimization: {
    locations: 5,
    avgHourlyLaborCost: 18,
    hoursSavedPerLocationPerWeek: 10,
    weeksPerYear: 52,
  },
  multiSiteTCO: {
    sites: 5,
    currentCostPerSitePerYear: 15000,
    platformCostPerSitePerYear: 9000,
    implementationCost: 25000,
    expectedOpSavingsPerSitePerYear: 3000,
  },
  dmTimeSavings: {
    numDMs: 5,
    storesPerDM: 12,
    storeVisitsPerMonth: 8,
    hoursPerVisit: 3,
    dmHourlyCost: 75,
    expectedVisitReduction: 30, // percent
  },
} as const

export const DISCLAIMER =
  "These estimates are based on your inputs and industry benchmarks. Results are for illustrative purposes only."
