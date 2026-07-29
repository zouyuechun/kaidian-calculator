import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "开店账本｜实体店盈亏平衡与定价计算器",
  description: "算清保本营业额、目标利润营业额和商品正确售价，让开店经营心里有数。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "开店账本｜把账算明白，生意才有数",
    description: "实体店盈亏平衡、目标营业额与商品定价计算器",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "开店账本" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "开店账本｜把账算明白，生意才有数",
    description: "实体店盈亏平衡、目标营业额与商品定价计算器",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
