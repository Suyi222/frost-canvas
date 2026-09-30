# Changelog

## 0.2.0 — 2026-09-30 · DSH 0.2 桌面端适配

### 兼容性修复
- **补 `dependencies.schemastery`（^3.18.0）**：Host 半区 `import 'schemastery'` 但 `dependencies` 为空。在既有 web profile 里能跑，只是因为该包恰好被别的插件提升到 `node_modules`；换到全新 profile（如桌面版 `profiles\desktop`）就解析不到，报 `1 entry did not activate frost-canvas (frost-canvas): failed to import`。
- **`ctx.settings.register` 加 `typeof` 守卫**：DSH 0.2 的 settings 服务已移除 `register()`（官方 62 个 client 包无一处再使用），旧写法在 0.2 上抛 `TypeError: ctx.settings.register is not a function` 并拖挂整个插件。守卫后 0.1.x 行为不变，0.2 上跳过注册。
- **peerDependencies 扩展到 0.2.x**：`@deepseek-ai/dsh-client-ui-primitives` 由 `^0.1.0-rc.6` 扩为 `^0.1.0-rc.6 || >=0.2.0-rc.1 <0.3.0-0`，在 DSH 0.2 上不再需要 `allow-version --accept-risk` 风险豁免。

### 新特性
- **覆盖 DSH 0.2 新增的 45 个设计 token**（按当前预设/材质/强调色自动推导，9 套配色通吃）：
  - 圆角体系 `--dsw-radius-xs/sm/md/lg/xl/panel`（与玻璃材质联动）
  - 焦点环 `--dsw-focus-ring-color/width`
  - 菜单/浮层 `--dsw-menu-surface-fill`、`--dsw-menu-backdrop-filter`、`--dsw-alias-menu-group-header-fill`、`--dsw-alias-menu-icon`
  - 设置卡片、引导页（含 3 条 onboarding 渐变 stop）
  - 文档预览 + 文件 diff（11 个）
  - shimmer / 深度思考标签（3 个）
  - 状态与杂项 `switch-thumb`、`toast-label`、`tooltip-key-bg`、`turn-trigger-bg(-hover)`、`state-idle-primary`、4 个静态色 alpha
- **菜单玻璃**：0.2 把菜单换成玻璃表面，frost-canvas 的材质第一次真正作用到菜单。
- **圆角 ↔ 材质联动**：磨砂 1.0 / 半透明 0.85 / 高光 0.8 / 冰晶 0.6 / 哑光 1.25 / 液态 0.55 / 雨雾 1.4。
- **噪点颗粒**（新滑条 0–100%）：feTurbulence 贴图 + 混合模式，磨砂玻璃从「糊」变「贵」。
- **玻璃边缘高光**（新滑条 0–100%）：1px 内亮边 + 内阴影；液态/雨雾自带更强高光，自动跳过不覆盖。
- **跟随系统深浅色**（新开关）：`prefers-color-scheme` 覆盖亮度推断。

### 说明
- `--dsw-font-family-brand` 故意不接管：那是 DSH 品牌字体，留给 0.3.0 排版专题。
- 0.2 是纯增量版本：实测 0.1.5 → 0.2.0 的设计 token **零删除**（357 个全保留，新增 46 个），client 包 47 → 62 零移除，布局插槽零移除（新增 3 个）。
