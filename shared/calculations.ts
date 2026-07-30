export type CostAmount = {
  amount: number;
};

export type BusinessSummaryInput = {
  costs: readonly CostAmount[];
  grossMargin: number;
  days: number;
  targetProfit: number;
};

export type BusinessSummary = {
  fixedCost: number;
  marginRate: number;
  breakEven: number;
  dailyBreakEven: number;
  targetRevenue: number;
  dailyTarget: number;
  monthlyGoal: number;
  dailyGoal: number;
};

export type PricingSummaryInput = {
  productCost: number;
  sellingPrice: number;
  targetMargin: number;
  salesExpense: number;
  taxRate: number;
};

export type PricingSummary = {
  actualMargin: number;
  suggestedPrice: number;
  profitPerItem: number;
  netMargin: number;
};

/** Sum the monthly fixed-cost rows, treating an empty/invalid row as zero. */
export const sumFixedCosts = (costs: readonly CostAmount[]): number =>
  costs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

/** Monthly revenue at which gross profit exactly covers fixed costs. */
export const calculateBreakEvenRevenue = (
  fixedCost: number,
  grossMarginPercent: number,
): number => {
  const marginRate = grossMarginPercent / 100;
  return marginRate > 0 ? fixedCost / marginRate : 0;
};

/** Monthly revenue needed to cover fixed costs and the requested net profit. */
export const calculateTargetRevenue = (
  fixedCost: number,
  targetProfit: number,
  grossMarginPercent: number,
): number => {
  const marginRate = grossMarginPercent / 100;
  return marginRate > 0 ? (fixedCost + targetProfit) / marginRate : 0;
};

/** Gross margin percentage, with selling price as the denominator. */
export const calculateActualGrossMargin = (
  productCost: number,
  sellingPrice: number,
): number =>
  sellingPrice > 0 ? ((sellingPrice - productCost) / sellingPrice) * 100 : 0;

/** Selling price required to reach a target gross margin percentage. */
export const calculateTargetPrice = (
  productCost: number,
  targetMarginPercent: number,
): number =>
  targetMarginPercent < 100
    ? productCost / (1 - targetMarginPercent / 100)
    : 0;

/**
 * Net margin percentage using the app's established formula:
 * (price - cost - sales expense * (1 - tax rate)) / price.
 */
export const calculateNetMargin = (
  productCost: number,
  sellingPrice: number,
  salesExpense: number,
  taxRatePercent: number,
): number =>
  sellingPrice > 0
    ? ((sellingPrice -
        productCost -
        salesExpense * (1 - taxRatePercent / 100)) /
        sellingPrice) *
      100
    : 0;

/** All store-level figures used by both the website and the mini program. */
export const calculateBusinessSummary = ({
  costs,
  grossMargin,
  days,
  targetProfit,
}: BusinessSummaryInput): BusinessSummary => {
  const fixedCost = sumFixedCosts(costs);
  const marginRate = grossMargin / 100;
  const breakEven = calculateBreakEvenRevenue(fixedCost, grossMargin);
  const dailyBreakEven = days > 0 ? breakEven / days : 0;
  const targetRevenue = calculateTargetRevenue(
    fixedCost,
    targetProfit,
    grossMargin,
  );
  const dailyTarget = days > 0 ? targetRevenue / days : 0;
  const monthlyGoal = targetProfit > 0 ? targetRevenue : breakEven;
  const dailyGoal = targetProfit > 0 ? dailyTarget : dailyBreakEven;

  return {
    fixedCost,
    marginRate,
    breakEven,
    dailyBreakEven,
    targetRevenue,
    dailyTarget,
    monthlyGoal,
    dailyGoal,
  };
};

/** All product-level figures used by both the website and the mini program. */
export const calculatePricingSummary = ({
  productCost,
  sellingPrice,
  targetMargin,
  salesExpense,
  taxRate,
}: PricingSummaryInput): PricingSummary => ({
  actualMargin: calculateActualGrossMargin(productCost, sellingPrice),
  suggestedPrice: calculateTargetPrice(productCost, targetMargin),
  profitPerItem: sellingPrice - productCost,
  netMargin: calculateNetMargin(
    productCost,
    sellingPrice,
    salesExpense,
    taxRate,
  ),
});
