"use client";

import { useEffect, useMemo, useState } from "react";

type CostItem = { id: number; name: string; amount: number };

const starterCosts: CostItem[] = [
  { id: 1, name: "店铺租金", amount: 200000 },
  { id: 2, name: "人员工资", amount: 100000 },
  { id: 3, name: "水电物业", amount: 30000 },
  { id: 4, name: "其他固定支出", amount: 20000 },
];

const money = (value: number, digits = 0) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const compactMoney = (value: number) => {
  if (!Number.isFinite(value)) return "¥0";
  if (Math.abs(value) >= 10000) {
    return `¥${(value / 10000).toLocaleString("zh-CN", {
      maximumFractionDigits: 2,
    })}万`;
  }
  return money(value);
};

function NumberField({
  label,
  value,
  onChange,
  suffix = "元",
  min = 0,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-shell">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span>{suffix}</span>
      </span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function Home() {
  const [costs, setCosts] = useState<CostItem[]>(starterCosts);
  const [grossMargin, setGrossMargin] = useState(33);
  const [days, setDays] = useState(30);
  const [targetProfit, setTargetProfit] = useState(0);
  const [productCost, setProductCost] = useState(100);
  const [sellingPrice, setSellingPrice] = useState(130);
  const [targetMargin, setTargetMargin] = useState(30);
  const [salesExpense, setSalesExpense] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kaidian-calculator");
    if (!saved) {
      setLoaded(true);
      return;
    }
    try {
      const data = JSON.parse(saved);
      if (Array.isArray(data.costs)) setCosts(data.costs);
      if (Number.isFinite(data.grossMargin)) setGrossMargin(data.grossMargin);
      if (Number.isFinite(data.days)) setDays(data.days);
      if (Number.isFinite(data.targetProfit)) setTargetProfit(data.targetProfit);
    } catch {
      // Ignore invalid local data and keep the useful defaults.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      "kaidian-calculator",
      JSON.stringify({ costs, grossMargin, days, targetProfit }),
    );
  }, [costs, grossMargin, days, targetProfit, loaded]);

  const fixedCost = useMemo(
    () => costs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [costs],
  );
  const marginRate = grossMargin / 100;
  const breakEven = marginRate > 0 ? fixedCost / marginRate : 0;
  const dailyBreakEven = days > 0 ? breakEven / days : 0;
  const targetRevenue =
    marginRate > 0 ? (fixedCost + targetProfit) / marginRate : 0;
  const dailyTarget = days > 0 ? targetRevenue / days : 0;
  const actualMargin =
    sellingPrice > 0 ? ((sellingPrice - productCost) / sellingPrice) * 100 : 0;
  const suggestedPrice =
    targetMargin < 100 ? productCost / (1 - targetMargin / 100) : 0;
  const profitPerItem = sellingPrice - productCost;
  const netMargin =
    sellingPrice > 0
      ? ((sellingPrice - productCost - salesExpense * (1 - taxRate / 100)) /
          sellingPrice) *
        100
      : 0;

  const updateCost = (id: number, patch: Partial<CostItem>) =>
    setCosts((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const copySummary = async () => {
    const summary = `开店测算结果
月固定成本：${money(fixedCost)}
综合毛利率：${grossMargin}%
月保本营业额：${money(breakEven)}
日保本营业额：${money(dailyBreakEven)}
月目标利润：${money(targetProfit)}
月目标营业额：${money(targetRevenue)}
日目标营业额：${money(dailyTarget)}`;
    await navigator.clipboard.writeText(summary);
    notify("测算结果已复制");
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="开店账本首页">
          <span className="brand-mark">算</span>
          <span>开店账本</span>
        </a>
        <a className="formula-link" href="#formula">
          公式说明
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">实体店经营测算工具</span>
          <h1>
            开店前，先把账
            <br />
            <em>算明白。</em>
          </h1>
          <p>
            算清保本线、目标营业额和商品售价。
            <br />
            不凭感觉定价，让每一笔生意都有数。
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#calculator">
              开始测算 <span>↓</span>
            </a>
            <span className="saved-note">
              <i>✓</i> 数据自动保存在本机
            </span>
          </div>
        </div>
        <div className="hero-result" aria-label="今日经营目标">
          <div className="result-head">
            <span>今日经营目标</span>
            <span className="live"><i /> 实时测算</span>
          </div>
          <span className="result-kicker">每天至少要做到</span>
          <strong>{compactMoney(targetProfit > 0 ? dailyTarget : dailyBreakEven)}</strong>
          <span className="result-unit">营业额 / 天</span>
          <div className="progress-track">
            <span style={{ width: `${Math.min(100, Math.max(8, grossMargin))}%` }} />
          </div>
          <div className="result-foot">
            <span>月固定成本 <b>{compactMoney(fixedCost)}</b></span>
            <span>综合毛利率 <b>{grossMargin}%</b></span>
          </div>
          <p>达到这条线，店铺才开始真正赚钱</p>
        </div>
      </section>

      <section className="calculator-section" id="calculator">
        <div className="section-heading">
          <span className="step">01</span>
          <div>
            <h2>先算清你的固定成本</h2>
            <p>不管有没有生意，每个月都要支付的钱</p>
          </div>
        </div>

        <div className="workspace">
          <div className="cost-panel">
            <div className="cost-list">
              {costs.map((item) => (
                <div className="cost-row" key={item.id}>
                  <input
                    className="cost-name"
                    aria-label="成本名称"
                    value={item.name}
                    onChange={(e) => updateCost(item.id, { name: e.target.value })}
                  />
                  <span className="cost-amount">
                    <span>¥</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      aria-label={`${item.name}金额`}
                      value={item.amount}
                      onChange={(e) =>
                        updateCost(item.id, { amount: Number(e.target.value) })
                      }
                    />
                  </span>
                  <button
                    className="remove"
                    aria-label={`删除${item.name}`}
                    onClick={() =>
                      setCosts((items) => items.filter((x) => x.id !== item.id))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              className="add-cost"
              onClick={() =>
                setCosts((items) => [
                  ...items,
                  { id: Date.now(), name: "新增固定支出", amount: 0 },
                ])
              }
            >
              ＋ 添加一项固定成本
            </button>
            <div className="total-row">
              <span>每月固定成本合计</span>
              <strong>{money(fixedCost)}</strong>
            </div>
          </div>

          <div className="business-panel">
            <div className="input-grid">
              <NumberField
                label="综合毛利率"
                value={grossMargin}
                onChange={setGrossMargin}
                suffix="%"
                min={0.01}
                max={99.99}
                hint="（售价 − 成本）÷ 售价"
              />
              <NumberField
                label="每月营业天数"
                value={days}
                onChange={setDays}
                suffix="天"
                min={1}
                max={31}
              />
              <NumberField
                label="希望每月净赚"
                value={targetProfit}
                onChange={setTargetProfit}
                suffix="元"
                min={0}
              />
            </div>
            <div className="answer-grid">
              <article className="answer-card light">
                <span>保本营业额 / 月</span>
                <strong>{compactMoney(breakEven)}</strong>
                <small>{money(fixedCost)} ÷ {grossMargin}%</small>
              </article>
              <article className="answer-card dark">
                <span>{targetProfit > 0 ? "目标营业额 / 月" : "保本营业额 / 天"}</span>
                <strong>
                  {compactMoney(targetProfit > 0 ? targetRevenue : dailyBreakEven)}
                </strong>
                <small>
                  {targetProfit > 0
                    ? `（固定成本 + ${compactMoney(targetProfit)}）÷ 毛利率`
                    : `按 ${days} 个营业日计算`}
                </small>
              </article>
              {targetProfit > 0 && (
                <article className="answer-card accent">
                  <span>每日销售任务</span>
                  <strong>{compactMoney(dailyTarget)}</strong>
                  <small>目标营业额 ÷ {days} 天</small>
                </article>
              )}
            </div>
            <button className="copy-button" onClick={copySummary}>
              复制完整测算结果
            </button>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="section-heading">
          <span className="step">02</span>
          <div>
            <h2>商品定价，别把加价率当毛利率</h2>
            <p>毛利率永远以售价为分母</p>
          </div>
        </div>
        <div className="pricing-grid">
          <article className="tool-card">
            <div className="tool-title">
              <span className="tool-icon">率</span>
              <div>
                <h3>已知售价，算毛利率</h3>
                <p>看看现在的价格到底赚多少</p>
              </div>
            </div>
            <div className="two-fields">
              <NumberField label="产品成本" value={productCost} onChange={setProductCost} />
              <NumberField label="实际售价" value={sellingPrice} onChange={setSellingPrice} />
            </div>
            <div className="inline-answer">
              <div>
                <span>实际毛利率</span>
                <strong>{actualMargin.toFixed(2)}%</strong>
              </div>
              <div>
                <span>单件毛利</span>
                <strong>{money(profitPerItem, 2)}</strong>
              </div>
            </div>
            <p className="formula">
              ({sellingPrice} − {productCost}) ÷ {sellingPrice} × 100%
            </p>
          </article>

          <article className="tool-card featured">
            <div className="recommend">常用</div>
            <div className="tool-title">
              <span className="tool-icon">价</span>
              <div>
                <h3>保证毛利率，反推售价</h3>
                <p>输入目标毛利率，得到正确报价</p>
              </div>
            </div>
            <div className="two-fields">
              <NumberField label="产品成本" value={productCost} onChange={setProductCost} />
              <NumberField
                label="目标毛利率"
                value={targetMargin}
                onChange={setTargetMargin}
                suffix="%"
                min={0}
                max={99.99}
              />
            </div>
            <div className="price-answer">
              <span>建议最低售价</span>
              <strong>{money(suggestedPrice, 2)}</strong>
              <button onClick={() => {
                setSellingPrice(Number(suggestedPrice.toFixed(2)));
                notify("已应用为实际售价");
              }}>应用此售价</button>
            </div>
            <p className="formula">
              {productCost} ÷ (1 − {targetMargin}%) = {suggestedPrice.toFixed(2)}
            </p>
          </article>
        </div>

        <details className="advanced">
          <summary>进一步计算净利率（含销售费用与税率）</summary>
          <div className="advanced-body">
            <NumberField label="每件销售费用" value={salesExpense} onChange={setSalesExpense} />
            <NumberField label="税率" value={taxRate} onChange={setTaxRate} suffix="%" max={100} />
            <div className="net-result">
              <span>预估净利率</span>
              <strong>{netMargin.toFixed(2)}%</strong>
            </div>
          </div>
          <p>计算口径：（售价 − 成本 − 销售费用 ×（1 − 税率））÷ 售价</p>
        </details>
      </section>

      <section className="formula-section" id="formula">
        <div>
          <span className="eyebrow">核心公式</span>
          <h2>四条公式，开店不再心里没底</h2>
        </div>
        <div className="formula-cards">
          <article><b>01</b><span>毛利率</span><strong>（售价 − 成本）÷ 售价</strong></article>
          <article><b>02</b><span>正确报价</span><strong>成本 ÷（1 − 毛利率）</strong></article>
          <article><b>03</b><span>保本营业额</span><strong>固定成本 ÷ 毛利率</strong></article>
          <article><b>04</b><span>目标营业额</span><strong>（固定成本 + 目标利润）÷ 毛利率</strong></article>
        </div>
        <div className="example-note">
          <span>!</span>
          <p>
            <strong>常见误区：</strong>成本 100 元、售价 130 元，毛利率不是 30%，
            而是（130 − 100）÷ 130 = <b>23.08%</b>。
          </p>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">算</span><span>开店账本</span></div>
        <p>每一个好生意，都从算清楚开始。</p>
        <span>测算结果仅供经营参考</span>
      </footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
