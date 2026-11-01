# インストール＆環境構築ガイド

[English](INSTALLATION.md) • [Русский](INSTALLATION.ru.md) • [简体中文](INSTALLATION.zh.md) • [日本語](INSTALLATION.ja.md) • [Deutsch](INSTALLATION.de.md)

本ガイドでは、**Windows**、**macOS**、**Linux** 環境における **Antigravity Apex** の詳細なインストール手順、1クリック起動ツールの使い方、ターミナルワンライナー、および手動セットアップ手順を解説します。

---

## ⚡ 1クリック高速セットアップ

### Windows 1クリック セットアップ
1. 本リポジトリをダウンロードまたはクローンします。
2. プロジェクト直下の [`setup.cmd`](../setup.cmd)（または [`setup.bat`](../setup.bat)）をダブルクリックします。
3. スクリプトが自動的に全依存関係をインストールし、17エージェントの構成を `~/.gemini/config/plugins/ai-director` へ配置、`doctor.js` を実行、サーバーを起動し、ブラウザで `http://127.0.0.1:5173/` を開きます。

### Linux / macOS 1クリック セットアップ
```bash
chmod +x setup.sh && ./setup.sh
```

### リモートワンライナー（クローン不要）
- **Windows (PowerShell)**:
  ```powershell
  irm https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.ps1 | iex
  ```
- **Linux & macOS (Bash)**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash
  ```

---

## 1. システム要件と前提条件

### 最小動作要件
- **Node.js**: `v18.0.0` 以上（Node.js v20.x LTS および v24.x で動作確認済み）。
- **npm**: `v9.0.0` 以上。
- **メモリ (RAM)**: 最低 2 GB（サブエージェントの並行処理には 4 GB 以上を推奨）。
- **ディスク空き容量**: 依存関係およびローカル SQLite データベース用に 200 MB 以上。
- **対応オペレーティングシステム**:
  - Windows 10/11 (64ビット)
  - macOS 12+ (Apple Silicon または Intel)
  - Ubuntu 22.04+ / Debian 11+ / Fedora 38+ / Arch Linux

### Antigravity 環境（推奨・任意）
リアルタイムセッションとテレメトリの完全監視を行う場合：
- ローカル環境に Google Antigravity がインストールされていること。
- 標準ワークスペースディレクトリが `~/.gemini/antigravity/`（Windows では `%USERPROFILE%\.gemini\antigravity`）に存在すること。
- Antigravity CLI 実行可能ファイル `agy.exe`（Windows では通常 `%LOCALAPPDATA%\agy\bin\agy.exe`）。

> [!NOTE]
> Antigravity が未導入または停止している場合でも、Antigravity Apex は単体で完全に動作します。その場合、オフラインタスク管理、ローカルデータベース保存、シミュレートされたテレメトリ監視として機能します。

---

## 2. 手動ステップバイステップ インストール

### ステップ 1: リポジトリのクローン
```bash
git clone https://github.com/fen3211/antigravity-apex.git
cd antigravity-apex
```

### ステップ 2: バックエンド依存パッケージのインストール
```bash
npm install
```

### ステップ 3: フロントエンドクライアントの依存パッケージインストール
```bash
npm --prefix client install
```

### ステップ 4: 環境変数ファイルの作成
テンプレート `.env.example` をコピーして `.env` を作成します：

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

初回のサーバー起動時に `COMMAND_CENTER_API_KEY` が未設定の場合、32バイトのセキュアな暗号トークンが自動生成され、`.env` に保存されます。

### ステップ 5: Antigravity エージェントとスキルの配置
17のエージェント定義、運用ルール、スキルを Antigravity 環境へ配置します：

**Windows (PowerShell):**
```powershell
.\scripts\install.ps1 -Force
```

**macOS / Linux:**
```bash
./scripts/install.sh --force
```

---

## 3. データベースの初期化

SQLite データベース（`command_center.sqlite`）は、サーバー起動時に自動初期化されます。

データベースの主要仕様：
- **エンジン**: C++ ネイティブバインディングを採用した `better-sqlite3`。
- **ジャーナルモード**: **WAL (Write-Ahead Logging)** モードを標準採用。読み取りロックを排除し、並行性能と原子的な書き込みを両立。
- **プラグマ**: 高スループットなログ読み込み時のロック競合を防ぐため、`busy_timeout = 5000` を設定。
- **管理テーブル**: `tasks`, `events`, `settings`, `model_usage`, `session_token_usage`, `log_parse_state`, `legal_assessments`, `escalations`。

手動での SQL マイグレーション実行は不要です。

---

## 4. 診断ドクター (`npm run doctor`)

環境の整合性をいつでもチェックできます：

```bash
npm run doctor
```

診断項目：
- Node.js および npm のランタイムバージョン
- Git の利用可否およびブランチ状態
- SQLite WAL モードおよびテーブルスキーマの健全性
- 17の全専門エージェント定義ファイルの存在確認
- オーケストレーションルールおよびスキル（`director-orchestration`, `argon-escalation`）
- Antigravity のローカルディレクトリ（`brain`, `presence`, `knowledge`）

---

## 5. 動作検証とテスト実行

テストスイートを実行して環境が正常か検証します：

```bash
npm test
```

全8つのテストスイートが実行されます：
1. `tests/api.test.ts`: REST API セキュリティ、CORS、認証、CLI インジェクション防御。
2. `tests/ingestion.test.ts`: 増分ストリームリーダー、64 KB チャンク分割、ファイルローテーション保護。
3. `tests/analytics.test.ts`: LIVE と ESTIMATED のトークン指標分離およびコスト計算。
4. `tests/websocket-resilience.test.ts`: WebSocket 認証、ペイロードサイズ制限、Ping/Pong ハートビート。
5. `tests/process-supervisor.test.ts`: サブエージェントのプロセス起動、ツリー強制終了、並行性制御。
6. `tests/legal-compliance.test.ts`: 16パターンの法的シナリオを対象としたゲート2b 法令監査テスト。
7. `tests/backend-audit.test.ts`: クロスプラットフォーム探索、パストラバーサル防御、診断ドクター。
8. `tests/intelligent-argon-escalation.test.ts`: Level 4 Argon エスカレーション、18項目プロンプトパック、クールダウン機構。

---

## 6. 起動モード一覧

### モード A: 開発モード（ホットリロード対応）
```bash
npm run dev
```

### モード B: Windows 1クリック 高速起動
[`start.cmd`](../start.cmd) をダブルクリック。

### モード C: プロダクションビルド＆起動
```bash
npm run server:build
npm --prefix client run build
npm start
```
