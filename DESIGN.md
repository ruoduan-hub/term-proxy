# Design

## Identity

Term Proxy 是一个面向开发者的跨平台桌面工具。设计语言应简约、精致、安静，强调“当前代理状态一眼可见”和“修改 profile 可控可信”。

物理场景：开发者在工作日上午切换公司网络、本地调试代理和无代理环境，应用应像一个可靠的工具面板，打开即可完成任务，不抢注意力。

## Color

颜色策略采用 `Restrained`：中性背景 + 单一 moss/olive 主色，主色只用于主要操作、当前选择、启用状态和关键焦点，不做装饰性铺色。

使用 OKLCH CSS 变量，不使用散落的 hex 色值。

建议起始 token：

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.18 0.012 130);
  --surface: oklch(0.972 0.004 130);
  --surface-2: oklch(0.94 0.006 130);
  --muted: oklch(0.47 0.018 130);
  --border: oklch(0.88 0.008 130);
  --primary: oklch(0.56 0.15 130);
  --primary-foreground: oklch(1 0 0);
  --accent: oklch(0.62 0.12 42);
  --danger: oklch(0.58 0.18 25);
  --warning: oklch(0.72 0.15 78);
  --success: oklch(0.56 0.15 130);
}

.dark {
  --background: oklch(0.095 0 0);
  --foreground: oklch(0.93 0.006 130);
  --surface: oklch(0.145 0.006 130);
  --surface-2: oklch(0.19 0.008 130);
  --muted: oklch(0.72 0.018 130);
  --border: oklch(0.28 0.01 130);
  --primary: oklch(0.68 0.16 130);
  --primary-foreground: oklch(0.095 0 0);
  --accent: oklch(0.74 0.13 42);
  --danger: oklch(0.68 0.18 25);
  --warning: oklch(0.78 0.15 78);
  --success: oklch(0.68 0.16 130);
}
```

## Typography

产品 UI 使用单一 sans 字体体系，优先系统字体或 Geist。界面标签、按钮、表单、列表不使用 display 字体。

层级建议：

- 页面标题：20-24px，600 weight。
- 区块标题：15-17px，600 weight。
- 正文：14px 或 15px。
- 辅助说明：12-13px，但必须保证对比度。
- 代码、路径、环境变量：使用 mono 字体。

不使用流体大标题，不使用负 letter-spacing 造成拥挤。长文本使用 `text-wrap: pretty`，标题可用 `text-wrap: balance`。

## Layout

应用首屏是实际工具界面，不做 landing page。

默认布局：

- 顶部状态栏：应用名、当前集成状态、语言/主题/设置入口。
- 主区域：左侧代理类型导航或顶部 segmented control；中间代理列表；右侧详情/编辑面板或抽屉。
- 设置区：主题、语言、开机自启、全局 `no_proxy`。Shell 集成作为内部默认能力自动维护。
- 启动加载：扫描既有 profile 代理并自动合并到配置列表，重复项按类型、协议、host、port 去重。

卡片只用于代理条目和设置分组。禁止卡片套卡片。列表和设置面板优先使用边框、分隔线和留白建立层级。

## Components

使用 shadcn/ui 按需导入，组件必须在主题 token 下统一定制。

优先组件：

- `Button`
- `Input`
- `Select`
- `Switch`
- `Tabs` 或 segmented control
- `Dialog` / `Sheet`
- `Tooltip`
- `Alert`
- `Toast`
- `Form`

图标使用单一图标库，优先 lucide-react 以匹配 shadcn 生态。不要手写 SVG 图标。

每个交互组件必须覆盖 default、hover、focus、active、disabled、loading、error 状态。

## Motion

动效只用于状态变化和反馈，例如启用开关、列表项出现、设置保存。常规转场 150-250ms，使用 ease-out 曲线。

不做页面加载编舞，不做装饰性循环动画。必须支持 `prefers-reduced-motion: reduce`。

## Responsive

桌面优先，但窗口缩小时必须保持可用：

- 宽屏：类型导航 + 列表 + 详情三栏。
- 中等宽度：详情进入右侧 Sheet。
- 窄宽度：类型导航变为顶部 Tabs，列表和表单纵向排列。

文本不得溢出按钮、列表项或表单容器。代理 URL、路径和 profile 文件名必须支持截断、复制和 tooltip。

## i18n

界面文本全部通过 i18next key 管理，不在组件中散落硬编码文案。支持：

- `zh-CN`
- `en`
- `ja`
- `zh-TW`

默认语言跟随系统，用户设置后覆盖系统语言。布局必须兼容英文和日文较长文本。

## Quality Bar

提交前必须检查：

- 深浅色主题均可读。
- 按键盘 Tab 顺序可以完成主要操作。
- 表单错误可见且可理解。
- 导入、保存、失败、部分失败都有明确反馈。
- 没有控制台调试输出。
- 没有无意义注释；复杂跨平台逻辑使用中文注释解释原因。
