// Frost Canvas — Host 半区
// 职责：声明插件配置 schema（schemastery），把配置传递给 Client 半区。
// 主题的实际渲染全部在 Client 半区（浏览器）完成。
import z from 'schemastery'

export const name = 'frost-canvas'

// Client 半区依赖的运行时服务
// 注意：apply 里用了 ctx.settings.register()，必须 inject 'settings'（宿主端由
// dsh-settings-file 提供），否则 cordis 报 cannot get property "settings" without inject。
export const inject = ['connection', 'settings']

// 配色预设色卡（9 套：默认深蓝 + 8 套用户配色卡）
export const PRESETS = {
  'deep-blue': {
    label: '深海极客',
    colors: ['#0d1530', '#070c1c'],
    accent: '#4da6ff',
    dark: true,
  },
  'sprout': {
    label: '青芽绿意',
    colors: ['#DFF8D3', '#A8E48C', '#B8CDB8', '#8FA88A'],
    accent: '#4e9c3f',
    dark: false,
  },
  'peach': {
    label: '绯桃冻露',
    colors: ['#d99797', '#d9ecf6', '#f1bfbc', '#e37e7e'],
    accent: '#d65a7a',
    dark: false,
  },
  'lemon': {
    label: '柠叶碎冰',
    colors: ['#cafcc3', '#ffffdd', '#d9f3f0', '#feffbc'],
    accent: '#a3b23a',
    dark: false,
  },
  'tea': {
    label: '雾水青茶',
    colors: ['#eaf4cc', '#d9ea9f', '#abc89b', '#c2d5b4'],
    accent: '#6f9e5c',
    dark: false,
  },
  'orange': {
    label: '橙子奶霜',
    colors: ['#B8E0E2', '#FAE39E', '#FAC356', '#FC9F6C'],
    accent: '#e88a3c',
    dark: false,
  },
  'caramel': {
    label: '海盐焦糖',
    colors: ['#A1CCD1', '#F4F2DE', '#E9B384', '#7C9D96'],
    accent: '#b0764a',
    dark: false,
  },
  'fog': {
    label: '旧信朝雾',
    colors: ['#66788E', '#B1BCC9', '#F8F7F3', '#524331'],
    accent: '#8a7a5c',
    dark: true,
  },
  'snow': {
    label: '雪覆长川',
    colors: ['#d0e6ee', '#ecf6f8', '#c1e9ed', '#a6ccdd'],
    accent: '#5fa8c4',
    dark: false,
  },
}

// 玻璃材质库（7 种：基础 5 种 + 液态玻璃 + 雨雾玻璃）
export const GLASS = {
  frosted: { label: '磨砂玻璃', blur: 24, saturate: 160, alpha: 0.55 },
  translucent: { label: '半透明', blur: 8, saturate: 140, alpha: 0.28 },
  glossy: { label: '高光玻璃', blur: 16, saturate: 180, alpha: 0.4 },
  ice: { label: '冰晶质感', blur: 12, saturate: 200, alpha: 0.5 },
  matte: { label: '哑光雾面', blur: 28, saturate: 120, alpha: 0.62 },
  liquid: { label: '液态玻璃', blur: 6, saturate: 220, alpha: 0.35, ripple: true },
  rainy: { label: '雨雾玻璃', blur: 30, saturate: 130, alpha: 0.7, droplet: true },
}

// 配置 schema（对应 cordis.patch.yml 的 config）
export const Config = z.object({
  preset: z.string().default('deep-blue'),
  custom: z.boolean().default(false),
  glass: z.string().default('frosted'),
  background: z.object({
    type: z.string().default('linear'),
    angle: z.number().default(160),
    colors: z.array(z.string()).default(['#0d1530', '#070c1c']),
  }).default(),
  accent: z.string().default('#4da6ff'),
  surfaceAlpha: z.number().default(0.72),
  blurStrength: z.number().default(20),
  glassAlpha: z.number().default(0.55),
  enabled: z.boolean().default(true),
})

export function apply(ctx, config) {
  // 注意：本框架把插件自身配置作为 apply 第二参传入（见 @deepseek-ai/dsh-web-app），
  // 不能读 ctx.config（否则 cordis 报 cannot get property "config" without inject）。
  // DSH 0.2 起 settings 服务不再提供 register()（0.1.x 才有）；主题实际由 Client 半区
  // 的 localStorage 驱动，这里只影响设置页的注册值，故 0.2 上跳过，避免 TypeError 拖挂整个插件。
  if (ctx.settings && typeof ctx.settings.register === 'function') {
    ctx.settings.register('frost-canvas', Config, {
      base: config,
      applies: 'live',
    })
  }
}
