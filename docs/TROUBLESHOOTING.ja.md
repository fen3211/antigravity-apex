[English](TROUBLESHOOTING.md) • [Русский](TROUBLESHOOTING.ru.md) • [简体中文](TROUBLESHOOTING.zh.md) • [日本語](TROUBLESHOOTING.ja.md) • [Deutsch](TROUBLESHOOTING.de.md)

# トラブルシューティング＆診断ガイド

本文書は、**Antigravity Apex** の運用中に発生しうる一般的な障害に対する体系的な診断手順と具体的な解決手順を提供します。

---

## 1. WebSocket 切断と「DISCONNECTED」表示

### 主な症状
- ヘッダー内の接続状態が **DISCONNECTED**（切断）または **RECONNECTING**（再接続中）になる。
- 統合イベントストリーム（Unified Event Stream）のリアルタイム更新が停止する。

### 診断手順
1. ブラウザの開発者ツール（F12）を開き、**Console** タブおよび **Network**（WS フィルター）タブのログを確認します。
2. 以下の WebSocket 切断コード（Close Code）を確認します：
   - `1008 (Policy Violation)`: 認証失敗（無効な API キー）または未許可のオリジン（CORS 拒否）。
   - `1009 (Message too large)`: 単一メッセージのサイズが上限の 64 KB を超過。
   - `1006 (Abnormal Closure)`: バックエンドプロセスの異常終了またはネットワーク断絶。

### 対処手順
- **トークンの再同期**: ブラウザで直接 `http://127.0.0.1:3001/api/auth/token` にアクセスして最新トークンを取得します。クライアントが自動で保管・再利用します。
- **オリジンの追加設定**: 独自 IP（例: `http://192.168.1.50:5173`）からアクセスしている場合、`server/src/config.ts` 内の `CONFIG.ALLOWED_ORIGINS` 配列にそのオリジンを追加してください。
- **サーバーの再起動**: バックエンドがクラッシュした場合は、ターミナルのスタックトレースを確認した上で `npm run dev` または [`start.cmd`](../start.cmd) で再起動します。

---

## 2. Antigravity セッションやログが検出されない

### 主な症状
- 別のターミナルで Antigravity が稼働しているにもかかわらず、**Overview** 画面で `0 Active Locks` や `0 Live Transcripts` と表示される。

### 診断手順
1. サーバー起動ログに出力されるベースパスを確認します：
   ```text
   [ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
   [ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
   ```
2. 対象パスがディスク上に実在するか確認します：
   - ロックファイル: `~/.gemini/antigravity/presence/`
   - トランスクリプト: `~/.gemini/antigravity/brain/**/.system_generated/logs/transcript.jsonl`

### 対処手順
- **環境変数でのパス指定**: Antigravity が標準外のパスに配置されている場合、`.env` で明示的に指定します：
  ```env
  ANTIGRAVITY_DIR=D:\CustomPath\.gemini\antigravity
  BRAIN_DIR=D:\CustomPath\.gemini\antigravity\brain
  PRESENCE_DIR=D:\CustomPath\.gemini\antigravity\presence
  KNOWLEDGE_DIR=D:\CustomPath\.gemini\antigravity\knowledge\ai-director
  ```
- **アクセス権限の確認**: Node.js を実行しているユーザーに `.gemini` フォルダの読み取り権限が付与されているか確認します。

---

## 3. サブエージェントプロセスの停止・タイムアウト

### 主な症状
- タスクが `in_progress` 状態のまま完了しない。
- プロセス監視機構から起動されたサブエージェントのログ出力が途絶える。

### 診断手順
1. ダッシュボードの **Task Manager** タブに移動します。
2. 停止しているタスクを選択し、プロセスの PID と実行詳細を確認します。

### 対処手順
- **画面上でのキャンセル**: タスク詳細ドロワー内の **Cancel Task** ボタンを押すと、スーパーバイザーが終了シグナルを送信します。
- **プロセスツリー強制終了**: プロセスが正常終了しない場合、スーパーバイザーが自動的にツリー終了を実行します。Windows では手動で以下を実行可能です：
  ```powershell
  taskkill /PID <PID> /T /F
  ```
- **タイムアウト値の延長**: 大規模なビルドや E2E テストなど長時間のタスクを実行する場合は、起動パラメータで `timeoutMs` を長めに指定します：
  ```json
  {
    "timeoutMs": 300000
  }
  ```

---

## 4. SQLite データベースのロック競合 (`SQLITE_BUSY: database is locked`)

### 主な症状
- REST API が HTTP 500 と共に `SQLITE_BUSY: database is locked` を返す。

### 診断手順
1. 外部の SQLite ビューアー（DB Browser for SQLite 等）が `command_center.sqlite` を排他モードで開いていないか確認します。
2. WAL ファイル（`command_center.sqlite-wal` および `command_center.sqlite-shm`）が存在するか確認します。

### 対処手順
- **外部ツールの終了**: 排他ロックを保持している外部のデータベース GUI ツールをすべて閉じます。
- **WAL 設定の再確認**: Antigravity Apex は WAL モードと `busy_timeout = 5000` を標準採用しています。`database.ts` を編集した場合はこの設定が維持されているか確認してください。
- **DB のリセット**: データベースファイルが修復不能な状態になった場合は、`command_center.sqlite*` 関連ファイルを削除してください。次回サーバー起動時に最新スキーマで自動再生成されます。

---

## 5. 法令ゲートが `BLOCKED_RED` を判定した場合

### 主な症状
- タスクが品質ゲート 2b で `BLOCKED_RED`（赤信号）としてブロックされる。

### 診断手順
1. タスクに添付された `LegalAssessment` オブジェクト、または `GET /api/events?type=legal_gate.blocked` を確認します。
2. `identifiedRisks`（特定されたリスク）および `mechanismOfNonCompliance`（抵触メカニズム）を精査します。

### 代表的な原因と解決策
- **感染性の高いコピーレフトライセンス**: 商用・クラウド配布リポジトリに AGPL-3.0 や GPL-3.0 のライブラリが混入している。代替として MIT、Apache-2.0、BSD ライセンスのライブラリを採用してください。
- **ロシア個人データローカライズ違反 (23-FZ)**: ロシア市民の個人データが国内サーバーに初回記録されずに国外サーバーへ送信されている。ロシア国内サーバーでの初回書き込み処理を実装してください。
- **デフォルト選択のチェックボックス (69-FZ)**: 同意フォーム等にあらかじめチェックが入っている。チェックを外し、ユーザーの能動的な選択を促す設計に変更してください。
- **非ブロッキング分離原則の確認**: `BLOCKED_RED` 発生時、**ブロックされるのは法令違反に該当するサブタスクのみ** です。UI のスタイリングやテスト作成などの安全な作業はそのまま継続できます。

---

## 6. CLI 実行の拒否 (`Agent not allowed` / `Command failed`)

### 主な症状
- コントロールセンターからタスクを実行しようとすると `error: Agent "<name>" is not allowed` または `Invalid CLI arguments` となる。

### 診断手順
1. `GET /api/control/settings` で許可済みエージェントのホワイトリストを確認します。
2. プロンプトに禁止されたシェル特殊文字（`&`, `|`, `;`, `$`, `>`, `<`, `` ` ``）が含まれていないか確認します。

### 対処手順
- エージェント ID が `settings.allowedAgents` に含まれているか確認し、未登録の場合はコントロールセンターの設定画面から追加します。
- プロンプト内からシェルのパイプやセミコロンを削除し、プレーンテキスト形式の指示を `agy.exe` に渡すようにしてください。
