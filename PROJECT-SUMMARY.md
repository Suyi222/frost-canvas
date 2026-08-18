# 项目总结 — Frost Canvas（试水插件全流程复盘）

本文是「Frost Canvas 深蓝磨砂玻璃主题」从零到正式插件的完整开发记录。
目的：作为后续插件开发的流程样板。

## 一、需求

1. 磨砂玻璃质感（半透明面板 + 背景模糊）
2. 深蓝极客配色（最终成为默认主题）
3. 画布式自定义：渐变底色、配色方案
4. 玻璃材质库：磨砂/半透/高光/冰晶/哑光/液态/雨雾
5. 持久化：安装后重启自动生效

## 二、技术选型与演进历程

### 阶段 1：会话内动态插件（v1–v5）

| 版本 | 做法 | 结果 |
|------|------|------|
| v1 | 只覆盖 13 个 alias token | 背景变深蓝，但输入框/气泡仍白 |
| v2 | 追加 body 渐变 CSS | 同上 |
| v3 | 用 ctx.get('styles') 注入 | ❌ 白屏 |
| v4 | 加 !important | ❌ 仍白 |
| v5 | 直接用闭包 styles 符号 | ✅ 成功 |

动态插件痛点：进程重启即消失。

### 阶段 2：正式插件（frost-canvas 0.1.0）

参照 dsh-better-sidebar、dsh-mnemon 结构做成标准 profile 插件。

### 阶段 3：事故与修复（Copilot 介入）

第一次正式安装后 UI 打不开（HARNESS 错误屏），Copilot 查出 3 个致命 bug：
1. Host apply 用 ctx.config → 应读第二参 config
2. Host inject 缺 'settings'
3. Client inject 了不存在的 'settings' 服务 → 永远 pending → boot 失败

### 阶段 4：功能增强

- 新增 4 套配色卡，共 9 套预设
- 新增 2 种玻璃材质（液态/雨雾），共 7 种
- 玻璃透明度滑条 + 模糊强度滑条
- 自定义方案保存/应用/删除

## 三、踩坑点速查（完整版见 THEME-DEBUG-LOG.md，共 14 坑）

| 阶段 | 坑 | 一句话教训 |
|------|-----|-----------|
| 动态插件 | styles 是闭包符号 | 直接调用，绝不 ctx.get('styles') |
| 动态插件 | Host 半区返回 undefined | 空逻辑也要 return { apply(ctx) {} } |
| 主题 | 两套变量体系 | alias 走 overrideTokens，specific 必须 CSS 注入 |
| 主题 | CSS 优先级 | 注入必须 !important |
| 正式插件 | apply(ctx, config) | 配置是第二参，不读 ctx.config |
| 正式插件 | 客户端 inject | 只 inject 真实存在的客户端服务，否则 boot 失败 |
| 正式插件 | 同步三处 | 源码 + 已装副本 + tarball 都要更新 |

## 四、经验价值

1. 完整走通插件生命周期：动态 → 正式 → 事故 → 修复 → 增强 → 发布
2. 理解 DSH 两套插件体系：内存动态插件 vs 持久化 profile 插件
3. 摸清主题系统：alias/specific 变量、__ModuleLoader__ client 格式、dsh.plugin 安装协议
4. Copilot 协作模式：AI 检查致命 bug 比人肉快得多

## 五、后续插件开发流程（沉淀为模板）

每个新插件完成后：
1. 本地日志：PLUGIN-LOG.md（需求/目的/踩坑/流程）
2. 简介文档：README.md
3. GitHub 仓库：建仓推送代码备份
4. 踩坑指南：合并新坑进 THEME-DEBUG-LOG.md
