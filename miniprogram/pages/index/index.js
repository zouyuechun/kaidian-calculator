const {
  calculateBusinessSummary,
  calculatePricingSummary,
} = require('../../utils/calculations.js');

const STORAGE_KEY = 'kaidian-calculator';
const TABS = ['home', 'costs', 'pricing', 'formula'];
const PRICING_MODES = ['margin', 'quote'];
const NUMBER_FIELDS = [
  'grossMargin',
  'days',
  'targetProfit',
  'productCost',
  'sellingPrice',
  'targetMargin',
  'salesExpense',
  'taxRate',
];

const DEFAULT_DATA = {
  activeTab: 'home',
  pricingMode: 'margin',
  costs: [
    { id: 'rent', name: '店铺租金', amount: 200000 },
    { id: 'salary', name: '人员工资', amount: 100000 },
    { id: 'utilities', name: '水电物业', amount: 30000 },
    { id: 'other', name: '其他固定支出', amount: 20000 },
  ],
  grossMargin: 33,
  days: 30,
  targetProfit: 0,
  productCost: 100,
  sellingPrice: 130,
  targetMargin: 30,
  salesExpense: 0,
  taxRate: 0,
};

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value, maximumFractionDigits = 2) {
  const number = toFiniteNumber(value);
  const fixed = number.toFixed(maximumFractionDigits);
  const normalized = fixed.includes('.')
    ? fixed.replace(/0+$/, '').replace(/\.$/, '')
    : fixed;
  const parts = normalized.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function formatAmount(value) {
  return `¥${formatNumber(value)}`;
}

function formatPercent(value) {
  return `${formatNumber(value)}%`;
}

function sanitizeCosts(costs) {
  if (!Array.isArray(costs)) {
    return DEFAULT_DATA.costs.map((item) => ({ ...item }));
  }

  return costs
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: item.id || `cost-${index + 1}`,
      name: typeof item.name === 'string' ? item.name : `成本${index + 1}`,
      amount: item.amount === '' ? '' : toFiniteNumber(item.amount),
    }));
}

function restoreData() {
  try {
    const saved = wx.getStorageSync(STORAGE_KEY);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      return {};
    }

    const restored = {};
    if (TABS.includes(saved.activeTab)) restored.activeTab = saved.activeTab;
    if (PRICING_MODES.includes(saved.pricingMode)) restored.pricingMode = saved.pricingMode;
    if (Object.prototype.hasOwnProperty.call(saved, 'costs')) {
      restored.costs = sanitizeCosts(saved.costs);
    }
    NUMBER_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(saved, field)) {
        restored[field] = saved[field] === '' ? '' : toFiniteNumber(saved[field]);
      }
    });
    return restored;
  } catch (error) {
    console.warn('读取本地数据失败，将使用默认值。', error);
    return {};
  }
}

function createMetrics(data) {
  const business = calculateBusinessSummary({
    costs: data.costs,
    grossMargin: data.grossMargin,
    days: data.days,
    targetProfit: data.targetProfit,
  });
  const pricing = calculatePricingSummary({
    productCost: data.productCost,
    sellingPrice: data.sellingPrice,
    targetMargin: data.targetMargin,
    salesExpense: data.salesExpense,
    taxRate: data.taxRate,
  });

  return {
    ...business,
    ...pricing,
    fixedCostText: formatAmount(business.fixedCost),
    breakEvenText: formatAmount(business.breakEven),
    dailyBreakEvenText: formatAmount(business.dailyBreakEven),
    targetProfitText: formatAmount(data.targetProfit),
    targetRevenueText: formatAmount(business.targetRevenue),
    dailyTargetText: formatAmount(business.dailyTarget),
    monthlyGoalText: formatAmount(business.monthlyGoal),
    dailyGoalText: formatAmount(business.dailyGoal),
    actualMarginText: formatPercent(pricing.actualMargin),
    suggestedPriceText: formatAmount(pricing.suggestedPrice),
    profitPerItemText: formatAmount(pricing.profitPerItem),
    netMarginText: formatPercent(pricing.netMargin),
  };
}

Page({
  data: {
    ...DEFAULT_DATA,
    metrics: {
      fixedCost: 0,
      marginRate: 0,
      breakEven: 0,
      dailyBreakEven: 0,
      targetRevenue: 0,
      dailyTarget: 0,
      monthlyGoal: 0,
      dailyGoal: 0,
      actualMargin: 0,
      suggestedPrice: 0,
      profitPerItem: 0,
      netMargin: 0,
      fixedCostText: '¥0',
      breakEvenText: '¥0',
      dailyBreakEvenText: '¥0',
      targetProfitText: '¥0',
      targetRevenueText: '¥0',
      dailyTargetText: '¥0',
      monthlyGoalText: '¥0',
      dailyGoalText: '¥0',
      actualMarginText: '0%',
      suggestedPriceText: '¥0',
      profitPerItemText: '¥0',
      netMarginText: '0%',
    },
  },

  onLoad() {
    this.setData(restoreData(), () => {
      this.refreshMetrics(false);
    });
  },

  goTo(event) {
    const tab = event.currentTarget.dataset.tab;
    if (!TABS.includes(tab)) return;
    this.setData({ activeTab: tab }, () => this.saveData());
  },

  setPricingMode(event) {
    const mode = event.currentTarget.dataset.mode;
    if (!PRICING_MODES.includes(mode)) return;
    this.setData({ pricingMode: mode }, () => this.saveData());
  },

  onNumberInput(event) {
    const field = event.currentTarget.dataset.field;
    if (!NUMBER_FIELDS.includes(field)) return;
    this.setData({ [field]: event.detail.value }, () => this.refreshMetrics());
  },

  onCostNameInput(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || index < 0 || index >= this.data.costs.length) return;
    this.setData({ [`costs[${index}].name`]: event.detail.value }, () => this.saveData());
  },

  onCostAmountInput(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || index < 0 || index >= this.data.costs.length) return;
    this.setData({ [`costs[${index}].amount`]: event.detail.value }, () => this.refreshMetrics());
  },

  addCost() {
    const costs = this.data.costs.concat({
      id: `cost-${Date.now()}-${this.data.costs.length + 1}`,
      name: '其他成本',
      amount: '',
    });
    this.setData({ costs }, () => this.refreshMetrics());
  },

  removeCost(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || index < 0 || index >= this.data.costs.length) return;
    const costs = this.data.costs.filter((_, itemIndex) => itemIndex !== index);
    this.setData({ costs }, () => this.refreshMetrics());
  },

  copySummary() {
    const metrics = this.data.metrics;
    const summary = this.data.activeTab === 'pricing'
      ? [
          '开店成本计算器 · 商品定价',
          `实际毛利率：${metrics.actualMarginText}`,
          `目标售价：${metrics.suggestedPriceText}`,
          `单件毛利润：${metrics.profitPerItemText}`,
          `净利率：${metrics.netMarginText}`,
        ].join('\n')
      : [
          '开店成本计算器 · 经营目标',
          `月固定成本：${metrics.fixedCostText}`,
          `月保本营业额：${metrics.breakEvenText}`,
          `月目标净利润：${metrics.targetProfitText}`,
          `月目标营业额：${metrics.targetRevenueText}`,
          `每日销售任务：${metrics.dailyGoalText}`,
        ].join('\n');

    wx.setClipboardData({
      data: summary,
      success() {
        wx.showToast({ title: '已复制', icon: 'success' });
      },
      fail() {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' });
      },
    });
  },

  refreshMetrics(shouldSave = true) {
    let metrics;
    try {
      metrics = createMetrics(this.data);
    } catch (error) {
      console.warn('计算失败，暂时保留上一次结果。', error);
      return;
    }

    this.setData({ metrics }, () => {
      if (shouldSave) this.saveData();
    });
  },

  saveData() {
    const dataToSave = {
      activeTab: this.data.activeTab,
      pricingMode: this.data.pricingMode,
      costs: this.data.costs,
    };
    NUMBER_FIELDS.forEach((field) => {
      dataToSave[field] = this.data[field];
    });

    try {
      wx.setStorageSync(STORAGE_KEY, dataToSave);
    } catch (error) {
      console.warn('保存本地数据失败，本次使用不受影响。', error);
    }
  },
});
