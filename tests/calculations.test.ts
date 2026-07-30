import assert from "node:assert/strict";
import test from "node:test";

// Node's built-in TypeScript runner requires an explicit source extension.
// @ts-expect-error TypeScript source imports are intentional in this test runner.
import {
  calculateActualGrossMargin,
  calculateBreakEvenRevenue,
  calculateBusinessSummary,
  calculateNetMargin,
  calculatePricingSummary,
  calculateTargetPrice,
  calculateTargetRevenue,
  sumFixedCosts,
} from "../shared/calculations.ts";

const closeTo = (actual: number, expected: number, tolerance = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

test("fixed costs and break-even revenue use gross margin as a percentage", () => {
  const fixedCost = sumFixedCosts([
    { amount: 200_000 },
    { amount: 100_000 },
    { amount: 30_000 },
    { amount: 20_000 },
  ]);

  assert.equal(fixedCost, 350_000);
  closeTo(calculateBreakEvenRevenue(fixedCost, 33), 1_060_606.0606060605);
  assert.equal(calculateBreakEvenRevenue(fixedCost, 0), 0);
  assert.equal(calculateBreakEvenRevenue(fixedCost, -10), 0);
});

test("target revenue covers both fixed costs and target profit", () => {
  closeTo(calculateTargetRevenue(12_000, 8_000, 60), 33_333.333333333336);
  assert.equal(calculateTargetRevenue(12_000, 8_000, 0), 0);
});

test("actual gross margin divides by selling price, not cost", () => {
  closeTo(calculateActualGrossMargin(100, 130), 23.076923076923077);
  assert.equal(calculateActualGrossMargin(100, 0), 0);
  assert.equal(calculateActualGrossMargin(100, -1), 0);
});

test("target price reverses a valid target gross margin", () => {
  closeTo(calculateTargetPrice(100, 30), 142.85714285714286);
  assert.equal(calculateTargetPrice(100, 0), 100);
  assert.equal(calculateTargetPrice(100, 100), 0);
  assert.equal(calculateTargetPrice(100, 250), 0);
});

test("net margin follows the established sales-expense and tax formula", () => {
  closeTo(calculateNetMargin(100, 130, 10, 5), 15.76923076923077);
  assert.equal(calculateNetMargin(100, 0, 10, 5), 0);
});

test("business summary preserves daily and target goal selection", () => {
  const breakEvenOnly = calculateBusinessSummary({
    costs: [{ amount: 12_000 }],
    grossMargin: 60,
    days: 30,
    targetProfit: 0,
  });

  assert.equal(breakEvenOnly.marginRate, 0.6);
  assert.equal(breakEvenOnly.breakEven, 20_000);
  closeTo(breakEvenOnly.dailyBreakEven, 666.6666666666666);
  assert.equal(breakEvenOnly.monthlyGoal, breakEvenOnly.breakEven);
  assert.equal(breakEvenOnly.dailyGoal, breakEvenOnly.dailyBreakEven);

  const target = calculateBusinessSummary({
    costs: [{ amount: 12_000 }],
    grossMargin: 60,
    days: 30,
    targetProfit: 8_000,
  });
  closeTo(target.monthlyGoal, 33_333.333333333336);
  closeTo(target.dailyGoal, 1_111.111111111111);

  const noDays = calculateBusinessSummary({
    costs: [{ amount: 12_000 }],
    grossMargin: 60,
    days: 0,
    targetProfit: 8_000,
  });
  assert.equal(noDays.dailyBreakEven, 0);
  assert.equal(noDays.dailyTarget, 0);
  assert.equal(noDays.dailyGoal, 0);
});

test("pricing summary is consistent with the individual product formulas", () => {
  const summary = calculatePricingSummary({
    productCost: 100,
    sellingPrice: 130,
    targetMargin: 30,
    salesExpense: 10,
    taxRate: 5,
  });

  closeTo(summary.actualMargin, 23.076923076923077);
  closeTo(summary.suggestedPrice, 142.85714285714286);
  assert.equal(summary.profitPerItem, 30);
  closeTo(summary.netMargin, 15.76923076923077);
});
