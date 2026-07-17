import { CalculatorInputs, CalculatorResults, IndustryVertical } from "./types";
import {
  getImplementationCost,
  SOLUTION_ANNUAL_COST,
  ONGOING_COST_RATE,
} from "./pricing";

// ─── Data Silo Cost Assumptions ─────────────────────────────

// Industry multipliers reflect how much more/less each industry
// is affected by data silos. Pharma and finance have the highest
// cost of fragmented data due to regulation and complexity.
const INDUSTRY_MULTIPLIERS: Record<IndustryVertical, number> = {
  pharma: 1.4,
  finance: 1.35,
  healthcare: 1.3,
  manufacturing: 1.2,
  energy: 1.15,
  government: 1.1,
  technology: 1.0,
  retail: 0.95,
  other: 1.0,
};

// Average fully-loaded cost per employee for data-related work.
// "Fully loaded" means salary + benefits + tools + overhead.
const AVG_DATA_WORKER_COST = 150000;

// Hours per week a data worker wastes searching for, cleaning,
// or reconciling data across siloed systems. Conservative
// per-source estimate (Forrester reports up to 12 hrs/week total).
const HOURS_WASTED_PER_WEEK_PER_SILO = 1.5;

// Percentage of data team effort duplicated across departments
// when data is siloed (teams doing the same work independently).
const DUPLICATION_RATE = 0.15;

// Cost per point-to-point integration between two systems,
// including maintenance, monitoring, and incident response.
const INTEGRATION_COST_PER_PAIR = 25000;

// Knowledge graph reduction factors (conservative estimates)
const KG_SEARCH_TIME_REDUCTION = 0.5;
const KG_INTEGRATION_REDUCTION = 0.7;
const MAX_SEARCH_HOURS_PER_PERSON_PER_WEEK = 12;

// Data scientists spend 60% of their time cleaning and organizing data.
// Source: CrowdFlower (now Figure Eight) Data Scientist Survey, 2016.
// Corroborated by Anaconda State of Data Science surveys (2020-2021): 39-45%.
const DATA_SCIENTIST_WRANGLING_RATE = 0.60;
const AVG_DATA_SCIENTIST_COST = 180000;
const KG_WRANGLING_REDUCTION = 0.65;

// ─── Main Calculation ───────────────────────────────────────

export function calculateResults(inputs: CalculatorInputs): CalculatorResults {
  const multiplier = INDUSTRY_MULTIPLIERS[inputs.industryVertical];

  // Company size factor: logarithmic scaling so larger orgs
  // have proportionally more friction but it doesn't explode.
  // Guarded at zero so out-of-range API inputs (companySize <= 1)
  // can't produce a negative cost.
  const companySizeFactor = Math.max(
    0,
    Math.log10(inputs.companySize) / Math.log10(1000)
  );

  // ── Current data silo costs ──

  const duplicatedEffortRaw =
    inputs.dataTeamSize *
    AVG_DATA_WORKER_COST *
    DUPLICATION_RATE *
    (inputs.departments / 4) *
    multiplier *
    companySizeFactor;

  // Cap at 40% of total team payroll, you can't duplicate more
  // work than exists. Without this cap, extreme slider combos
  // (200 people × 20 depts × pharma) exceed total payroll.
  const totalTeamPayroll = inputs.dataTeamSize * AVG_DATA_WORKER_COST;
  const duplicatedEffort = Math.min(duplicatedEffortRaw, totalTeamPayroll * 0.4);

  // Search time: the industry multiplier scales the HOURS (regulated
  // industries carry more reconciliation overhead), inside the weekly cap -
  // never the dollar rate, so the 12 hr/wk cap genuinely bounds the claim.
  // Headcount excludes the ~30% data scientists whose wrangling time is
  // billed separately below, so the two categories don't overlap.
  const weeksPerYear = 48;
  const hourlyRate = AVG_DATA_WORKER_COST / (weeksPerYear * 40);
  const effectiveSiloHours = Math.min(
    HOURS_WASTED_PER_WEEK_PER_SILO * Math.sqrt(inputs.dataSources) * multiplier,
    MAX_SEARCH_HOURS_PER_PERSON_PER_WEEK
  );
  const dataSearchTime =
    inputs.dataTeamSize *
    0.7 *
    effectiveSiloHours *
    weeksPerYear *
    hourlyRate;

  const missedInsightsRaw =
    inputs.annualDataSpend * 0.08 * Math.sqrt(inputs.dataSources / 5) * multiplier;
  const missedInsights = Math.min(missedInsightsRaw, inputs.annualDataSpend * 0.2);

  const integrationPairs = (inputs.dataSources * (inputs.dataSources - 1)) / 2;
  const integrationOverhead =
    Math.min(integrationPairs, inputs.dataSources * 3) *
    INTEGRATION_COST_PER_PAIR *
    multiplier;

  // Opportunity cost of data scientists doing data janitorial work instead
  // of analysis. Estimate 30% of the data team are data scientists (rest
  // are engineers, analysts), costed at the higher scientist salary.
  const dataScientistWasteRaw =
    inputs.dataTeamSize *
    0.3 *
    AVG_DATA_SCIENTIST_COST *
    DATA_SCIENTIST_WRANGLING_RATE *
    multiplier;
  const dataScientistWasteUncapped = Math.min(
    dataScientistWasteRaw,
    totalTeamPayroll * 0.5
  );

  // Joint payroll cap: the three payroll-derived categories (duplication,
  // search, wrangling) together can never exceed 75% of the team's payroll -
  // a team can't waste more labor value than it costs. Individual caps alone
  // let extreme slider combos claim >100% of payroll.
  const laborWasteBeforeCap =
    duplicatedEffort + dataSearchTime + dataScientistWasteUncapped;
  const laborWasteCap = totalTeamPayroll * 0.75;
  const laborScale =
    laborWasteBeforeCap > laborWasteCap
      ? laborWasteCap / laborWasteBeforeCap
      : 1;
  const duplicatedEffortFinal = duplicatedEffort * laborScale;
  const dataSearchTimeFinal = dataSearchTime * laborScale;
  const dataScientistWaste = dataScientistWasteUncapped * laborScale;

  const totalAnnualWaste =
    duplicatedEffortFinal + dataSearchTimeFinal + missedInsights + integrationOverhead + dataScientistWaste;

  // ── Knowledge Graph costs (illustrative solution pricing) ──

  const implementationCost = getImplementationCost(inputs.initialPages);
  const ongoingAnnualCost = Math.floor(
    getImplementationCost(inputs.ongoingPagesPerYear) * ONGOING_COST_RATE
  );
  const totalFirstYear =
    SOLUTION_ANNUAL_COST + implementationCost + ongoingAnnualCost;
  const totalOngoingAnnual = SOLUTION_ANNUAL_COST + ongoingAnnualCost;

  // ── ROI projection ──

  const searchSavings = dataSearchTimeFinal * KG_SEARCH_TIME_REDUCTION;
  const integrationSavings = integrationOverhead * KG_INTEGRATION_REDUCTION;
  const duplicationSavings = duplicatedEffortFinal * 0.6;
  // Knowledge graphs surface hidden relationships, recovering a
  // portion of the value lost to missed insights. This makes the
  // Annual Data & Analytics Spend slider affect projected savings.
  const insightRecovery = missedInsights * 0.4;
  const dataScientistWranglingSavings = dataScientistWaste * KG_WRANGLING_REDUCTION;
  const grossSavings =
    searchSavings + integrationSavings + duplicationSavings + insightRecovery + dataScientistWranglingSavings;

  // Net savings = gross savings minus the annualized KG cost.
  // The one-time implementation cost is amortized over 3 years so
  // the initial pages slider visibly affects projected savings.
  const amortizationYears = 3;
  const annualizedKGCost =
    totalOngoingAnnual + implementationCost / amortizationYears;
  const projectedSavings = Math.max(0, grossSavings - annualizedKGCost);

  // Simple payback: months for GROSS savings to recoup the total first-year
  // investment. (Dividing by net-of-cost savings would double-count the KG
  // costs - once in the numerator, again in the denominator.) Only shown
  // when the ongoing position is net-positive, and capped: past 36 months
  // we report null ("N/A") rather than a multi-year figure.
  const rawPaybackMonths =
    projectedSavings > 0 && grossSavings > 0
      ? Math.ceil((totalFirstYear / grossSavings) * 12)
      : null;
  const paybackPeriodMonths =
    rawPaybackMonths !== null && rawPaybackMonths <= 36
      ? Math.max(1, rawPaybackMonths)
      : null;

  const efficiencyGainPercent =
    totalAnnualWaste > 0
      ? Math.round((grossSavings / totalAnnualWaste) * 100)
      : 0;

  // First-year ROI: gross savings against the total first-year investment.
  // (projectedSavings is already net of the annualized KG cost, so using it
  // here would subtract the costs twice.)
  const firstYearROIPercent =
    totalFirstYear > 0
      ? Math.round(((grossSavings - totalFirstYear) / totalFirstYear) * 100)
      : 0;

  return {
    currentCosts: {
      duplicatedEffort: Math.round(duplicatedEffortFinal),
      dataSearchTime: Math.round(dataSearchTimeFinal),
      missedInsights: Math.round(missedInsights),
      integrationOverhead: Math.round(integrationOverhead),
      dataScientistWaste: Math.round(dataScientistWaste),
      totalAnnualWaste: Math.round(totalAnnualWaste),
    },
    knowledgeGraphCosts: {
      solutionAnnual: SOLUTION_ANNUAL_COST,
      implementationCost,
      ongoingAnnualCost,
      totalFirstYear,
      totalOngoingAnnual,
    },
    knowledgeGraphROI: {
      projectedSavings: Math.round(projectedSavings),
      paybackPeriodMonths,
      efficiencyGainPercent: Math.min(85, efficiencyGainPercent),
      firstYearROIPercent,
    },
  };
}

