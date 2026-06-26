# Term Proxy

[English](./README.md) · [简体中文](./README.zh-CN.md)

Term Proxy は、macOS、Linux、Windows でターミナルのプロキシ設定をまとめて管理するための、小さく洗練されたデスクトップアプリです。

これまで手動で書いていたような設定:

```bash
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
```

を、保存、切り替え、無効化できるコンパクトな UI に置き換えます。

<p align="center">
  <img src="./intro/screenshots.png" alt="Term Proxy アプリのスクリーンショット" width="860">
</p>

## なぜ作るのか

開発中は、ローカルデバッグ、社内ネットワーク、CLI ツール、一時的なプロキシなどを切り替える場面がよくあります。`.zshrc`、`.bashrc`、PowerShell profile を手で編集する方法は単純ですが、忘れやすく、状態も追いづらくなります。

Term Proxy は、この作業を見える形にします。プロキシを一度登録しておけば、種類ごとに有効な設定を選ぶだけで、新しく開いたターミナルに反映されます。

統合方法は控えめです。Term Proxy は shell profile を乗っ取りません。サポート対象の profile には小さな管理済みローダーブロックだけを追加し、実際のプロキシ値は `~/.term-proxy` 配下の管理ファイルに書き込みます。

## 機能

- `http_proxy`、`https_proxy`、`ALL_PROXY` を管理。
- 種類ごとに複数のプロキシ設定を保存。
- 同じ種類では同時に 1 つだけ有効化。
- UI からホストとポートを設定。ユーザー名とパスワードは扱いません。
- グローバル `no_proxy` を設定画面で管理。
- サポート対象 shell の統合を自動で設定。
- 既存 profile のプロキシ値を読み取り、アプリの設定に統合。
- プロキシ URL をクリップボードへコピー。
- ライト、ダーク、システム連動テーマに対応。
- 英語、簡体字中国語、日本語、繁体字中国語に対応。
- OS 起動時の自動起動に対応。

現在の Term Proxy は、ターミナル環境変数としてのプロキシを管理します。OS のシステムネットワークプロキシ設定は変更しません。

## Shell 統合

Term Proxy は、拡張型のプロキシ統合を採用しています。

macOS と Linux では、アプリが次のファイルを作成します。

```text
~/.term-proxy/proxy.sh
```

そのうえで、`.zshrc` や `.bashrc` などのサポート対象 profile に管理済みローダーブロックを追加します。

Windows PowerShell では、次のファイルを作成します。

```text
~/.term-proxy/proxy.ps1
```

そして PowerShell profile から読み込みます。

profile は引き続きユーザーのものです。Term Proxy が有効化、無効化、更新を行うときに書き換えるのは、アプリが管理するスクリプトファイルだけです。

## 技術スタック

プロジェクト構造は公式の `create-tauri-app` に沿っています。

- Tauri 2 / Rust
- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui のコンポーネント規約
- i18next / react-i18next
- Sonner

詳しいプロダクト、デザイン、開発メモは [`docs/`](./docs) にあります。

## 開発

依存関係をインストールします。

```bash
pnpm install
```

Web UI だけを起動します。

```bash
pnpm dev
```

デスクトップアプリを起動します。

```bash
pnpm tauri:dev
```

アプリアイコンを生成します。

```bash
pnpm tauri:icon
```

デスクトップアプリをビルドします。

```bash
pnpm tauri:build
```

## 品質チェック

フロントエンド:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Rust:

```bash
pnpm cargo:fmt
pnpm cargo:test
```

## 必要環境

- Vite 7 用の Node.js 20.19+ または 22.12+。
- pnpm。
- `rustup` でインストールした Rust stable toolchain。
- 各 OS 向けの Tauri ビルド要件。

Tauri は現在の OS 向けにネイティブアプリをビルドします。macOS、Linux、Windows の成果物は、それぞれ対応する OS または CI runner でビルドしてください。

## プロジェクト文書

- [`docs/PRODUCT.md`](./docs/PRODUCT.md)
- [`DESIGN.md`](./DESIGN.md)
- [`AGENTS.md`](./AGENTS.md)
- [`docs/superpowers/specs/2026-06-26-term-proxy-design.md`](./docs/superpowers/specs/2026-06-26-term-proxy-design.md)

## インスピレーション

Term Proxy は [`cc-switch`](https://github.com/farion1231/cc-switch) から着想を得ています。Tauri デスクトップアプリとしての構成、クロスプラットフォームへの意識、開発者向けツールとしての使い心地を参考にしつつ、本プロジェクトはターミナルのプロキシ環境変数管理に絞っています。

## ライセンス

MIT。詳しくは [`LICENSE`](./LICENSE) を参照してください。
