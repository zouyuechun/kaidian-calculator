import type { Metadata } from "next";
import "./globals.css";

const publicAssetBasePath =
  process.env.GITHUB_PAGES === "true" ? "/kaidian-calculator" : "";
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const recoverFromStalePagesCache = `
(() => {
  const recoveryKey = "kaidian-pages-static-recovery";

  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      const isNextStaticScript =
        target &&
        target.tagName === "SCRIPT" &&
        typeof target.src === "string" &&
        target.src.includes("/_next/static/");

      if (!isNextStaticScript) return;

      const freshUrl = new URL(window.location.href);
      if (freshUrl.searchParams.has("pages-refresh")) return;

      try {
        if (sessionStorage.getItem(recoveryKey) === "refreshing") return;
        sessionStorage.setItem(recoveryKey, "refreshing");
      } catch {}

      freshUrl.searchParams.set("pages-refresh", Date.now().toString());
      window.location.replace(freshUrl.toString());
    },
    true,
  );

  window.addEventListener("load", () => {
    try {
      sessionStorage.removeItem(recoveryKey);
    } catch {}

    const cleanUrl = new URL(window.location.href);
    if (cleanUrl.searchParams.has("pages-refresh")) {
      cleanUrl.searchParams.delete("pages-refresh");
      window.history.replaceState(
        window.history.state,
        "",
        cleanUrl.pathname + cleanUrl.search + cleanUrl.hash,
      );
    }
  });
})();
`;

export const metadata: Metadata = {
  title: "开店成本计算器｜实体店盈亏平衡与定价计算器",
  description: "算清保本营业额、目标利润营业额和商品正确售价，让开店经营心里有数。",
  icons: {
    icon: `${publicAssetBasePath}/favicon.svg`,
    shortcut: `${publicAssetBasePath}/favicon.svg`,
  },
  openGraph: {
    title: "开店成本计算器｜把账算明白，生意才有数",
    description: "实体店盈亏平衡、目标营业额与商品定价计算器",
    type: "website",
    images: [
      {
        url: `${publicAssetBasePath}/og-mobile.png`,
        width: 1536,
        height: 1024,
        alt: "开店成本计算器手机应用",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "开店成本计算器｜把账算明白，生意才有数",
    description: "实体店盈亏平衡、目标营业额与商品定价计算器",
    images: [`${publicAssetBasePath}/og-mobile.png`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      {isGitHubPages && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: recoverFromStalePagesCache }} />
        </head>
      )}
      <body>{children}</body>
    </html>
  );
}
