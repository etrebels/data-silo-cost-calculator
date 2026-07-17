export const INDUSTRY_OPTIONS = [
  { value: "pharma", label: "Pharmaceuticals & Life Sciences" },
  { value: "finance", label: "Financial Services & Banking" },
  { value: "manufacturing", label: "Manufacturing & Supply Chain" },
  { value: "technology", label: "Technology & Software" },
  { value: "healthcare", label: "Healthcare" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "retail", label: "Retail & E-Commerce" },
  { value: "government", label: "Government & Public Sector" },
  { value: "other", label: "Other" },
] as const;

export type IndustryVertical = (typeof INDUSTRY_OPTIONS)[number]["value"];

export interface CalculatorInputs {
  companySize: number;
  dataSources: number;
  departments: number;
  industryVertical: IndustryVertical;
  annualDataSpend: number;
  dataTeamSize: number;
  initialPages: number;
  ongoingPagesPerYear: number;
}

export interface CostBreakdown {
  duplicatedEffort: number;
  dataSearchTime: number;
  missedInsights: number;
  integrationOverhead: number;
  /** Opportunity cost of data scientists doing data wrangling instead of analysis. */
  dataScientistWaste: number;
  totalAnnualWaste: number;
}

export interface KnowledgeGraphCosts {
  solutionAnnual: number;
  implementationCost: number;
  ongoingAnnualCost: number;
  totalFirstYear: number;
  totalOngoingAnnual: number;
}

export interface ROIProjection {
  projectedSavings: number;
  /** null means the investment never pays back (costs exceed savings). */
  paybackPeriodMonths: number | null;
  efficiencyGainPercent: number;
  firstYearROIPercent: number;
}

export interface CalculatorResults {
  currentCosts: CostBreakdown;
  knowledgeGraphCosts: KnowledgeGraphCosts;
  knowledgeGraphROI: ROIProjection;
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  companySize: 1000,
  dataSources: 10,
  departments: 6,
  industryVertical: "technology",
  annualDataSpend: 2000000,
  dataTeamSize: 10,
  initialPages: 5000,
  ongoingPagesPerYear: 1000,
};
