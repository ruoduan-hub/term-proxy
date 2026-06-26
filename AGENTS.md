# AGENTS.md - Term Proxy 项目指南

## 项目定位

Term Proxy 是一个使用 Tauri + React + Vite 构建的轻量级跨平台桌面工具，用于统一管理终端 Shell 代理环境变量。

MVP 聚焦终端代理管理，不直接修改系统级网络代理。系统代理能力只保留接口和模块边界，后续按 macOS、Linux、Windows 分别实现。

项目灵感来自 `cc-switch`：https://github.com/farion1231/cc-switch。可以借鉴其跨平台桌面工具分层、Tauri IPC、配置管理、i18n、shadcn/ui、原子写入和三端打包意识，但不得复制其代码或扩展到 provider/MCP/session 等非代理功能。

## 技术栈

- 桌面框架：Tauri 2
- 前端：React + TypeScript + Vite
- UI：shadcn/ui 按需导入
- 样式：Tailwind CSS + CSS variables
- 多语言：i18next + react-i18next
- 后端：Rust + Tauri commands
- 配置：MVP 使用 Tauri app config JSON
- 测试：Vitest / Testing Library / Rust tests

初始化项目时应优先选择稳定、主流、维护良好的依赖。新增第三方库前必须检查项目中是否已有等价能力，避免重复造轮子。

## 产品范围

MVP 必须支持：

- 添加、编辑、删除代理配置。
- 代理类型：`http_proxy`、`https_proxy`、`ALL_PROXY`。
- 每种代理类型可保存多个配置，但同一类型同一时间只能启用一个。
- 不同代理类型之间可以同时启用。
- 全局 `no_proxy` 设置。
- 启动时扫描现有 profile 代理配置并提示导入。
- macOS/Linux 支持 `.zshrc`、`.bashrc`。
- Windows 支持 PowerShell profile。
- 主题：浅色、深色、跟随系统。
- 开机自动启动。
- 多语言：简体中文、英文、日语、繁体中文。

MVP 不做：

- 不直接修改系统级网络代理。
- 不实现云同步。
- 不实现系统托盘快速切换，除非后续明确加入。
- 不实现 AI provider、MCP、session、usage tracking 等与终端代理无关的功能。
- 不在客户端硬编码密钥、令牌或敏感信息。

## 架构边界

### 前端职责

React 层只负责：

- UI 渲染。
- 表单校验。
- 交互状态。
- 调用 typed Tauri API wrapper。
- i18n、主题、响应式布局。

React 层不得直接处理：

- 用户 profile 路径。
- 文件系统读写。
- Shell 脚本生成。
- PowerShell 语法。
- macOS/Linux/Windows 平台差异。

### Rust/Tauri 职责

Rust 层负责：

- Tauri commands。
- 代理配置持久化。
- profile 扫描和导入候选生成。
- profile marker 插入和移除。
- 托管脚本生成。
- 原子写入。
- 平台路径和 Shell 适配。
- 自启等桌面能力。

建议 Rust 模块边界：

```text
src-tauri/src/
  commands/
  services/
  models/
  storage/
  shell/
  profile/
  import_scanner/
  system_proxy/
```

`commands` 只做 API 层参数校验和 service 调用；业务规则放在 `services`；Shell 和平台差异放在 adapter 中。

## 前端目录建议

按功能组织，不按文件类型堆叠：

```text
src/
  app/
  features/
    proxies/
    settings/
    import/
  shared/
    ui/
    i18n/
    tauri/
    lib/
    types/
```

规则：

- `features/proxies` 管理代理列表、表单、启用开关。
- `features/settings` 管理主题、语言、自启、全局 `no_proxy`、Shell 集成状态。
- `features/import` 管理启动扫描结果和导入确认。
- `shared/ui` 只放 shadcn/ui 和少量项目级基础组件。
- `shared/tauri` 封装 typed Tauri API，不在组件里直接散落 `invoke`。
- `shared/i18n` 管理翻译资源和初始化。

## 代理模型

代理类型：

```ts
type ProxyKind = "http_proxy" | "https_proxy" | "ALL_PROXY";
```

代理协议：

```ts
type ProxyScheme = "http" | "https" | "socks4" | "socks5";
```

代理配置：

```ts
type ProxyConfig = {
  id: string;
  name: string;
  kind: ProxyKind;
  scheme: ProxyScheme;
  host: string;
  port: number;
  username?: string;
  password?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
```

注意：

- `no_proxy` 是全局设置，不属于单条代理配置。
- MVP 允许用户名和密码明文保存到 app config JSON，但 UI 不应默认明文展示密码。
- 后续应预留迁移到 macOS Keychain、Windows Credential Manager、Linux Secret Service 的接口。

## Profile 写入规则

必须采用最小侵入策略。

macOS/Linux profile 只插入受控 marker：

```sh
# >>> term-proxy initialize >>>
[ -f "$HOME/.term-proxy/proxy.sh" ] && source "$HOME/.term-proxy/proxy.sh"
# <<< term-proxy initialize <<<
```

Windows PowerShell profile 只插入受控 marker：

```powershell
# >>> term-proxy initialize >>>
$termProxyProfile = Join-Path $HOME ".term-proxy\proxy.ps1"
if (Test-Path $termProxyProfile) { . $termProxyProfile }
# <<< term-proxy initialize <<<
```

实际代理变量写入托管文件：

- macOS/Linux：`~/.term-proxy/proxy.sh`
- Windows：`~/.term-proxy/proxy.ps1`

安全要求：

- 不得删除、重排或改写 marker 外的用户 profile 内容。
- 重复运行集成时不得重复插入 marker。
- 托管文件由应用完整重写，写入必须使用临时文件 + rename 的原子写入策略。
- URL、用户名、密码、路径必须按目标 Shell 正确转义。
- 关闭代理只更新托管文件，不删除 profile marker。
- “移除集成”只删除受控 marker，不删除用户其他配置。

## 导入规则

启动时扫描：

- `~/.zshrc`
- `~/.bashrc`
- PowerShell `$PROFILE`

识别：

- `export http_proxy=...`
- `export https_proxy=...`
- `export ALL_PROXY=...`
- `$env:http_proxy = "..."`
- `$env:https_proxy = "..."`
- `$env:ALL_PROXY = "..."`

导入规则：

- 只生成候选，不自动迁移。
- 用户确认后才写入 app config。
- 默认不注释、不删除用户原始 profile 行。
- 如果未来支持注释旧行，必须单独确认并可回滚。

## UI 与审美要求

设计方向：简约、精致、克制、高可信的 product UI。

要求：

- 首屏必须是可用工具界面，不做 landing page。
- 使用 shadcn/ui 按需导入，但不能保留默认模板感。
- 主题使用 OKLCH CSS variables。
- 主色使用克制 moss/olive 方向，只用于主要操作、当前选择和启用状态。
- 不使用 AI 紫色渐变、玻璃拟态、装饰性光斑、过度阴影。
- 卡片只用于代理条目、导入候选、设置分组，禁止卡片套卡片。
- 环境变量、路径、代理 URL 使用 mono 字体，并提供复制能力。
- 控件必须有 default、hover、focus、active、disabled、loading、error 状态。
- 动效只服务于状态反馈，必须支持 `prefers-reduced-motion`。

应用布局建议：

- 顶部状态栏：应用名、集成状态、主题/语言/设置入口。
- 代理类型切换：`http_proxy`、`https_proxy`、`ALL_PROXY`。
- 代理列表：名称、协议、host、port、启用开关、编辑、删除。
- 编辑面板：名称、类型、scheme、host、port、用户名、密码。
- 设置页：主题、语言、开机自启、全局 `no_proxy`、Shell 集成、移除集成。
- 导入页：显示扫描候选，用户确认后导入。

## 多语言规则

使用 `i18next` + `react-i18next`。

语言资源：

```text
src/shared/i18n/locales/
  zh-CN.json
  en.json
  ja.json
  zh-TW.json
```

规则：

- 所有可见文本必须使用翻译 key。
- 表单错误、toast、空状态、导入提示、系统错误都必须国际化。
- 默认语言跟随系统，用户设置后覆盖系统语言。
- 布局必须兼容英文和日文较长文本，不得出现按钮文字溢出。

## 注释规范

使用中文注释，方便后续维护。

应该注释：

- 跨平台差异原因。
- profile marker 处理策略。
- Shell/PowerShell 转义逻辑。
- 原子写入和回滚逻辑。
- 兼容性判断。

不应该注释：

- 显而易见的 JSX。
- 变量赋值。
- 简单 getter/setter。
- 与代码不同步的解释性废话。

注释重点解释“为什么”，不要重复“做什么”。

## 错误处理

所有异步操作必须捕获错误，并向用户提供可理解反馈。

Rust 错误应使用结构化错误类型，返回给前端时包含：

- 错误 code。
- 用户可读 message key。
- 可选 details。
- 可选 platform/shell/profile path 上下文。

前端显示：

- 表单错误内联展示。
- 写入失败使用 alert/toast 并保留重试入口。
- 部分成功必须明确指出哪个 Shell 成功、哪个失败。

## 测试与验证

关键逻辑必须有测试。

Rust 侧至少覆盖：

- 代理 URL 生成。
- 用户名/密码转义。
- `http_proxy`、`https_proxy`、`ALL_PROXY` 单选启用规则。
- zsh/bash/PowerShell 托管脚本生成。
- profile marker 插入、去重、移除。
- import scanner 解析。
- 原子写入失败处理。

前端至少覆盖：

- 代理表单校验。
- 代理类型切换。
- 启用开关自动关闭同类型其他配置。
- 导入候选确认流程。
- 主题切换。
- 语言切换。
- 错误和空状态。

完成变更前尽量运行：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
cargo fmt --check
cargo clippy
cargo test
```

如果项目脚手架还未提供某些命令，必须在最终回复里说明未运行原因。

## 跨平台要求

任何涉及路径、profile、Shell 语法、换行符、权限、自启、打包的代码都必须考虑三端差异。

macOS：

- 默认 shell 可能是 zsh。
- 需要关注 `.zshrc` 和 `.bashrc`。
- 后续打包需考虑签名、公证、自启权限。

Linux：

- 默认 shell 可能是 bash 或 zsh。
- 发行版和桌面环境差异较大。
- 后续打包需考虑 `.deb`、`.rpm`、AppImage。

Windows：

- 使用 PowerShell profile。
- 注意 `Documents/PowerShell/Microsoft.PowerShell_profile.ps1` 路径。
- 注意 CRLF、路径分隔符和 PowerShell 执行策略。
- 后续打包需考虑 MSI/NSIS。

禁止在业务逻辑中用单一平台假设写死路径或语法。

## 安全要求

- 不在代码中硬编码敏感信息。
- 用户输入在写入脚本前必须校验和转义。
- 不直接插入未转义 HTML。
- 不保留生产调试 `console.log`。
- MVP 明文保存代理密码是已知取舍，必须在设置或文档中明确；后续迁移系统凭据存储。

## 提交规范

使用 Conventional Commits：

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`

提交前自查：

- 类型检查是否通过。
- 测试是否通过。
- 构建是否通过。
- 是否有无关格式化或元数据改动。
- 是否误改用户 profile 或真实本机配置。

## 重要文档

- 产品上下文：`PRODUCT.md`
- 视觉系统：`DESIGN.md`
- 设计规格：`docs/superpowers/specs/2026-06-26-term-proxy-design.md`

后续开发前优先阅读这些文件，保持产品范围、审美和工程边界一致。
