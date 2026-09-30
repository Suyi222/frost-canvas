# 🎨 Frost Canvas — 画布式主题引擎

> DeepSeek Harness 正式插件：自定义渐变底色 + 玻璃材质 + 预设配色卡。
> 安装后重启自动生效（与 dsh-better-sidebar 等正式插件一致）。

## 功能

- **画布式设置页**：设置 → Frost Canvas 画布
- **9 套配色预设**：深海极客（默认）/ 青芽绿意 / 绯桃冻露 / 柠叶碎冰 / 雾水青茶 / 橙子奶霜 / 海盐焦糖 / 旧信朝雾 / 雪覆长川
- **7 种玻璃材质**：磨砂 / 半透明 / 高光 / 冰晶 / 哑光 / 液态玻璃 / 雨雾玻璃
- **自定义模式**：任意渐变色（线性/径向/纯色）+ 角度 + 强调色
- **实时生效 + 本地持久化**（localStorage），重启保留

## 0.2.0 新特性（DSH 0.2 桌面端适配）

- **覆盖 DSH 0.2 新增的 45 个设计 token**：圆角体系、焦点环、菜单玻璃、设置卡片、引导页、文档预览、文件 diff、shimmer、状态与杂项 —— 全部按当前预设/材质/强调色**自动推导**，9 套配色通吃，无需逐套手调。
- **菜单玻璃**：接管 `--dsw-menu-surface-fill` / `--dsw-menu-backdrop-filter`，0.2 把菜单换成玻璃表面后，frost-canvas 的材质第一次真正作用到菜单上。
- **圆角 ↔ 材质联动**：哑光/雨雾越「厚」圆角越大，冰晶/液态越「薄」越利落（4/8/12/16/20/28px × 材质系数）。
- **噪点颗粒**（新滑条 0–100%）：feTurbulence 一层薄颗粒，磨砂玻璃从「糊」变「贵」。
- **玻璃边缘高光**（新滑条 0–100%）：1px 内亮边 + 内阴影，做出厚度截面感；液态/雨雾自带高光，不会被覆盖。
- **跟随系统深浅色**（新开关）：读 `prefers-color-scheme` 覆盖亮度推断。
- **兼容性修复**：补 `dependencies.schemastery`；`ctx.settings.register` 加 typeof 守卫（0.2 已移除该 API）；peer 范围扩展到 `>=0.2.0-rc.1 <0.3.0-0`。

> 说明：`--dsw-font-family-brand` 故意不接管 —— 那是 DSH 的品牌字体，留给 0.3.0 排版专题。

## 配色预设

| id | 名称 | 色卡 |
| --- | --- | --- |
| `sprout` | 青芽绿意 | #DFF8D3 #A8E48C #B8CDB8 #8FA88A |
| `peach` | 绯桃冻露 | #d99797 #d9ecf6 #f1bfbc #e37e7e |
| `lemon` | 柠叶碎冰 | #cafcc3 #ffffdd #d9f3f0 #feffbc |
| `tea` | 雾水青茶 | #eaf4cc #d9ea9f #abc89b #c2d5b4 |
| `deep-blue` | 深海极客（默认） | #0d1530 #070c1c |

## 玻璃材质

| id | 名称 | 模糊 | 饱和度 | 面板 alpha |
| --- | --- | --- | --- | --- |
| `frosted` | 磨砂玻璃 | 24px | 160% | 0.55 |
| `translucent` | 半透明 | 8px | 140% | 0.28 |
| `glossy` | 高光玻璃 | 16px | 180% | 0.40 |
| `ice` | 冰晶质感 | 12px | 200% | 0.50 |
| `matte` | 哑光雾面 | 28px | 120% | 0.62 |

## 安装

```sh
# 本地开发安装
dsh plugin --profile web add "link:C:/Users/ASUS/dsh workspace/frost-blue-glass/package"
# 或打包安装
cd "C:/Users/ASUS/dsh workspace/frost-blue-glass/package" && npm pack
dsh plugin --profile web add "file:C:/Users/ASUS/dsh workspace/frost-blue-glass/frost-canvas-0.2.0.tgz"

# 重启生效
dsh --profile web
```

## 架构

```
package/
├── package.json          # dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml      # 挂载配置（默认 preset/glass）
└── lib/
    ├── index.js          # Host：配置 schema（schemastery）+ 预设/玻璃库
    ├── client.js         # Client：主题引擎 + 画布设置页（__ModuleLoader__ 格式）
    └── types/            # 类型声明
```

- **Host 半区**：0.1.x 走 `ctx.settings.register('frost-canvas', Config, {base, applies:'live'})`；DSH 0.2 起该 API 已移除，改用 `typeof` 守卫跳过（主题由客户端 localStorage 驱动，不影响功能）
- **Client 半区**：`ctx.slots.inject('settings.section', ...)` 注册设置页；`document.createElement('style')` 注入主题 CSS（正式插件直接操作 DOM，无需动态插件的 styles 闭包）
