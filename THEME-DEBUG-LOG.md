# 🕳️ 踩坑指南 — Frost Blue Glass / Frost Canvas 主题改造全记录

> 记录主题插件开发中踩过的所有坑，供后续插件复用。

## 第一部分：动态插件阶段（v1–v5）

### 坑 1（最大坑）：styles.insert 是闭包符号，不是 ctx 服务！

- 症状：注入全套 CSS 后界面毫无变化
- 根因：动态插件浏览器半区通过 new Function 注入符号，styles/React/host 是闭包变量，不是 ctx 服务
- 解法：直接使用 styles 符号，不要 ctx.get('styles')

### 坑 2：Host 半区必须 return 插件对象

- 空字符串会报 host-half-failed

### 坑 3：主题有两套变量体系

- --dsw-alias-* 13 个白名单 token 可 overrideTokens
- --dsw-specific-* 组件专用变量只能 CSS 注入覆盖

### 坑 4：注入的 CSS 必须带 !important

### 坑 5：Client 侧 inspect 查询会挂起

- 别依赖它，直接读 node_modules 源码

### 坑 6：输入框 textarea 自身是透明的

- 背景在父卡片 .uV2eYG_card 上

### 坑 7：动态插件版本与运行机制

- Package 不可变、update 切换、停止即回退

## 第二部分：正式插件阶段（frost-canvas）

### 坑 8：宿主 apply(ctx, config) 签名

- 配置是第二参数，不能读 ctx.config

### 坑 9：宿主用 ctx.settings 必须 inject 'settings'

### 坑 10（致命）：客户端 inject 不存在的服务 → boot 失败 → UI 打不开

### 坑 11：客户端读不到 ctx.config

- 用 localStorage + 默认值

### 坑 12：正式插件 client 是 __ModuleLoader__.load 格式

- 可直接操作 document，不需要 styles 闭包

### 坑 13：改完要同步三处

- 源码 + 已装副本 + tarball

### 坑 14：安装本地插件用 file: + 绝对路径

## 排查工具

- dsh --profile web --dump-config
- node <dsh bin.js> web
- assertEntriesActive（boot 判定）
