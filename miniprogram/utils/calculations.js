"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePricingSummary = exports.calculateBusinessSummary = exports.calculateNetMargin = exports.calculateTargetPrice = exports.calculateActualGrossMargin = exports.calculateTargetRevenue = exports.calculateBreakEvenRevenue = exports.sumFixedCosts = void 0;
/** Sum the monthly fixed-cost rows, treating an empty/invalid row as zero. */
const sumFixedCosts = (costs) => costs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
exports.sumFixedCosts = sumFixedCosts;
/** Monthly revenue at which gross profit exactly covers fixed costs. */
const calculateBreakEvenRevenue = (fixedCost, grossMarginPercent) => {
    const marginRate = grossMarginPercent / 100;
    return marginRate > 0 ? fixedCost / marginRate : 0;
};
exports.calculateBreakEvenRevenue = calculateBreakEvenRevenue;
/** Monthly revenue needed to cover fixed costs and the requested net profit. */
const calculateTargetRevenue = (fixedCost, targetProfit, grossMarginPercent) => {
    const marginRate = grossMarginPercent / 100;
    return marginRate > 0 ? (fixedCost + targetProfit) / marginRate : 0;
};
exports.calculateTargetRevenue = calculateTargetRevenue;
/** Gross margin percentage, with selling price as the denominator. */
const calculateActualGrossMargin = (productCost, sellingPrice) => sellingPrice > 0 ? ((sellingPrice - productCost) / sellingPrice) * 100 : 0;
exports.calculateActualGrossMargin = calculateActualGrossMargin;
/** Selling price required to reach a target gross margin percentage. */
const calculateTargetPrice = (productCost, targetMarginPercent) => targetMarginPercent < 100
    ? productCost / (1 - targetMarginPercent / 100)
    : 0;
exports.calculateTargetPrice = calculateTargetPrice;
/**
 * Net margin percentage using the app's established formula:
 * (price - cost - sales expense * (1 - tax rate)) / price.
 */
const calculateNetMargin = (productCost, sellingPrice, salesExpense, taxRatePercent) => sellingPrice > 0
    ? ((sellingPrice -
        productCost -
        salesExpense * (1 - taxRatePercent / 100)) /
        sellingPrice) *
        100
    : 0;
exports.calculateNetMargin = calculateNetMargin;
/** All store-level figures used by both the website and the mini program. */
const calculateBusinessSummary = ({ costs, grossMargin, days, targetProfit, }) => {
    const fixedCost = (0, exports.sumFixedCosts)(costs);
    const marginRate = grossMargin / 100;
    const breakEven = (0, exports.calculateBreakEvenRevenue)(fixedCost, grossMargin);
    const dailyBreakEven = days > 0 ? breakEven / days : 0;
    const targetRevenue = (0, exports.calculateTargetRevenue)(fixedCost, targetProfit, grossMargin);
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
exports.calculateBusinessSummary = calculateBusinessSummary;
/** All product-level figures used by both the website and the mini program. */
const calculatePricingSummary = ({ productCost, sellingPrice, targetMargin, salesExpense, taxRate, }) => ({
    actualMargin: (0, exports.calculateActualGrossMargin)(productCost, sellingPrice),
    suggestedPrice: (0, exports.calculateTargetPrice)(productCost, targetMargin),
    profitPerItem: sellingPrice - productCost,
    netMargin: (0, exports.calculateNetMargin)(productCost, sellingPrice, salesExpense, taxRate),
});
exports.calculatePricingSummary = calculatePricingSummary;
