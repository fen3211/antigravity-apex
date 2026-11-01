[English](CONFIGURATION.md) • [Русский](CONFIGURATION.ru.md) • [简体中文](CONFIGURATION.zh.md) • [日本語](CONFIGURATION.ja.md) • [Deutsch](CONFIGURATION.de.md)

# 設定リファレンス

本文書は、**Antigravity Apex** のすべての静的環境変数および実行時動的設定オプションに関する網羅的なリファレンスです。

---

## 1. 環境変数 (`.env`)

Antigravity Apex は、起動時に `dotenv` を介して `.env` を読み込みます。すべてのパラメータには、そのまま本番運用可能なデフォルト値が設定されています。

### サーバーネットワーク＆ランタイム設定

| 変数名 | 型 | デフォルト値 | 説明 |
|--------|----|--------------|------|
| `PORT` | `number` | `3001` | Express サーバーおよび WebSocket がリッスンする HTTP ポート番号。 |
| `HOST` | `string` | `127.0.0.1` | バインドするネットワークインターフェース。安全のため既定ではローカルループバックに制限。 |
| `NODE_ENV` | `string` | `development` | 実行環境モード。本番運用時は `production` を指定しキャッシュ有効化＆詳細ログ抑制。 |

### セキュリティ＆認証

| 変数名 | 型 | デフォルト値 | 説明 |
|--------|----|--------------|------|
| `COMMAND_CENTER_API_KEY` | `string` | *(自動生成)* | すべての書き込み REST エンドポイントおよび WebSocket 接続に必要な 32 バイト（64文字）の暗号トークン。未設定時は初回起動時に自動生成され `.env` に書き込まれます。 |

### Antigravity ファイルシステムパス設定

通常、パスはユーザーのホームディレクトリ（`~/.gemini/antigravity`）を基準に自動解決されます。必要に応じて個別に上書き可能です：

| 変数名 | Windows 既定値 | Linux / macOS 既定値 | 説明 |
|--------|----------------|----------------------|------|
| `ANTIGRAVITY_DIR` | `%USERPROFILE%\.gemini\antigravity` | `~/.gemini/antigravity` | Google Antigravity 本体のインストール先ディレクトリ。 |
| `KNOWLEDGE_DIR` | `%USERPROFILE%\.gemini\antigravity\knowledge\ai-director` | `~/.gemini/antigravity/knowledge/ai-director` | AI Director の規程・ナレッジ文書が格納されるディレクトリ。 |
| `PRESENCE_DIR` | `%USERPROFILE%\.gemini\antigravity\presence` | `~/.gemini/antigravity/presence` | 稼働中セッションのロックファイル（`.lock`）が配置されるディレクトリ。 |
| `BRAIN_DIR` | `%USERPROFILE%\.gemini\antigravity\brain` | `~/.gemini/antigravity/brain` | サブエージェントの実行記録（`transcript.jsonl`）が保存されるディレクトリ。 |
| `AGY_CLI_PATH` | `%LOCALAPPDATA%\agy\bin\agy.exe` | `/usr/local/bin/agy` | Antigravity CLI 実行可能バイナリの物理パス。 |
| `DB_PATH` | `./command_center.sqlite` | `./command_center.sqlite` | ローカル SQLite データベースファイルの保存先。 |

---

## 2. 動的運用設定 (Runtime Settings API)

`.env` に加え、Antigravity Apex は動的な運用ポリシーを SQLite の `settings` テーブルで保持しています。これらは管理画面（**Control Center**）または REST API から変更可能です：

- **エンドポイント**: `GET /api/control/settings` および `POST /api/control/settings`
- **認証**: ヘッダーまたはクエリパラメータに `COMMAND_CENTER_API_KEY` が必要。

### スキーマと初期設定例

```json
{
  "maxConcurrentAgents": 3,
  "maxRetryAttempts": 2,
  "defaultModelTier": "gemini-3.8-flash-high",
  "escalationPolicy": "strict",
  "autoQualityGates": true,
  "allowedAgents": [
    "director",
    "researcher",
    "frontend-developer",
    "backend-developer",
    "ui-ux-designer",
    "qa-engineer",
    "code-reviewer",
    "senior-architect",
    "legal-compliance",
    "security-engineer",
    "devops-engineer",
    "product-manager",
    "ai-evaluation-engineer",
    "performance-engineer",
    "accessibility-specialist",
    "database-specialist",
    "data-engineer"
  ]
}
```

### パラメータ解説

1. `maxConcurrentAgents` (整数, 1–10):
   プロセス監視機構が同時に起動できるサブエージェントの最大数。推奨値: 通常 `3`、最大 `6`。
2. `maxRetryAttempts` (整数, 1–10):
   同一アプローチでの最大再試行回数。これを超えると Senior Architect への Level 3 エスカレーションが発動。デフォルト: `2`。
3. `defaultModelTier` (文字列):
   新規タスクに割り当てられるデフォルトの Gemini モデル階層。通常は `gemini-3.8-flash-high`。
4. `escalationPolicy` (`"strict"` | `"relaxed"`):
   - `"strict"`: 2回連続失敗で直ちにタスクをロックし、Argon プロンプトパックを生成。
   - `"relaxed"`: エスカレーション前にもう1回の試行を許可。
5. `autoQualityGates` (真偽値):
   `true` の場合、サブエージェントレポート提出時に Gate 1 自動チェックを自動トリガー。
6. `allowedAgents` (文字列配列):
   起動を許可するエージェント ID の厳格なホワイトリスト。不正なエージェントの実行を遮断。

---

## 3. CORS＆オリジンホワイトリスト

バックエンドは `CONFIG.ALLOWED_ORIGINS` により、クロスオリジン要求を厳格に制限しています：

```typescript
ALLOWED_ORIGINS: [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
]
```

未許可のオリジンからのリクエストは **HTTP 403 Forbidden** で即座に拒否されます。フロントエンドを独自ポートやホスト名で実行する場合は、`server/src/config.ts` にオリジンを追加してください。

---

## 4. WebSocket 運用仕様

WebSocket サーバー（`ws://127.0.0.1:3001/ws`）は耐障害性維持のため制限を設けています：

- **最大メッセージサイズ**: `64 KB` (`MAX_WS_PAYLOAD = 64 * 1024`)。この上限を超える単一フレームを受信した場合、クローズコード `1009 (Message too large)` と共に接続が即座に切断されます。
- **ハートビート間隔**: 30 秒。クライアントは `ping` 受信時に `pong` フレームを応答する必要があります。無応答の接続は破棄されます。
- **認証方式**: 以下のいずれかによりトークンを渡す必要があります：
  - クエリパラメータ: `?token=<API_KEY>`
  - ヘッダー: `Authorization: Bearer <API_KEY>`
  - ヘッダー: `x-api-key: <API_KEY>`

---

## 5. ファイル監視フィルター定義 (Chokidar)

ファイル監視は `createAntigravityPathFilter(brainDir, presenceDir)` によって制御されます：

### 監視対象（ホワイトリスト）：
- `PRESENCE_DIR` 配下の `.lock` で終わるファイル。
- `BRAIN_DIR` 配下の `.system_generated/logs/` 内にある `transcript.jsonl` ファイル。

### 除外・無視対象（ブラックリスト）：
- 一時ファイル：`.tmp`, `.swp`, `~*`, `.bak`, `~$*`, `.crdownload`。
- ドットから始まる隠しファイル・ディレクトリ（`.system_generated` を除く）。
- 重いビルドおよびキャッシュディレクトリ：`node_modules`, `.git`, `dist`, `scratch`, `tempmediaStorage`, `.user_uploaded`。
