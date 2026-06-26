# Term Proxy

[English](./README.md) · [日本語](./README.ja.md)

Term Proxy 是一个精美、小巧的跨平台桌面端应用，用来批量管理电脑里的终端代理配置。

它把过去需要手动维护的命令：

```bash
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
```

整理成一个清晰的桌面 UI。你可以保存多个代理，按类型切换启用状态，也可以随时关闭，不需要反复编辑命令行配置。

<p align="center">
  <img src="./intro/screenshots.png" alt="Term Proxy 应用截图" width="860">
</p>

## 为什么做这个

很多开发者会在本地调试、公司网络、CLI 工具、临时代理之间频繁切换。手动改 `.zshrc`、`.bashrc` 或 PowerShell profile 不难，但容易忘、容易写乱，也不方便确认当前到底哪个代理会生效。

Term Proxy 解决的是这个很具体的问题：把终端代理变成可见、可管理、可回滚的桌面操作。

它采用拓展式的 proxy 集成方式，不会接管你的 shell 配置文件。应用只会在受支持的 profile 中写入一小段受控加载块，真实代理内容由 Term Proxy 管理在 `~/.term-proxy` 目录下。

## 功能

- 管理 `http_proxy`、`https_proxy`、`ALL_PROXY`。
- 每种代理类型可以保存多个配置。
- 每种类型同一时间只允许启用一个代理。
- 通过 UI 配置主机和端口，不采集用户名和密码。
- 在设置中统一管理全局 `no_proxy`。
- 自动安装受支持 shell 的代理集成。
- 启动时读取已有 profile 中的代理配置并合并。
- 一键复制代理 URL。
- 支持浅色、深色、跟随系统主题。
- 支持英文、简体中文、日文、繁体中文。
- 支持开机自启。

当前版本管理的是终端环境变量代理，不修改系统网络代理设置。

## Shell 集成方式

Term Proxy 的目标是“少侵入、可解释、可回滚”。

在 macOS 和 Linux 上，应用会生成：

```text
~/.term-proxy/proxy.sh
```

并在 `.zshrc`、`.bashrc` 等受支持 profile 中加入受控加载块。

在 Windows PowerShell 上，应用会生成：

```text
~/.term-proxy/proxy.ps1
```

并从 PowerShell profile 中加载它。

你的 profile 仍然由你控制。Term Proxy 启用、关闭、更新代理时，只重写自己管理的脚本文件，不会在 profile 里反复堆叠 `export`。

## 技术栈

项目结构遵循官方 `create-tauri-app` 推荐方式。

- Tauri 2 / Rust
- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui 组件约定
- i18next / react-i18next
- Sonner

更多产品、设计和工程说明见 [`docs/`](./docs)。

## 开发

安装依赖：

```bash
pnpm install
```

只启动前端：

```bash
pnpm dev
```

启动桌面端应用：

```bash
pnpm tauri:dev
```

生成应用图标：

```bash
pnpm tauri:icon
```

打包桌面端应用：

```bash
pnpm tauri:build
```

## 质量检查

前端检查：

```bash
pnpm typecheck
pnpm test
pnpm build
```

Rust 检查：

```bash
pnpm cargo:fmt
pnpm cargo:test
```

## 环境要求

- Node.js 20.19+ 或 22.12+，用于 Vite 7。
- pnpm。
- 通过 `rustup` 安装的 Rust stable 工具链。
- 对应平台的 Tauri 构建依赖。

Tauri 会为当前操作系统构建原生应用。macOS、Linux、Windows 三端产物建议分别在对应系统或 CI runner 中构建。

## 项目文档

- [`docs/PRODUCT.md`](./docs/PRODUCT.md)
- [`DESIGN.md`](./DESIGN.md)
- [`AGENTS.md`](./AGENTS.md)
- [`docs/superpowers/specs/2026-06-26-term-proxy-design.md`](./docs/superpowers/specs/2026-06-26-term-proxy-design.md)

## 灵感来源

Term Proxy 的项目灵感来自 [`cc-switch`](https://github.com/farion1231/cc-switch)。本项目借鉴它在 Tauri 桌面工具、跨平台工程结构和开发者体验上的思路，但功能范围聚焦在终端代理环境变量管理。

## 开源协议

MIT。详见 [`LICENSE`](./LICENSE)。
