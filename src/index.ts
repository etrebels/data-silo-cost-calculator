// Types
export type {
  IndustryVertical,
  CalculatorInputs,
  CostBreakdown,
  KnowledgeGraphCosts,
  ROIProjection,
  CalculatorResults,
} from "./types";
export { INDUSTRY_OPTIONS, DEFAULT_INPUTS } from "./types";

// Pricing
export {
  SOLUTION_ANNUAL_COST,
  ONGOING_COST_RATE,
  getImplementationCost,
  formatCurrency,
} from "./pricing";

// Calculator
export { calculateResults } from "./calculator";
