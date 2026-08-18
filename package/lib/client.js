// Frost Canvas — Client 半区（主题引擎 + 画布设置页）
// 格式：window.__ModuleLoader__.load({ id, factory })，与 dsh-better-sidebar / dsh-mnemon 一致。
// 主题核心逻辑与 React UI 全部内联在 factory 内（无构建工具，纯手写 CommonJS 打包格式）。
window.__ModuleLoader__.load({
  id: 'frost-canvas',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var react = require('react');

    // ════════════════════════════════════════════════════════════
    // 1. 配色预设 + 玻璃材质库（与 Host 半区保持一致）
    // ════════════════════════════════════════════════════════════
    var PRESETS = {
      'deep-blue': { label: '深海极客', colors: ['#0d1530', '#070c1c'], accent: '#4da6ff', dark: true },
      'sprout': { label: '青芽绿意', colors: ['#DFF8D3', '#A8E48C', '#B8CDB8', '#8FA88A'], accent: '#4e9c3f', dark: false },
      'peach': { label: '绯桃冻露', colors: ['#d99797', '#d9ecf6', '#f1bfbc', '#e37e7e'], accent: '#d65a7a', dark: false },
      'lemon': { label: '柠叶碎冰', colors: ['#cafcc3', '#ffffdd', '#d9f3f0', '#feffbc'], accent: '#a3b23a', dark: false },
      'tea': { label: '雾水青茶', colors: ['#eaf4cc', '#d9ea9f', '#abc89b', '#c2d5b4'], accent: '#6f9e5c', dark: false },
      'orange': { label: '橙子奶霜', colors: ['#B8E0E2', '#FAE39E', '#FAC356', '#FC9F6C'], accent: '#e88a3c', dark: false },
      'caramel': { label: '海盐焦糖', colors: ['#A1CCD1', '#F4F2DE', '#E9B384', '#7C9D96'], accent: '#b0764a', dark: false },
      'fog': { label: '旧信朝雾', colors: ['#66788E', '#B1BCC9', '#F8F7F3', '#524331'], accent: '#8a7a5c', dark: true },
      'snow': { label: '雪覆长川', colors: ['#d0e6ee', '#ecf6f8', '#c1e9ed', '#a6ccdd'], accent: '#5fa8c4', dark: false },
    };

    var GLASS = {
      frosted: { label: '磨砂玻璃', blur: 24, saturate: 160, alpha: 0.55 },
      translucent: { label: '半透明', blur: 8, saturate: 140, alpha: 0.28 },
      glossy: { label: '高光玻璃', blur: 16, saturate: 180, alpha: 0.4 },
      ice: { label: '冰晶质感', blur: 12, saturate: 200, alpha: 0.5 },
      matte: { label: '哑光雾面', blur: 28, saturate: 120, alpha: 0.62 },
      liquid: { label: '液态玻璃', blur: 6, saturate: 220, alpha: 0.35, ripple: true },
      rainy: { label: '雨雾玻璃', blur: 30, saturate: 130, alpha: 0.7, droplet: true },
    };

    // ════════════════════════════════════════════════════════════
    // 2. 配置持久化（localStorage）
    // ════════════════════════════════════════════════════════════
    var STORAGE_KEY = 'frost-canvas-settings';

    function loadSaved() {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) { /* corrupted */ }
      return null;
    }

    function saveSettings(s) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch (e) { /* quota */ }
    }

    function mergeSettings(defaults, saved) {
      if (!saved) return defaults;
      var out = {};
      for (var k in defaults) out[k] = defaults[k];
      for (var k2 in saved) if (saved[k2] !== undefined && saved[k2] !== null) out[k2] = saved[k2];
      if (saved.background && typeof saved.background === 'object') {
        out.background = {};
        for (var b in defaults.background) out.background[b] = defaults.background[b];
        for (var b2 in saved.background) if (saved.background[b2] !== undefined) out.background[b2] = saved.background[b2];
      }
      return out;
    }

    function defaultSettings() {
      return {
        preset: 'deep-blue',
        custom: false,
        glass: 'frosted',
        background: { type: 'linear', angle: 160, colors: ['#0d1530', '#070c1c'] },
        accent: '#4da6ff',
        surfaceAlpha: 0.72,
        blurStrength: 20,
        glassAlpha: 0.55,
        enabled: true,
      };
    }

    // ════════════════════════════════════════════════════════════
    // 3. 主题引擎：把配置编译成 CSS
    // ════════════════════════════════════════════════════════════
    function resolveSettings(s) {
      var out = mergeSettings(defaultSettings(), s);
      if (!out.custom && PRESETS[out.preset]) {
        var p = PRESETS[out.preset];
        out.background = { type: 'linear', angle: 160, colors: p.colors.slice() };
        out.accent = p.accent;
        out.dark = !!p.dark;
      } else {
        out.dark = false;
        var lum = luminanceOf(out.background.colors[0] || '#888888');
        out.dark = lum < 0.45;
      }
      return out;
    }

    function hexToRgb(hex) {
      var h = String(hex || '').replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      if (isNaN(n)) return [128, 128, 128];
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function rgba(hex, a) {
      var rgb = hexToRgb(hex);
      return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
    }

    function luminanceOf(hex) {
      var rgb = hexToRgb(hex);
      return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    }

    function clamp01(v) {
      return Math.max(0, Math.min(1, Number(v) || 0));
    }

    function buildBackgroundCss(bg) {
      var colors = (bg.colors && bg.colors.length ? bg.colors : ['#888888', '#555555']);
      if (bg.type === 'solid') {
        return colors[0];
      }
      if (bg.type === 'radial') {
        return 'radial-gradient(120% 120% at 50% 0%, ' + colors[0] + ' 0%, ' + colors[1] + ' 60%, ' + (colors[2] || colors[1]) + ' 100%)';
      }
      var stops = colors.map(function (c, i) {
        return c + ' ' + Math.round((i / (colors.length - 1)) * 100) + '%';
      }).join(', ');
      return 'linear-gradient(' + (bg.angle || 160) + 'deg, ' + stops + ')';
    }

    function buildCss(s) {
      var resolved = resolveSettings(s);
      var glass = GLASS[resolved.glass] || GLASS.frosted;
      var glassAlpha = clamp01(resolved.glassAlpha != null ? resolved.glassAlpha : glass.alpha);
      var blur = resolved.blurStrength || glass.blur;
      var isLiquid = resolved.glass === 'liquid';
      var isRainy = resolved.glass === 'rainy';
      var bgCss = buildBackgroundCss(resolved.background);
      var accent = resolved.accent || '#4da6ff';
      var dark = resolved.dark;

      var textPrimary = dark ? '#e9eeff' : '#2b3547';
      var textSecondary = dark ? '#9fb0da' : '#5a6b85';
      var textTertiary = dark ? '#7d90bd' : '#7a8aa5';
      var textCaption = dark ? '#5f71a0' : '#9aa7bd';
      var textDimmed = dark ? '#4a5a85' : '#b0bacb';

      var border = dark ? 'rgba(122,160,255,0.22)' : rgba(accent, 0.18);
      var borderStrong = dark ? 'rgba(122,160,255,0.38)' : rgba(accent, 0.35);

      var baseRgb = hexToRgb(resolved.background.colors[0] || '#888888');
      var surfaceBase = 'rgba(' + baseRgb[0] + ',' + baseRgb[1] + ',' + baseRgb[2] + ',0.9)';
      var glassWhite = 'rgba(255,255,255,' + Math.min(0.92, glassAlpha + (dark ? 0.05 : 0)) + ')';
      var surfaceL1 = dark ? rgba(resolved.background.colors[0], 0.72) : glassWhite;
      var surfaceL2 = dark ? rgba(resolved.background.colors[0], 0.62) : 'rgba(255,255,255,' + (glassAlpha + 0.08) + ')';

      var css = '';
      css += 'body {';
      css += '  background: ' + bgCss + ' !important;';
      css += '  background-attachment: fixed !important;';
      css += '  color-scheme: ' + (dark ? 'dark' : 'light') + ' !important;';
      css += '}';

      css += 'body {';
      css += '  --dsw-alias-bg-base: ' + (dark ? 'rgba(9,13,28,0.72)' : 'rgba(255,255,255,0.35)') + ' !important;';
      css += '  --dsw-alias-bg-layer-1: ' + surfaceL1 + ' !important;';
      css += '  --dsw-alias-bg-layer-2: ' + surfaceL2 + ' !important;';
      css += '  --dsw-alias-bg-layer-3: ' + (dark ? 'rgba(32,44,82,0.62)' : 'rgba(255,255,255,0.5)') + ' !important;';
      css += '  --dsw-alias-bg-overlay: ' + (dark ? 'rgba(13,19,40,0.9)' : 'rgba(255,255,255,0.88)') + ' !important;';
      css += '  --dsw-alias-bg-module-platform: ' + (dark ? 'rgba(24,34,66,0.8)' : 'rgba(255,255,255,0.55)') + ' !important;';
      css += '  --dsw-alias-bg-skeleton: ' + (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') + ' !important;';
      css += '  --dsw-alias-bg-mask-1: rgba(0,0,0,' + (dark ? 0.5 : 0.3) + ') !important;';
      css += '  --dsw-alias-bg-mask-2: rgba(0,0,0,' + (dark ? 0.3 : 0.15) + ') !important;';
      css += '  --dsw-alias-bg-mask-3: rgba(0,0,0,' + (dark ? 0.6 : 0.4) + ') !important;';
      css += '  --dsw-specific-bubble: ' + (dark ? 'rgba(30,42,80,0.72)' : 'rgba(255,255,255,' + (glassAlpha + 0.15) + ')') + ' !important;';
      css += '  --dsw-specific-bubble-highlight: ' + (dark ? 'rgba(38,52,96,0.7)' : 'rgba(255,255,255,0.8)') + ' !important;';
      css += '  --dsw-specific-input-major: ' + (dark ? 'rgba(22,32,62,0.78)' : 'rgba(255,255,255,' + (glassAlpha + 0.2) + ')') + ' !important;';
      css += '  --dsw-specific-menu: ' + (dark ? 'rgba(16,23,47,0.92)' : 'rgba(255,255,255,0.92)') + ' !important;';
      css += '  --dsw-specific-selector: ' + (dark ? 'rgba(24,34,66,0.85)' : 'rgba(255,255,255,0.7)') + ' !important;';
      css += '  --dsw-specific-sidebar-fill: ' + (dark ? 'rgba(11,17,36,0.78)' : 'rgba(255,255,255,' + (glassAlpha - 0.05) + ')') + ' !important;';
      css += '  --dsw-specific-sidebar-nav-item-active: ' + (dark ? 'rgba(48,64,118,0.55)' : rgba(accent, 0.14)) + ' !important;';
      css += '  --dsw-specific-sidebar-nav-item-active-accent: ' + rgba(accent, 0.5) + ' !important;';
      css += '  --dsw-specific-sidebar-nav-item-hover: ' + (dark ? 'rgba(40,54,100,0.45)' : rgba(accent, 0.08)) + ' !important;';
      css += '  --dsw-specific-tip: ' + (dark ? 'rgba(24,34,66,0.85)' : 'rgba(255,255,255,0.7)') + ' !important;';
      css += '  --dsw-alias-border-l1: ' + border + ' !important;';
      css += '  --dsw-alias-border-l2: ' + borderStrong + ' !important;';
      css += '  --dsw-alias-border-l2-darkmode-thin: ' + border + ' !important;';
      css += '  --dsw-alias-border-l3: ' + borderStrong + ' !important;';
      css += '  --dsw-alias-border-l4: ' + borderStrong + ' !important;';
      css += '  --dsw-alias-border-inverted: ' + (dark ? 'rgba(122,160,255,0.25)' : rgba(accent, 0.2)) + ' !important;';
      css += '  --dsw-alias-border-inverted2: ' + (dark ? 'rgba(122,160,255,0.18)' : rgba(accent, 0.12)) + ' !important;';
      css += '  --dsw-alias-label-primary: ' + textPrimary + ' !important;';
      css += '  --dsw-alias-label-primary-bluish: ' + (dark ? '#cdd9ff' : textPrimary) + ' !important;';
      css += '  --dsw-alias-label-primary-dimmed: ' + (dark ? '#aebcf0' : textSecondary) + ' !important;';
      css += '  --dsw-alias-label-primary-foreground: ' + (dark ? '#e9eeff' : '#ffffff') + ' !important;';
      css += '  --dsw-alias-label-primary-inverted: ' + (dark ? '#0a0f1f' : '#ffffff') + ' !important;';
      css += '  --dsw-alias-label-secondary: ' + textSecondary + ' !important;';
      css += '  --dsw-alias-label-tertiary: ' + textTertiary + ' !important;';
      css += '  --dsw-alias-label-caption: ' + textCaption + ' !important;';
      css += '  --dsw-alias-label-dimmed: ' + textDimmed + ' !important;';
      css += '  --dsw-alias-brand-primary: ' + accent + ' !important;';
      css += '  --dsw-alias-brand-primary-invert: ' + (dark ? '#0a0f1f' : '#ffffff') + ' !important;';
      css += '  --dsw-alias-brand-text: ' + accent + ' !important;';
      css += '  --dsw-alias-brand-primary-new-colorprimary-new-color: ' + accent + ' !important;';
      css += '  --dsw-alias-button-primary-fill: ' + accent + ' !important;';
      css += '  --dsw-alias-button-primary-hover: ' + rgba(accent, 0.85) + ' !important;';
      css += '  --dsw-alias-button-primary-dimmed: ' + rgba(accent, 0.3) + ' !important;';
      css += '  --dsw-alias-button-info-fill: ' + accent + ' !important;';
      css += '  --dsw-alias-button-info-hover: ' + rgba(accent, 0.85) + ' !important;';
      css += '  --dsw-alias-button-contrast-fill: ' + (dark ? '#dfe7ff' : textPrimary) + ' !important;';
      css += '  --dsw-alias-button-elevated-fill: ' + (dark ? 'rgba(30,42,80,0.8)' : 'rgba(255,255,255,0.8)') + ' !important;';
      css += '  --dsw-alias-button-floating-fill: ' + (dark ? 'rgba(24,34,66,0.85)' : 'rgba(255,255,255,0.85)') + ' !important;';
      css += '  --dsw-alias-button-floating-hover: ' + (dark ? 'rgba(34,46,86,0.9)' : 'rgba(255,255,255,0.95)') + ' !important;';
      css += '  --dsw-alias-button-ghost-active-fill: ' + rgba(accent, 0.14) + ' !important;';
      css += '  --dsw-alias-button-ghost-active-hover: ' + rgba(accent, 0.2) + ' !important;';
      css += '  --dsw-alias-button-ghost-active-border: ' + rgba(accent, 0.4) + ' !important;';
      css += '  --dsw-alias-button-tool-bar-fill: ' + rgba(accent, 0.5) + ' !important;';
      css += '  --dsw-alias-button-tool-bar-hover: ' + rgba(accent, 0.6) + ' !important;';
      css += '  --dsw-alias-button-tool-bar-fill-invisible: ' + rgba(accent, 0.36) + ' !important;';
      css += '  --dsw-alias-interactive-bg-hover: ' + rgba(accent, 0.1) + ' !important;';
      css += '  --dsw-alias-interactive-bg-hover-accent: ' + rgba(accent, 0.16) + ' !important;';
      css += '  --dsw-alias-interactive-bg-active: ' + rgba(accent, 0.16) + ' !important;';
      css += '  --dsw-alias-interactive-bg-hover-solid: ' + rgba(accent, 0.18) + ' !important;';
      css += '  --dsw-alias-interactive-bg-hover-danger: rgba(255,80,100,0.12) !important;';
      css += '  --dsw-alias-markdown-code-block: ' + (dark ? 'rgba(7,11,24,0.85)' : 'rgba(255,255,255,0.7)') + ' !important;';
      css += '  --dsw-alias-markdown-code-block-banner: ' + (dark ? 'rgba(10,15,31,0.9)' : 'rgba(255,255,255,0.75)') + ' !important;';
      css += '  --dsw-alias-markdown-inline-code: ' + rgba(accent, 0.12) + ' !important;';
      css += '  --dsw-alias-markdown-placeholder: ' + rgba(accent, 0.08) + ' !important;';
      css += '  --dsw-alias-markdown-tag: ' + rgba(accent, 0.1) + ' !important;';
      css += '  --dsw-alias-markdown-citation: ' + rgba(accent, 0.08) + ' !important;';
      css += '  --dsw-alias-scrollbar-bg-l1: ' + rgba(accent, 0.2) + ' !important;';
      css += '  --dsw-alias-scrollbar-bg-l2: ' + rgba(accent, 0.25) + ' !important;';
      css += '  --dsw-alias-scrollbar-hover-l1: ' + rgba(accent, 0.35) + ' !important;';
      css += '  --dsw-alias-scrollbar-hover-l2: ' + rgba(accent, 0.4) + ' !important;';
      css += '  --dsw-alias-state-error-primary: #ff6b7d !important;';
      css += '  --dsw-alias-state-error-secondary: #ff8a98 !important;';
      css += '  --dsw-alias-state-success-primary: #3ddc97 !important;';
      css += '  --dsw-alias-state-success-secondary: #5ce8ab !important;';
      css += '  --dsw-alias-state-warn-primary: #ffb454 !important;';
      css += '  --dsw-alias-state-warn-secondary: #ffc877 !important;';
      css += '  --dsw-alias-state-warn-label: #ffb454 !important;';
      css += '  --dsw-alias-state-business-primary: ' + accent + ' !important;';
      css += '  --dsw-alias-state-business-tertiary: ' + rgba(accent, 0.16) + ' !important;';
      css += '  --dsw-alias-toast-bg: ' + (dark ? 'rgba(13,19,40,0.92)' : 'rgba(43,53,71,0.92)') + ' !important;';
      css += '  --dsw-alias-tooltip-bg: ' + (dark ? 'rgba(13,19,40,0.92)' : 'rgba(43,53,71,0.92)') + ' !important;';
      css += '}';

      // 输入框毛玻璃
      css += 'textarea, [contenteditable="true"], input[type="text"], input:not([type]) {';
      css += '  background-color: ' + (dark ? 'rgba(22,32,62,0.8)' : 'rgba(255,255,255,' + (glassAlpha + 0.25) + ')') + ' !important;';
      css += '  color: ' + textPrimary + ' !important;';
      css += '  caret-color: ' + accent + ' !important;';
      css += '  backdrop-filter: blur(' + blur + 'px) saturate(' + glass.saturate + '%) !important;';
      css += '  -webkit-backdrop-filter: blur(' + blur + 'px) saturate(' + glass.saturate + '%) !important;';
      css += '}';
      css += 'textarea::placeholder, [contenteditable="true"]::placeholder, input::placeholder {';
      css += '  color: ' + textCaption + ' !important;';
      css += '}';

      // 液态玻璃：低模糊 + 高饱和 + 高光描边 + 波纹渐变
      if (isLiquid) {
        css += 'textarea, [contenteditable="true"] {';
        css += '  border: 1px solid rgba(255,255,255,0.55) !important;';
        css += '  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 8px rgba(255,255,255,0.18), 0 4px 18px rgba(0,0,0,0.08) !important;';
        css += '  background-image: radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,0.35) 0%, transparent 55%) !important;';
        css += '}';
        css += '.uV2eYG_card {';
        css += '  background-image: radial-gradient(140% 100% at 15% -20%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(120% 120% at 90% 110%, rgba(255,255,255,0.22) 0%, transparent 45%) !important;';
        css += '  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 30px rgba(0,0,0,0.12) !important;';
        css += '}';
      }

      // 雨雾玻璃：强模糊 + 低饱和 + 雨滴状纹理
      if (isRainy) {
        css += 'body::after {';
        css += '  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;';
        css += '  background-image:';
        css += '    radial-gradient(1.5px 1.5px at 12% 22%, rgba(255,255,255,0.35) 50%, transparent 51%),';
        css += '    radial-gradient(1px 1px at 38% 68%, rgba(255,255,255,0.28) 50%, transparent 51%),';
        css += '    radial-gradient(2px 2px at 62% 32%, rgba(255,255,255,0.3) 50%, transparent 51%),';
        css += '    radial-gradient(1px 1px at 84% 78%, rgba(255,255,255,0.32) 50%, transparent 51%),';
        css += '    radial-gradient(1.5px 1.5px at 28% 88%, rgba(255,255,255,0.26) 50%, transparent 51%),';
        css += '    radial-gradient(1px 1px at 74% 12%, rgba(255,255,255,0.3) 50%, transparent 51%),';
        css += '    radial-gradient(2px 2px at 50% 50%, rgba(255,255,255,0.24) 50%, transparent 51%);';
        css += '  background-size: 340px 340px; opacity: 0.5;';
        css += '}';
        css += 'body::after { animation: frost-rain-drift 26s linear infinite; }';
        css += '@keyframes frost-rain-drift { from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; } to { background-position: -340px 340px, -340px 340px, -340px 340px, -340px 340px, -340px 340px, -340px 340px, -340px 340px; } }';
      }

      css += '::selection { background: ' + rgba(accent, 0.35) + ' !important; }';
      return css;
    }

    // ════════════════════════════════════════════════════════════
    // 4. 样式注入（正式插件直接操作 document）
    // ════════════════════════════════════════════════════════════
    var styleTag = null;
    function applyTheme(settings) {
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.setAttribute('data-frost-canvas', '');
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = buildCss(settings);
    }

    // ════════════════════════════════════════════════════════════
    // 5. 画布设置 UI（React，无 JSX）
    // ════════════════════════════════════════════════════════════
    function FrostCanvasSection(props) {
      var ctx = props.ctx;
      var sync = props.sync;
      var [settings, setSettings] = react.useState(function () {
        return mergeSettings(defaultSettings(), loadSaved() || {});
      });

      var update = function (patch) {
        setSettings(function (prev) {
          var next = mergeSettings(prev, patch);
          saveSettings(next);
          applyTheme(next);
          if (sync) sync(next);
          return next;
        });
      };

      var updateBg = function (bgPatch) {
        setSettings(function (prev) {
          var bg = {};
          for (var k in prev.background) bg[k] = prev.background[k];
          for (var k2 in bgPatch) bg[k2] = bgPatch[k2];
          var next = mergeSettings(prev, { background: bg, custom: true });
          saveSettings(next);
          applyTheme(next);
          if (sync) sync(next);
          return next;
        });
      };

      var pickPreset = function (id) {
        var p = PRESETS[id];
        if (!p) return;
        setSettings(function (prev) {
          var next = mergeSettings(prev, {
            preset: id,
            custom: false,
            background: { type: 'linear', angle: 160, colors: p.colors.slice() },
            accent: p.accent,
          });
          saveSettings(next);
          applyTheme(next);
          if (sync) sync(next);
          return next;
        });
      };

      var pickGlass = function (id) {
        var g = GLASS[id];
        if (!g) return;
        update({ glass: id, glassAlpha: g.alpha, blurStrength: g.blur });
      };

      // 渲染
      var h = react.createElement;
      var swatchRow = h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' } },
        Object.keys(PRESETS).map(function (id) {
          var p = PRESETS[id];
          var active = !settings.custom && settings.preset === id;
          return h('button', {
            key: id,
            onClick: function () { pickPreset(id); },
            style: {
              width: 96, height: 64, borderRadius: 12, cursor: 'pointer', border: active ? '2px solid ' + (settings.accent || '#4da6ff') : '1px solid rgba(128,128,128,0.3)',
              background: 'linear-gradient(160deg, ' + p.colors[0] + ', ' + (p.colors[1] || p.colors[0]) + ')',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4, color: luminanceOf(p.colors[0]) < 0.45 ? '#fff' : '#333', fontWeight: 600, fontSize: 11,
            },
          }, p.label);
        })
      );

      var glassRow = h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' } },
        Object.keys(GLASS).map(function (id) {
          var g = GLASS[id];
          var active = settings.glass === id;
          return h('button', {
            key: id,
            onClick: function () { pickGlass(id); },
            style: {
              padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
              border: active ? '2px solid ' + (settings.accent || '#4da6ff') : '1px solid rgba(128,128,128,0.3)',
              background: active ? (settings.accent || '#4da6ff') : 'rgba(128,128,128,0.1)',
              color: active ? '#fff' : 'inherit', fontSize: 12,
            },
          }, g.label);
        })
      );

      var colorInputs = (settings.background.colors || []).map(function (c, i) {
        return h('label', { key: i, style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 } },
          '色 ' + (i + 1),
          h('input', {
            type: 'color', value: c,
            onChange: function (e) {
              var colors = (settings.background.colors || []).slice();
              colors[i] = e.target.value;
              updateBg({ colors: colors });
            },
            style: { width: 44, height: 28, border: 'none', background: 'transparent', cursor: 'pointer' },
          })
        );
      });

      var accentInput = h('label', { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 } },
        '强调色',
        h('input', {
          type: 'color', value: settings.accent || '#4da6ff',
          onChange: function (e) { update({ accent: e.target.value, custom: true }); },
          style: { width: 44, height: 28, border: 'none', background: 'transparent', cursor: 'pointer' },
        })
      );

      var angleInput = h('label', { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 } },
        '角度 ' + (settings.background.angle || 160) + '°',
        h('input', {
          type: 'range', min: 0, max: 360, step: 5, value: settings.background.angle || 160,
          onChange: function (e) { updateBg({ angle: Number(e.target.value) }); },
        })
      );

      var typeInput = h('label', { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 } },
        '渐变类型',
        h('select', {
          value: settings.background.type || 'linear',
          onChange: function (e) { updateBg({ type: e.target.value }); },
          style: { padding: '4px 8px', borderRadius: 6, fontSize: 12 },
        },
          h('option', { value: 'linear' }, '线性渐变'),
          h('option', { value: 'radial' }, '径向渐变'),
          h('option', { value: 'solid' }, '纯色')
        )
      );

      // ── 玻璃滑条：透明度 + 模糊强度 ──
      var glassAlphaVal = settings.glassAlpha != null ? settings.glassAlpha : (GLASS[settings.glass] ? GLASS[settings.glass].alpha : 0.55);
      var glassAlphaSlider = h('label', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 } },
        '玻璃透明度 ' + Math.round(glassAlphaVal * 100) + '%',
        h('input', {
          type: 'range', min: 5, max: 95, step: 5, value: Math.round(glassAlphaVal * 100),
          onChange: function (e) { update({ glassAlpha: Number(e.target.value) / 100, custom: true }); },
          style: { width: 160 },
        })
      );

      var blurVal = settings.blurStrength || (GLASS[settings.glass] ? GLASS[settings.glass].blur : 20);
      var blurSlider = h('label', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 } },
        '模糊强度 ' + blurVal + 'px',
        h('input', {
          type: 'range', min: 0, max: 60, step: 2, value: blurVal,
          onChange: function (e) { update({ blurStrength: Number(e.target.value), custom: true }); },
          style: { width: 160 },
        })
      );

      // ── 自定义方案：保存 / 应用 / 删除 ──
      var SCHEMES_KEY = 'frost-canvas-schemes';
      function loadSchemes() {
        try {
          var raw = window.localStorage.getItem(SCHEMES_KEY);
          var arr = raw ? JSON.parse(raw) : [];
          return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
      }
      var [schemes, setSchemes] = react.useState(loadSchemes);
      var [schemeName, setSchemeName] = react.useState('');

      var saveScheme = function () {
        var name = (schemeName || '').trim();
        if (!name) { name = '方案 ' + (schemes.length + 1); }
        var next = JSON.parse(JSON.stringify(settings));
        next.name = name;
        var list = loadSchemes();
        var idx = -1;
        for (var i = 0; i < list.length; i++) if (list[i].name === name) idx = i;
        if (idx >= 0) list[idx] = next; else list.push(next);
        try { window.localStorage.setItem(SCHEMES_KEY, JSON.stringify(list)); } catch (e) {}
        setSchemes(list);
        setSchemeName('');
      };

      var applyScheme = function (scheme) {
        var copy = JSON.parse(JSON.stringify(scheme));
        delete copy.name;
        setSettings(function (prev) {
          var next = mergeSettings(prev, copy);
          saveSettings(next);
          applyTheme(next);
          if (sync) sync(next);
          return next;
        });
      };

      var deleteScheme = function (name) {
        var list = loadSchemes().filter(function (s) { return s.name !== name; });
        try { window.localStorage.setItem(SCHEMES_KEY, JSON.stringify(list)); } catch (e) {}
        setSchemes(list);
      };

      var schemesRow = schemes.length > 0
        ? h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' } },
            schemes.map(function (s) {
              return h('span', { key: s.name, style: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(128,128,128,0.35)', borderRadius: 8, padding: '3px 6px', fontSize: 12 } },
                h('button', { onClick: function () { applyScheme(s); }, style: { border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontSize: 12 } }, s.name),
                h('button', { onClick: function () { deleteScheme(s.name); }, style: { border: 'none', background: 'none', cursor: 'pointer', color: '#ff6b7d', fontSize: 12 } }, '✕')
              );
            })
          )
        : h('div', { style: { margin: '8px 0', fontSize: 12, opacity: 0.6 } }, '还没有保存的方案。调整好配色后点「保存当前方案」。');

      var schemeSaveRow = h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' } },
        h('input', {
          placeholder: '方案名称…', value: schemeName,
          onChange: function (e) { setSchemeName(e.target.value); },
          style: { flex: 1, minWidth: 120, padding: '5px 8px', borderRadius: 6, fontSize: 12, border: '1px solid rgba(128,128,128,0.35)' },
        }),
        h('button', {
          onClick: saveScheme,
          style: { padding: '5px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid ' + (settings.accent || '#4da6ff'), background: (settings.accent || '#4da6ff'), color: '#fff', fontSize: 12 },
        }, '保存当前方案')
      );

      return h('div', { style: { padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 4 } },
        h('h3', { style: { margin: '4px 0', fontSize: 15 } }, '🎨 Frost Canvas 画布'),
        h('p', { style: { margin: 0, fontSize: 12, opacity: 0.7 } }, '选择配色预设，或自定义渐变底色与玻璃材质，实时生效并持久保存。'),
        h('div', { style: { marginTop: 8 } }, '配色预设', swatchRow),
        h('div', {}, '玻璃材质', glassRow),
        h('div', { style: { display: 'flex', gap: 14, flexWrap: 'wrap', margin: '8px 0' } },
          typeInput, angleInput, accentInput, ...colorInputs),
        h('div', { style: { display: 'flex', gap: 18, flexWrap: 'wrap', margin: '8px 0' } },
          glassAlphaSlider, blurSlider),
        h('div', { style: { marginTop: 8, fontWeight: 600, fontSize: 13 } }, '我的方案'),
        schemeSaveRow,
        schemesRow,
        h('div', { style: { marginTop: 4, fontSize: 12, opacity: 0.6 } },
          '当前: ' + (settings.custom ? '自定义' : (PRESETS[settings.preset] ? PRESETS[settings.preset].label : settings.preset)) +
          ' · ' + (GLASS[settings.glass] ? GLASS[settings.glass].label : settings.glass) +
          ' · 透明度 ' + Math.round(glassAlphaVal * 100) + '%' +
          ' · 模糊 ' + blurVal + 'px')
      );
    }

    // ════════════════════════════════════════════════════════════
    // 6. 插件主体
    // ════════════════════════════════════════════════════════════
    // 注：不能 inject 'settings' —— 客户端不存在名为 settings 的服务
    var inject = ['slots'];

    function apply(ctx) {
      try {
        var saved = loadSaved();
        var initial = mergeSettings(defaultSettings(), saved || {});
        applyTheme(initial);

        ctx.slots.inject('settings.section', function () {
          return ctx.slots.register({
            name: 'settings.section',
            id: 'frost-canvas',
            order: 200,
            label: function () { return 'Frost Canvas 画布'; },
          }, function (sectionProps) {
            return react.createElement(FrostCanvasSection, {
              ctx: ctx,
              sync: function (s) {},
            });
          });
        });
      } catch (e) {
        console.error('[frost-canvas] load error:', e);
      }
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
