# 🎨 Frost Canvas — 画布式主题引擎

> DeepSeek Harness 正式插件：自定义渐变底色 + 多种玻璃材质 + 预设配色卡。

![version](https://img.shields.io/badge/version-0.1.0-5b5bd6) ![license](https://img.shields.io/badge/license-MIT-172033)

Frost Canvas 是一个 DeepSeek Harness 主题插件，把界面变成「画布」：

- 🎨 **9 套配色预设**：深海极客（默认）+ 8 套精选配色卡
- 🪟 **7 种玻璃材质**：磨砂 / 半透 / 高光 / 冰晶 / 哑光 / 液态 / 雨雾
- ✏️ **完全自定义**：任意渐变底色（线性/径向/纯色）+ 角度 + 强调色
- 🎚️ **玻璃滑条**：透明度 + 模糊强度实时调节
- 💾 **自定义方案**：保存你的配色方案，随时一键切换
- 🔄 **持久生效**：正式安装，重启自动加载（localStorage 保存）

## 配色预设

| id | 名称 | 色卡 |
|---|---|---|
| `deep-blue` | 深海极客（默认） | #0d1530 #070c1c |
| `sprout` | 青芽绿意 | #DFF8D3 #A8E48C #B8CDB8 #8FA88A |
| `peach` | 绯桃冻露 | #d99797 #d9ecf6 #f1bfbc #e37e7e |
| `lemon` | 柠叶碎冰 | #cafcc3 #ffffdd #d9f3f0 #feffbc |
| `tea` | 雾水青茶 | #eaf4cc #d9ea9f #abc89b #c2d5b4 |
| `orange` | 橙子奶霜 | #B8E0E2 #FAE39E #FAC356 #FC9F6C |
| `caramel` | 海盐焦糖 | #A1CCD1 #F4F2DE #E9B384 #7C9D96 |
| `fog` | 旧信朝雾 | #66788E #B1BCC9 #F8F7F3 #524331 |
| `snow` | 雪覆长川 | #d0e6ee #ecf6f8 #c1e9ed #a6ccdd |

## 玻璃材质

| id | 名称 | 模糊 | 饱和度 | 默认透明度 |
|---|---|---|---|---|
| `frosted` | 磨砂玻璃 | 24px | 160% | 0.55 |
| `translucent` | 半透明 | 8px | 140% | 0.28 |
| `glossy` | 高光玻璃 | 16px | 180% | 0.40 |
| `ice` | 冰晶质感 | 12px | 200% | 0.50 |
| `matte` | 哑光雾面 | 28px | 120% | 0.62 |
| `liquid` | 液态玻璃 | 6px | 220% | 0.35 |
| `rainy` | 雨雾玻璃 | 30px | 130% | 0.70 |

每种材质的透明度和模糊强度都可通过**画布滑条**自由调节。

## 安装

```sh
# 本地开发安装
dsh plugin --profile web add "file:C:/path/to/frost-canvas-0.1.0.tgz"

# 重启生效
dsh --profile web
```

## 使用

1. 打开 **设置 → Frost Canvas 画布**
2. 点击配色卡切换预设，或自定义渐变底色
3. 选择玻璃材质，用滑条调透明度/模糊
4. 「保存当前方案」收藏你的搭配

所有改动实时生效并持久保存。

## 架构

```
package/
├── package.json          # dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml      # 挂载配置（默认 preset/glass）
└── lib/
    ├── index.js          # Host：配置 schema + 预设/玻璃库
    ├── client.js         # Client：主题引擎 + 画布设置页
    └── types/            # 类型声明
```

- **Host 半区**：`ctx.settings.register` 注册配置 schema
- **Client 半区**：`ctx.slots.inject('settings.section')` 注册设置页；直接操作 `document` 注入主题 CSS

## 文档

- [PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md) — 项目总结（需求/历程/经验）
- [THEME-DEBUG-LOG.md](./THEME-DEBUG-LOG.md) — 踩坑指南（14 坑：动态+正式插件两阶段）
- [PLUGIN-DEV-TEMPLATE.md](./PLUGIN-DEV-TEMPLATE.md) — 插件开发流程模板

## 许可证

MIT