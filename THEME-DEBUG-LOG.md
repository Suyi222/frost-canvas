# 🕳️ 踩坑日志 — Frost Blue Glass 主题改造全记录

> 本日志记录本次「磨砂玻璃 + 深蓝主题」改造中踩过的每一个坑、根因分析、最终解法。
> **下次改 UI 前必读**，避免重复踩坑。

---

## 坑 1（最大坑）：`styles.insert` 是闭包符号，不是 ctx 服务！

**症状**：v3 / v4 注入全套 CSS 后界面毫无变化 —— 输入框、气泡始终是白的，只有背景变深（因为 theme 通道是对的）。

**排查过程**：
1. `cordis_inspect_query` 查 `Service.listService {service: "styles"}` → **每次挂起 8 分钟不返回**（此查询通道不可用，别再用）
2. 全包搜索 `insert(css` 只命中一处：`dsh-cordis-client-runner/lib/client.js`
3. 读该文件 `evaluateClientHalf` 函数 → **真相大白**

**根因**：动态插件的浏览器半区通过 `new Function(...parameters, code)` 注入符号，参数列表是：
```js
const parameters = ["React", "console", "styles", "host", "harness", ...]
```
即 `styles`、`React`、`host` 是**闭包里的直接变量**，不是 Cordis ctx 服务！
我写的 `const styles = ctx.get('styles')` 永远返回 `undefined`，于是 `if (styles !== undefined)` 把整个 CSS 注入逻辑跳过了。

**解法**：在插件代码里**直接使用 `styles` 符号**，不要 `ctx.get`：
```js
return {
  apply(ctx) {
    ctx.effect(() => {
      const d = styles.insert(css)   // ✅ 直接调用，styles 是注入的闭包变量
      return () => typeof d === 'function' && d()
    })
  },
}
```

**验证点**：`C:\Users\ASUS\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-cordis-client-runner\lib\client.js` → `evaluateClientHalf` 的 `parameters` 数组。

---

## 坑 2：Host 半区必须 `return` 插件对象

**症状**：`cordis_run` 报 `host-half-failed: the Host half returned undefined — did you forget return?`

**根因**：`code.host` 传了空字符串 `""`，运行器求值后得到 undefined。

**解法**：Host 半区即使无事可做，也要：
```js
return { apply(ctx) { /* noop */ } }
```

---

## 坑 3：主题有两套变量体系，overrideTokens 只覆盖其中一套

**症状**：覆盖 13 个 alias token 后背景变深蓝，但气泡、输入框、新建会话按钮等还是浅色。

**根因**：主题设计系统（`dsh-client-ui-theme/lib/styles/design-platform.css`）定义了两类变量：
- `--dsw-alias-*`：**13 个白名单 token**，可被 `theme.overrideTokens()` 覆盖（`Theme.listTokens` 查到的）
- `--dsw-specific-*`：**组件专用变量**（`--dsw-specific-bubble` 气泡、`--dsw-specific-input-major` 输入框、`--dsw-specific-menu` 菜单、`--dsw-specific-sidebar-*` 侧栏等），**不在 overrideTokens 白名单**，只能用 CSS 注入覆盖

具体对照（light 模式下的坑人取值）：
| 变量 | 组件 | light 默认值（坑） |
| --- | --- | --- |
| `--dsw-specific-bubble` | 用户消息气泡 | `rgb(237,243,254)` 浅蓝白 |
| `--dsw-specific-input-major` | 输入框卡片 | `rgb(255,255,255)` 纯白！ |
| `--dsw-specific-sidebar-fill` | 侧栏 | `rgb(249,250,251)` 近白 |
| `--dsw-alias-button-*` | 各类按钮 | 白/黑硬编码 |

**解法**：13 个 alias token 走 `theme.overrideTokens()`（可靠通道）；其余全部在 `styles.insert()` 的 CSS 里用 `!important` 覆盖。

---

## 坑 4：注入的 CSS 必须带 `!important`

**症状**：CSS 明明执行了，但某些规则不生效（v3 时）。

**根因**：组件自身的 CSS Modules 样式（如 `.uV2eYG_card{background:var(--dsw-specific-input-major)}`）与我的注入样式优先级相同或更高；CSS 变量定义在 `body` 上，我的 `body { --x: v }` 与主题自带 `body { --x: w }` 同特异性，谁后加载谁赢 —— 不可控。

**解法**：所有覆盖变量一律加 `!important`：
```css
body {
  --dsw-specific-input-major: rgba(22, 32, 62, 0.78) !important;
}
```

---

## 坑 5：Client 侧 inspect 查询会挂起，别依赖它

**症状**：`Service.listService {service: "styles"}` 每次调用都 pending 8 分钟不返回（多次被取消）。

**经验**：
- `Theme.listTokens`、`Slots.listSubTree` 偶尔能返回
- `Service.listService`（styles 等服务详情）**基本必挂** —— 别再等它
- **替代方案**：直接读 node_modules 源码！所有答案都在：
  - `@deepseek-ai\dsh-client-ui-theme\lib\styles\design-platform.css`（全部主题变量定义，338 行）
  - `@deepseek-ai\dsh-client-ui-conversation\lib\client.js`（聊天/输入框组件，css$N 变量里有所有类名和样式）
  - `@deepseek-ai\dsh-client-ui-sidebar\lib\client.js`（侧栏）
  - `@deepseek-ai\dsh-cordis-client-runner\lib\client.js`（动态插件运行器，styles/React 注入机制）

---

## 坑 6：输入框 textarea 自身是透明的，背景在父卡片上

**症状**：以为改 textarea 背景就行，其实它 `background: 0 0`（透明）、`color: #0000`（透明文字，有 mirror 层负责显示）。

**根因**：输入框的可见背景来自父容器 `.uV2eYG_card` 的 `background: var(--dsw-specific-input-major)`。

**解法**：
1. 覆盖 `--dsw-specific-input-major` 变量（管卡片背景）
2. 额外给 textarea 强制 `background-color` + `color` + `backdrop-filter` 兜底（v5 做法），保证任何情况下都是深色可读

---

## 坑 7：插件版本与运行机制

- `cordis_define` 的 Package 是**不可变**的：每次修改都要追加新 pkg，不能覆盖旧的
- 切换版本用 `cordis_run` 的 **`update` 模式**（有 current 时）；首次激活/回滚用 `run`
- 用户**手动停止插件** = 界面立即回退默认主题（这是"变白"的另一个原因，不是故障）
- 激活成功但界面没变化 → 优先怀疑 client 半区逻辑没执行（参见坑 1）

---

# 第二部分：正式插件开发踩坑（frost-canvas 从内存插件 → 标准插件）

> 背景：把主题从「会话内动态插件」升级为「正式安装、开机自动加载」的 profile 插件。
> Copilot 在 UI 打不开事故中查出 3 个致命 bug + 2 个隐患，以下是完整记录。

## 坑 8：宿主 `apply` 签名是 `apply(ctx, config)`，不能读 `ctx.config`

**症状**：启动报 `cannot get property "config" without inject`。

**根因**：DSH 框架把插件自身配置作为 **`apply` 的第二参数**传入（`apply(rawContext, config)`），
`ctx.config` 不是可访问的注入服务。

**解法**：
```js
export function apply(ctx, config) {
  ctx.settings.register('frost-canvas', Config, { base: config, applies: 'live' })
}
```

## 坑 9：宿主用到 `ctx.settings` 必须 inject `'settings'`

**症状**：`cannot get property "settings" without inject`。

**根因**：`apply` 里调用了 `ctx.settings.register()`，但 `inject` 只声明了 `['connection']`。

**解法**：`export const inject = ['connection', 'settings']`（宿主端 settings 由 `@deepseek-ai/dsh-settings-file` 提供）。

## 坑 10（致命）：客户端 inject 了不存在的服务 → 插件永远 pending → web boot 失败 → UI 打不开

**症状**：`web boot: 1 entry did not activate frost-canvas: pending (waiting for service: settings)`，
HARNESS 错误屏，宿主崩溃退出。

**根因**：客户端**不存在名为 `settings` 的服务**（客户端只有 `settingsScope`，由
`dsh-client-ui-settings` 提供）。inject 不存在的服务 → `ctx.get(x) === undefined` → 永远 pending
→ `assertEntriesActive` 判定 web boot 失败。

**解法**：客户端 inject 只写真实存在的客户端服务（`slots`、`locale`、`connection`）：
```js
var inject = ['slots'];   // ❌ 之前写了 ['slots', 'settings']
```

## 坑 11：客户端读不到 `ctx.config`

**根因**：客户端半区没有 config 注入（会抛 `cannot get property "config" without inject`）。

**解法**：客户端用 localStorage + 默认值代替：
```js
var initial = mergeSettings(defaultSettings(), loadSaved() || {});
```

## 坑 12：正式插件 client 是 `__ModuleLoader__.load` 格式，且直接操作 DOM

- 正式插件的 client 半区不是动态插件的 `return {apply}` 闭包，而是：
  ```js
  window.__ModuleLoader__.load({ id, factory: (require) => { /* require('react') 等 */ exports.apply = apply; exports.inject = inject; return module.exports } })
  ```
- 正式插件 client **可以直接操作 document**（`document.createElement('style')`），不需要动态插件的 `styles` 闭包符号
- 依赖通过 `require()` 由前端加载器注入（react 等），不需要在 profile 顶层显式安装

## 坑 13：改完插件要同步三处，否则重装会回滚

1. 源码：`frost-blue-glass/package/lib/*`
2. 已安装副本：`profiles/web/node_modules/frost-canvas/lib/*`
3. tarball：`npm pack` 后覆盖 `profiles/web/plug-tars/frost-canvas-0.1.0.tgz`

## 坑 14：安装本地插件用 `file:` 协议 + 绝对路径

- `dsh plugin --profile web add "file:C:/.../frost-canvas-0.1.0.tgz"` ✅
- `dsh plugin --profile web add "link:相对路径"` ❌ 会被解析到 profile 的 workspace 下
- tgz 统一放到 `~/.dsh/plug-tars/`（与 dsh-at-file、dsh-genui 一致）

## 排查工具（Copilot 总结）

- 查看合成配置：`dsh --profile web --dump-config`
- 启动看日志：`node <全局 dsh bin.js> web`
- boot 判定：web 前端 bundle 的 `assertEntriesActive`（pending = `fiber.inject` 里 `ctx.get(x) === undefined`）

---

## ✅ 最终正确姿势（v5 模板）

```js
return {
  apply(ctx) {
    ctx.effect(() => {
      const disposers = []
      // 1) alias token 走 theme 服务（可选，可靠通道）
      const theme = ctx.get('theme')
      if (theme !== undefined) {
        try {
          const d = theme.overrideTokens('frost-deep-blue', { /* 13 个 token */ })
          if (typeof d === 'function') disposers.push(d)
        } catch (e) {}
      }
      // 2) specific 变量 + 全部细节走 styles 闭包符号（核心！）
      try {
        const d = styles.insert('body { /* 全套 !important 覆盖 */ }')
        if (typeof d === 'function') disposers.push(d)
      } catch (e) {}
      return () => { for (const d of disposers) { try { d() } catch (e) {} } }
    })
  },
}
```

完整代码见 [`plugin-frost-v5.js`](./plugin-frost-v5.js)。


---

# 十五～二十、0.2.0 桌面端适配新增（2026-09-30）

## 坑 15 · 依赖不能靠"别人会给我装"
Host 半区 `import z from 'schemastery'`，但 `package.json` 里 `dependencies` 是空的。
在旧 web profile 里能跑，只是因为该包被别的插件提升到了 `node_modules`；
换到全新 profile（桌面版 `profiles\desktop`）立刻报
`1 entry did not activate frost-canvas (frost-canvas): failed to import`。
**任何 import 都必须出现在自己的 dependencies 里。**

## 坑 16 · DSH 0.2 移除了 `ctx.settings.register`
0.2 的 settings 服务不再提供 `register()`（官方 62 个 client 包无一处使用），
旧代码抛 `TypeError: ctx.settings.register is not a function`，
cordis 记为 "1 entry did not activate"，整个插件被拖挂。
**修法：`if (ctx.settings && typeof ctx.settings.register === 'function') { ... }`**，
0.1.x 行为不变。教训：调用不确定是否存在的宿主服务，一律加 typeof 守卫。

## 坑 17 · 拼 CSS 字符串时，插入点要在选择器块内
第一版把 0.2 token 声明插到了 `body {}` **之外**（原来的 `}` 在前面已闭合），
生成的 CSS 就成了没有选择器的裸声明 → 浏览器整段忽略，看起来"改了却没生效"。
**改完必须配平大括号 + 抽样看片段。**

## 坑 18 · 桌面端 App 有模块缓存，"报错行号会骗你"
改完已安装插件的文件后，运行中的进程仍跑旧代码，
报错行号指向**你已经改掉的那一行**——这正是缓存的明确信号：重启即生效。
（本次就是靠"报错还指向 102 行注释"确认的。）

## 坑 19 · PowerShell 不等待 GUI 程序
`& "DeepSeek Harness.exe" --expose-internals cli.js plugin ...` 这种调用，
如果不接管道会**立刻返回**（假成功，什么都没干）。
必须 `2>&1 | Out-String` 才会真正等待。

## 坑 20 · 云端 MCP 工具的两个坑
① `ssh_run` 的命令若以 `cd` 开头，会被包装器当成可执行文件（exit 127 / "failed to execute process"）——用绝对路径；
② `file_upload` 有自己的调用超时，大文件会"工具报超时但文件其实传完了"或直接失败——大文件改走 paramiko SFTP 断点续传（记得开 `set_pipelined(True)`，否则速度从 1.2MB/s 掉到 0.4MB/s）。
