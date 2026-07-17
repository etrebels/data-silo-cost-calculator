import { describe, it, expect } from "vitest";
import { calculateResults } from "./calculator";
import { DEFAULT_INPUTS } from "./types";
import type { CalculatorInputs } from "./types";

describe("calculateResults", () => {
  it("returns all expected result sections with default inputs", () => {
    const results = calculateResults(DEFAULT_INPUTS);

    expect(results.currentCosts).toBeDefined();
    expect(results.knowledgeGraphCosts).toBeDefined();
    expect(results.knowledgeGraphROI).toBeDefined();
  });

  it("calculates positive waste for default inputs", () => {
    const results = calculateResults(DEFAULT_INPUTS);
    const { currentCosts } = results;

    expect(currentCosts.duplicatedEffort).toBeGreaterThan(0);
    expect(currentCosts.dataSearchTime).toBeGreaterThan(0);
    expect(currentCosts.missedInsights).toBeGreaterThan(0);
    expect(currentCosts.integrationOverhead).toBeGreaterThan(0);
    expect(currentCosts.dataScientistWaste).toBeGreaterThan(0);
    expect(currentCosts.totalAnnualWaste).toBe(
      currentCosts.duplicatedEffort +
        currentCosts.dataSearchTime +
        currentCosts.missedInsights +
        currentCosts.integrationOverhead +
        currentCosts.dataScientistWaste,
    );
  });

  it("includes the solution annual cost in KG costs", () => {
    const results = calculateResults(DEFAULT_INPUTS);
    expect(results.knowledgeGraphCosts.solutionAnnual).toBe(96000);
  });

  it("calculates totalFirstYear = subscription + implementation + ongoing", () => {
    const results = calculateResults(DEFAULT_INPUTS);
    const kg = results.knowledgeGraphCosts;
    expect(kg.totalFirstYear).toBe(
      kg.solutionAnnual + kg.implementationCost + kg.ongoingAnnualCost,
    );
  });

  it("calculates totalOngoingAnnual = subscription + ongoing", () => {
    const results = calculateResults(DEFAULT_INPUTS);
    const kg = results.knowledgeGraphCosts;
    expect(kg.totalOngoingAnnual).toBe(
      kg.solutionAnnual + kg.ongoingAnnualCost,
    );
  });

  it("caps efficiency gain at 85%", () => {
    const results = calculateResults(DEFAULT_INPUTS);
    expect(results.knowledgeGraphROI.efficiencyGainPercent).toBeLessThanOrEqual(85);
  });

  it("returns paybackPeriodMonths >= 1 when savings are positive", () => {
    const results = calculateResults(DEFAULT_INPUTS);
    expect(results.knowledgeGraphROI.projectedSavings).toBeGreaterThan(0);
    expect(results.knowledgeGraphROI.paybackPeriodMonths).toBeGreaterThanOrEqual(1);
  });

  it("returns null paybackPeriodMonths when costs exceed savings", () => {
    // Single person, 1 data source, negligible spend, KG costs more than it saves
    const tinyInputs: CalculatorInputs = {
      companySize: 5,
      dataSources: 1,
      departments: 1,
      industryVertical: "retail",
      annualDataSpend: 1000,
      dataTeamSize: 1,
      initialPages: 20000,
      ongoingPagesPerYear: 20000,
    };
    const results = calculateResults(tinyInputs);
    expect(results.knowledgeGraphROI.paybackPeriodMonths).toBeNull();
  });

  it("industry multiplier increases costs for pharma vs technology", () => {
    const techResults = calculateResults({ ...DEFAULT_INPUTS, industryVertical: "technology" });
    const pharmaResults = calculateResults({ ...DEFAULT_INPUTS, industryVertical: "pharma" });

    expect(pharmaResults.currentCosts.totalAnnualWaste).toBeGreaterThan(
      techResults.currentCosts.totalAnnualWaste,
    );
  });

  it("more data sources increases integration overhead", () => {
    const few = calculateResults({ ...DEFAULT_INPUTS, dataSources: 3 });
    const many = calculateResults({ ...DEFAULT_INPUTS, dataSources: 20 });

    expect(many.currentCosts.integrationOverhead).toBeGreaterThan(
      few.currentCosts.integrationOverhead,
    );
  });

  it("returns only integer values for costs", () => {
    const results = calculateResults(DEFAULT_INPUTS);
    expect(Number.isInteger(results.currentCosts.duplicatedEffort)).toBe(true);
    expect(Number.isInteger(results.currentCosts.dataSearchTime)).toBe(true);
    expect(Number.isInteger(results.currentCosts.missedInsights)).toBe(true);
    expect(Number.isInteger(results.currentCosts.integrationOverhead)).toBe(true);
    expect(Number.isInteger(results.currentCosts.totalAnnualWaste)).toBe(true);
    expect(Number.isInteger(results.knowledgeGraphROI.projectedSavings)).toBe(true);
  });

  it("caps duplicated effort at 40% of total team payroll", () => {
    // Extreme inputs to test the cap: huge team, many departments, pharma
    const extreme: CalculatorInputs = {
      companySize: 50000,
      dataSources: 50,
      departments: 20,
      industryVertical: "pharma",
      annualDataSpend: 100000000,
      dataTeamSize: 200,
      initialPages: 5000,
      ongoingPagesPerYear: 1000,
    };
    const results = calculateResults(extreme);
    const maxPayroll = 200 * 150000 * 0.4; // 40% of total payroll
    expect(results.currentCosts.duplicatedEffort).toBeLessThanOrEqual(maxPayroll);
  });
});
