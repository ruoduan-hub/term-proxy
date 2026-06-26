# Product

## Register

product

## Users

本产品面向需要频繁切换终端代理的开发者、运维人员和高级桌面用户。用户通常在 macOS、Linux 或 Windows 上使用多个终端、Shell 和 CLI 工具，需要在不同本地代理、公司网络、调试环境之间快速切换。

用户的核心任务不是学习代理概念，而是可靠地管理 `http_proxy`、`https_proxy`、`ALL_PROXY` 等终端环境变量，并清楚知道当前哪些代理会在新终端会话中生效。

## Product Purpose

Term Proxy 是一个轻量级跨平台桌面工具，用 Tauri + React + Vite 构建，用于统一管理终端 Shell 代理配置。MVP 优先解决过去手动编辑 profile、手动 `export http_proxy=...` 的重复工作。

第一版只管理终端 Shell 代理，不直接修改系统级网络代理。系统代理能力通过接口预留，后续在 macOS、Linux、Windows 上分别实现。

成功标准：

- 用户能添加多个代理配置，并按 `http_proxy`、`https_proxy`、`ALL_PROXY` 类型单独启用。
- 每种代理类型同一时间最多启用一个配置，不同类型可同时启用。
- 应用启动时能扫描已有 profile 中的代理配置，并提示用户导入。
- 应用通过受控 marker 和托管脚本写入 profile，支持回滚和移除集成。
- 主题、多语言、自启、跨平台路径和 shell 差异从第一版开始建模。

## Brand Personality

简约、可靠、精致。

界面应像成熟开发者工具：克制、清晰、快速、可信。视觉上参考 Raycast / Linear / Tauri-native 桌面工具的产品感，避免花哨营销页、模板感 dashboard、装饰性动效和过度卡片化。

## Anti-references

- 不做成大而全的 AI 工具管理器；功能范围聚焦终端代理。
- 不做默认 shadcn 模板外观；组件必须基于产品语境做主题和布局定制。
- 不使用 AI 紫色渐变、玻璃拟态、装饰性光斑或过度阴影。
- 不在 UI 中隐藏危险行为；profile 修改、导入、移除集成都必须有明确状态和可撤回路径。
- 不把跨平台逻辑写在 React 层，也不在单个平台上写死路径和语法。

## Product Inspiration

项目灵感来自 `farion1231/cc-switch`：https://github.com/farion1231/cc-switch

可借鉴其跨平台 Tauri 桌面工具分层、Tauri IPC 边界、配置管理、i18n、shadcn/ui、原子写入、并发安全和三端打包意识。不可复制其代码，也不扩展到 provider、MCP、session、AI 工具配置等非代理功能。

## Design Principles

1. 任务优先：界面服务于快速判断和切换代理状态，不为装饰牺牲可读性。
2. 最小侵入：用户 profile 只插入受控 marker 和一行 source/import，实际代理脚本由应用托管。
3. 可回滚：任何对用户文件的修改都必须能解释、能验证、能移除。
4. 跨平台先行：路径、换行、Shell 语法、PowerShell profile、打包差异都必须通过平台适配层处理。
5. 工程边界清晰：React 负责 UI 和交互，Rust/Tauri 负责文件系统、profile、安全写入和平台能力。

## Accessibility & Inclusion

目标为 WCAG AA。所有主要操作必须支持键盘访问，焦点态必须可见，文本和控件对比度必须合格。主题支持浅色、深色、跟随系统；动效必须支持 `prefers-reduced-motion`。多语言支持简体中文、英文、日语、繁体中文，界面布局不能依赖某一种语言长度。
