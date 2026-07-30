import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the shop calculator", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>开店成本计算器｜实体店盈亏平衡与定价计算器<\/title>/);
  assert.match(html, /开店成本计算器/);
  assert.match(html, /月固定成本/);
  assert.match(html, /月保本营业额/);
  assert.match(html, /月目标营业额/);
  assert.match(html, /月目标净利润/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|codex-preview/);
});

test("keeps web and mini program calculations on the shared formula layer", async () => {
  const [page, miniProgramPage, projectConfig, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../miniprogram/pages/index/index.js", import.meta.url), "utf8"),
    readFile(new URL("../project.config.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /from "@\/shared\/calculations"/);
  assert.match(page, /calculateBusinessSummary/);
  assert.match(page, /calculatePricingSummary/);
  assert.match(page, /计算毛利率/);
  assert.match(page, /反推售价/);
  assert.ok(page.indexOf("计算毛利率") < page.indexOf("反推售价"));
  assert.match(
    miniProgramPage,
    /require\(["']\.\.\/\.\.\/utils\/calculations\.js["']\)/,
  );

  const config = JSON.parse(projectConfig);
  assert.equal(config.appid, "wxa222bb3ceb5d58eb");
  assert.equal(config.miniprogramRoot, "miniprogram/");

  const pkg = JSON.parse(packageJson);
  assert.equal(pkg.scripts["build:miniapp-shared"], "tsc -p tsconfig.miniprogram.json");
  assert.match(pkg.scripts.test, /test:calculations/);
  assert.doesNotMatch(
    `${page}\n${miniProgramPage}\n${projectConfig}`,
    /AppSecret|private[_-]?key|upload[_-]?key/i,
  );
});
