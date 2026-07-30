# 开店成本计算器

用于计算实体店月固定成本、保本营业额、目标营业额、商品毛利率、目标售价和净利率。项目目前包含网页版和微信小程序版，并以同一套公式源码保证计算口径一致。

## 当前使用形态

- 电脑本地预览：开发和修改网页。
- [GitHub Pages 公开版](https://zouyuechun.github.io/kaidian-calculator/)：手机或电脑浏览器免登录使用。
- [Gitee 代码镜像](https://gitee.com/zou-yuechun/kaidian-calculator)：公开保存代码，不是在线使用地址。
- 微信小程序：使用微信开发者工具导入、预览和上传。
- Android APK：后续开发计划，当前尚未生成安装包。

## 环境要求

- Node.js `>=22.13.0`
- 微信开发者工具（运行和预览小程序时需要）

首次下载代码后安装依赖：

```bash
npm install
```

## 网页开发

```bash
npm run dev
```

然后在浏览器访问终端显示的本地地址。常用验证命令：

```bash
npm run build
npm run build:pages
```

## 微信小程序导入与预览

项目根目录的 `project.config.json` 已经配置正式 AppID 和 `miniprogram/` 源码目录，不需要再次新建小程序项目。

1. 打开微信开发者工具并使用微信扫码登录。
2. 点击“导入项目”。
3. “项目目录”选择本仓库根目录，也就是包含 `project.config.json` 的“开实体店计算器”文件夹；不要只选择 `miniprogram/` 子目录。
4. 确认项目名称为“开店成本计算器”，AppID 已自动带出。
5. 点击“导入”，进入后点击工具栏的“编译”。
6. 需要在真机测试时点击“预览”，用有权限的微信扫码打开；也可以使用“真机调试”检查输入和本地数据保存。

如果开发者工具提示没有权限，请确认当前登录微信已经被添加为该小程序的管理员或项目成员，并确认工具中显示的 AppID 与微信公众平台中的小程序一致。

## 网页和小程序共享公式

公式唯一源码位于：

```text
shared/calculations.ts
```

网页会直接引用该源码；微信小程序使用由 TypeScript 生成的 CommonJS 文件：

```text
miniprogram/utils/calculations.js
```

每次修改公式后必须依次运行：

```bash
npm run build:miniapp-shared
npm run test:calculations
```

不要直接手工修改 `miniprogram/utils/calculations.js`，否则下一次生成时会被覆盖。公式测试包含毛利率、目标售价、保本营业额、目标营业额、净利率和边界值。

## 安全要求

- AppID 是公开项目标识，可以保存在 `project.config.json` 中。
- 严禁把 AppSecret、API 密钥、上传私钥、私人令牌、账号密码或证书私钥提交到 GitHub、Gitee 或任何公开仓库。
- AppSecret 和私钥不得写入网页或小程序前端代码；需要调用敏感接口时，应保存在可信服务器或部署平台的加密环境变量中。
- 如果秘密信息曾被误提交，应立即到对应平台撤销或重置，不能只删除最新文件，因为旧 Git 历史仍可能保留内容。

## 常用命令

- `npm run dev`：启动网页本地开发。
- `npm run build`：验证网页构建。
- `npm run build:pages`：生成 GitHub Pages 静态文件。
- `npm run build:miniapp-shared`：把共享公式生成到微信小程序目录。
- `npm run test:calculations`：独立运行公式边界测试。
- `npm test`：运行项目总测试。
- `npm run lint`：运行静态检查。
