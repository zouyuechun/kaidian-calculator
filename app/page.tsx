"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateBusinessSummary,
  calculatePricingSummary,
} from "@/shared/calculations";

type CostItem = { id: number; name: string; amount: number };
type AppTab = "home" | "costs" | "pricing" | "formula";
type PricingMode = "margin" | "quote";

const tabFromHash = (hash: string): AppTab => {
  if (hash === "#costs" || hash === "#calculator") return "costs";
  if (hash === "#pricing") return "pricing";
  if (hash === "#formula") return "formula";
  return "home";
};

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
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span>{suffix}</span>
      </span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [pricingMode, setPricingMode] = useState<PricingMode>("margin");
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
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (Array.isArray(data.costs)) setCosts(data.costs);
        if (Number.isFinite(data.grossMargin)) setGrossMargin(data.grossMargin);
        if (Number.isFinite(data.days)) setDays(data.days);
        if (Number.isFinite(data.targetProfit)) setTargetProfit(data.targetProfit);
        if (Number.isFinite(data.productCost)) setProductCost(data.productCost);
        if (Number.isFinite(data.sellingPrice)) setSellingPrice(data.sellingPrice);
        if (Number.isFinite(data.targetMargin)) setTargetMargin(data.targetMargin);
        if (Number.isFinite(data.salesExpense)) setSalesExpense(data.salesExpense);
        if (Number.isFinite(data.taxRate)) setTaxRate(data.taxRate);
      } catch {
        // Invalid local data should not prevent the calculator from opening.
      }
    }
    setLoaded(true);
    const syncTab = () => setActiveTab(tabFromHash(window.location.hash));
    syncTab();
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      "kaidian-calculator",
      JSON.stringify({
        costs,
        grossMargin,
        days,
        targetProfit,
        productCost,
        sellingPrice,
        targetMargin,
        salesExpense,
        taxRate,
      }),
    );
  }, [costs, grossMargin, days, targetProfit, productCost, sellingPrice, targetMargin, salesExpense, taxRate, loaded]);

  const {
    fixedCost,
    breakEven,
    dailyBreakEven,
    targetRevenue,
    dailyTarget,
    monthlyGoal,
    dailyGoal,
  } = useMemo(
    () => calculateBusinessSummary({ costs, grossMargin, days, targetProfit }),
    [costs, grossMargin, days, targetProfit],
  );
  const { actualMargin, suggestedPrice, profitPerItem, netMargin } = useMemo(
    () =>
      calculatePricingSummary({
        productCost,
        sellingPrice,
        targetMargin,
        salesExpense,
        taxRate,
      }),
    [productCost, sellingPrice, targetMargin, salesExpense, taxRate],
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const goTo = (tab: AppTab) => {
    setActiveTab(tab);
    window.history.pushState(null, "", tab === "home" ? "#home" : `#${tab}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateCost = (id: number, patch: Partial<CostItem>) =>
    setCosts((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const copySummary = async () => {
    const summary = `开店测算结果
月固定成本：${money(fixedCost)}
综合毛利率：${grossMargin}%
月保本营业额：${money(breakEven)}
日保本营业额：${money(dailyBreakEven)}
月目标利润：${money(targetProfit)}
月目标营业额：${money(targetRevenue)}
日目标营业额：${money(dailyTarget)}`;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(summary);
      notify("测算结果已复制");
    } catch {
      const area = document.createElement("textarea");
      area.value = summary;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      notify("测算结果已复制");
    }
  };

  return (
    <main className="mobile-app">
      <header className="app-header">
        <button className="brand" onClick={() => goTo("home")} aria-label="返回经营总览">
          <span className="brand-mark">算</span>
          <span>开店成本计算器</span>
        </button>
        <span className="save-state"><i /> 数据已保存</span>
      </header>

      <div className="app-content">
        {activeTab === "home" && (
          <section className="app-screen" aria-label="经营总览">
            <div className="screen-intro home-intro">
              <div>
                <span className="screen-kicker">经营总览</span>
                <h1>今天的账，算清楚了吗？</h1>
              </div>
              <span className="day-chip">按 {days} 天</span>
            </div>

            <article className="goal-card">
              <div className="goal-card-head">
                <span>{targetProfit > 0 ? "今日销售任务" : "今日保本线"}</span>
                <b><i /> 实时</b>
              </div>
              <strong>{compactMoney(dailyGoal)}</strong>
              <p>{compactMoney(monthlyGoal)} ÷ {days} 个营业日</p>
              <div className="goal-divider" />
              <div className="goal-meta">
                <span>月固定成本 <b>{compactMoney(fixedCost)}</b></span>
                <span>月保本营业额 <b>{compactMoney(breakEven)}</b></span>
                <span>月目标营业额 <b>{compactMoney(monthlyGoal)}</b></span>
                <span>月目标净利润 <b>{compactMoney(targetProfit)}</b></span>
              </div>
            </article>

            <article className="app-card parameter-card">
              <div className="card-heading">
                <div><span>经营参数</span><small>修改后立即重新计算</small></div>
                <span className="live-dot">LIVE</span>
              </div>
              <div className="home-fields">
                <NumberField
                  label="综合毛利率"
                  value={grossMargin}
                  onChange={setGrossMargin}
                  suffix="%"
                  min={0.01}
                  max={99.99}
                />
                <NumberField
                  label="营业天数"
                  value={days}
                  onChange={setDays}
                  suffix="天"
                  min={1}
                  max={31}
                />
                <NumberField
                  label="每月想净赚"
                  value={targetProfit}
                  onChange={setTargetProfit}
                  suffix="元"
                  min={0}
                />
              </div>
            </article>

            <div className="quick-grid" aria-label="快捷入口">
              <button onClick={() => goTo("costs")}>
                <span className="quick-icon">¥</span>
                <span><b>固定成本</b><small>共 {costs.length} 项</small></span>
                <i>›</i>
              </button>
              <button onClick={() => goTo("pricing")}>
                <span className="quick-icon orange">%</span>
                <span><b>商品定价</b><small>反推正确售价</small></span>
                <i>›</i>
              </button>
            </div>

            <button className="primary-action" onClick={copySummary}>复制完整测算结果</button>
            <p className="safe-note">测算仅供经营参考 · 数据只保存在当前设备</p>
          </section>
        )}

        {activeTab === "costs" && (
          <section className="app-screen" aria-label="固定成本">
            <div className="screen-intro">
              <span className="screen-kicker">成本管理</span>
              <h1>每月固定成本</h1>
              <p>不管有没有生意，每个月都要支付的钱</p>
            </div>

            <article className="total-banner">
              <span>当前合计</span>
              <strong>{money(fixedCost)}</strong>
              <small>保本营业额 {compactMoney(breakEven)} / 月</small>
            </article>

            <article className="app-card cost-card">
              <div className="card-heading">
                <div><span>支出明细</span><small>{costs.length} 项固定支出</small></div>
              </div>
              <div className="cost-list">
                {costs.map((item) => (
                  <div className="cost-row" key={item.id}>
                    <span className="cost-dot">¥</span>
                    <div className="cost-edit">
                      <input
                        className="cost-name"
                        aria-label="成本名称"
                        value={item.name}
                        onChange={(event) => updateCost(item.id, { name: event.target.value })}
                      />
                      <span className="cost-amount">
                        <span>¥</span>
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          aria-label={`${item.name}金额`}
                          value={item.amount}
                          onChange={(event) => updateCost(item.id, { amount: Number(event.target.value) })}
                        />
                      </span>
                    </div>
                    <button
                      className="remove"
                      aria-label={`删除${item.name}`}
                      onClick={() => setCosts((items) => items.filter((entry) => entry.id !== item.id))}
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
                ＋ 添加固定成本
              </button>
            </article>

            <article className="tip-card">
              <span>小提示</span>
              <p>别忘了把装修折旧、设备折旧、软件费和证照年费换算成每月成本。</p>
            </article>
          </section>
        )}

        {activeTab === "pricing" && (
          <section className="app-screen" aria-label="商品定价">
            <div className="screen-intro">
              <span className="screen-kicker">商品定价</span>
              <h1>每件商品，都要赚得明白</h1>
              <p>毛利率永远以售价为分母</p>
            </div>

            <div className="segmented" role="tablist" aria-label="定价计算方式">
              <button
                role="tab"
                aria-selected={pricingMode === "margin"}
                className={pricingMode === "margin" ? "active" : ""}
                onClick={() => setPricingMode("margin")}
              >
                计算毛利率
              </button>
              <button
                role="tab"
                aria-selected={pricingMode === "quote"}
                className={pricingMode === "quote" ? "active" : ""}
                onClick={() => setPricingMode("quote")}
              >
                反推售价
              </button>
            </div>

            {pricingMode === "quote" ? (
              <article className="app-card pricing-card">
                <div className="card-heading">
                  <div><span>保证毛利率，反推售价</span><small>输入成本和目标毛利率</small></div>
                  <span className="recommended">常用</span>
                </div>
                <div className="pricing-fields">
                  <NumberField label="产品成本" value={productCost} onChange={setProductCost} />
                  <NumberField
                    label="目标毛利率"
                    value={targetMargin}
                    onChange={setTargetMargin}
                    suffix="%"
                    max={99.99}
                  />
                </div>
                <div className="quote-result">
                  <span>建议最低售价</span>
                  <strong>{money(suggestedPrice, 2)}</strong>
                  <small>{productCost} ÷（1 − {targetMargin}%）</small>
                </div>
                <button
                  className="primary-action"
                  onClick={() => {
                    setSellingPrice(Number(suggestedPrice.toFixed(2)));
                    setPricingMode("margin");
                    notify("已应用为实际售价");
                  }}
                >
                  应用这个售价
                </button>
              </article>
            ) : (
              <article className="app-card pricing-card">
                <div className="card-heading">
                  <div><span>已知售价，算毛利率</span><small>看看现在的价格赚多少</small></div>
                </div>
                <div className="pricing-fields">
                  <NumberField label="产品成本" value={productCost} onChange={setProductCost} />
                  <NumberField label="实际售价" value={sellingPrice} onChange={setSellingPrice} />
                </div>
                <div className="margin-result">
                  <div><span>实际毛利率</span><strong>{actualMargin.toFixed(2)}%</strong></div>
                  <div><span>单件毛利</span><strong>{money(profitPerItem, 2)}</strong></div>
                </div>
                <p className="inline-formula">（{sellingPrice} − {productCost}）÷ {sellingPrice} × 100%</p>
              </article>
            )}

            <details className="app-card advanced">
              <summary>进一步计算净利率</summary>
              <div className="advanced-body">
                <NumberField label="每件销售费用" value={salesExpense} onChange={setSalesExpense} />
                <NumberField label="税率" value={taxRate} onChange={setTaxRate} suffix="%" max={100} />
              </div>
              <div className="net-result"><span>预估净利率</span><strong>{netMargin.toFixed(2)}%</strong></div>
              <p>（售价 − 成本 − 销售费用 ×（1 − 税率））÷ 售价</p>
            </details>

            <article className="warning-card">
              <span>别算错</span>
              <p>成本 100 元、售价 130 元，毛利率不是 30%，而是 <b>23.08%</b>。</p>
            </article>
          </section>
        )}

        {activeTab === "formula" && (
          <section className="app-screen" aria-label="公式说明">
            <div className="screen-intro">
              <span className="screen-kicker">公式速查</span>
              <h1>四条公式，开店心里有底</h1>
              <p>点击其他底部菜单即可返回测算</p>
            </div>

            <div className="formula-list">
              <article>
                <span className="formula-number">01</span>
                <div><small>毛利率</small><strong>（售价 − 成本）÷ 售价</strong><p>看一件商品真实能留下多少毛利</p></div>
              </article>
              <article>
                <span className="formula-number">02</span>
                <div><small>正确报价</small><strong>成本 ÷（1 − 毛利率）</strong><p>根据目标毛利率反推最低售价</p></div>
              </article>
              <article>
                <span className="formula-number">03</span>
                <div><small>保本营业额</small><strong>固定成本 ÷ 毛利率</strong><p>营业额做到这里，店铺刚好不亏</p></div>
              </article>
              <article>
                <span className="formula-number">04</span>
                <div><small>目标营业额</small><strong>（固定成本 + 目标利润）÷ 毛利率</strong><p>想赚到目标利润，需要完成的业绩</p></div>
              </article>
            </div>

            <article className="example-card">
              <span>示例</span>
              <strong>固定成本 35 万 · 毛利率 33%</strong>
              <div><b>月保本</b><em>¥106.06万</em></div>
              <div><b>日保本（30天）</b><em>¥3.54万</em></div>
            </article>

            <p className="safe-note">所有计算结果保留完整精度，界面金额仅作四舍五入显示</p>
          </section>
        )}
      </div>

      <nav className="bottom-nav" aria-label="主导航">
        <button className={activeTab === "home" ? "active" : ""} aria-current={activeTab === "home" ? "page" : undefined} onClick={() => goTo("home")}>
          <span className="nav-icon">⌂</span><span>首页</span>
        </button>
        <button className={activeTab === "costs" ? "active" : ""} aria-current={activeTab === "costs" ? "page" : undefined} onClick={() => goTo("costs")}>
          <span className="nav-icon">¥</span><span>成本</span>
        </button>
        <button className={activeTab === "pricing" ? "active" : ""} aria-current={activeTab === "pricing" ? "page" : undefined} onClick={() => goTo("pricing")}>
          <span className="nav-icon">%</span><span>定价</span>
        </button>
        <button className={activeTab === "formula" ? "active" : ""} aria-current={activeTab === "formula" ? "page" : undefined} onClick={() => goTo("formula")}>
          <span className="nav-icon fx">ƒ</span><span>公式</span>
        </button>
      </nav>

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
