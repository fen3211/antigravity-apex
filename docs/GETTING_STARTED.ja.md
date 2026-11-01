# Antigravity Apex クイックスタートガイド

[English](GETTING_STARTED.md) • [Русский](GETTING_STARTED.ru.md) • [简体中文](GETTING_STARTED.zh.md) • [日本語](GETTING_STARTED.ja.md) • [Deutsch](GETTING_STARTED.de.md)

**Antigravity Apex** へようこそ。本作は、**Google Antigravity** および **AI Development Director** マルチエージェントオーケストレーションフレームワークのための統合ミッションコントロールダッシュボードです。

本ガイドでは、ローカル環境の立ち上げから自律型サブエージェントの監視、9項目レポートの確認、リアルタイムテレメトリの精査まで、最初の5分間で必要な基本操作をわかりやすく解説します。

---

## 1. Antigravity Apex とは？

Google Antigravity は、自律型 AI エージェントが分離されたワークスペース内で協調してソフトウェアを構築できるようにします。しかし、フロントエンド、バックエンド、セキュリティ、テスト、法務など複数のエージェントが同時に稼働するにつれ、開発者には全体を一望できる中央管制システムが不可欠になります。

Antigravity Apex の提供価値：
- **リアルタイムの可観測性**：稼働中のエージェントセッション、実行中のサブエージェント、消費トークン数をリアルタイムで可視化。
- **動的並行制御**：最大6つのサブエージェントを安全に並行制御し、メモリ飽和や API レートリミットを防止。
- **多階層品質ゲート**：タスク承認前に、厳格な検証（Gate 1 単体テスト、Gate 2 独立レビュー、Gate 2b 法的コンプライアンス）を義務化。
- **閉ループ Argon L4 エスカレーション**：同一アプローチでの連続失敗（2回まで）を自律検知し、Gemini Pro または Gemini 4 Argon へ最小再現パッケージを用いて自動エスカレーション。

---

## 2. 5分間クイックオンボーディング

### ステップ 1: サービスの起動
ターミナルを開き、プロジェクトのルートディレクトリに移動します：

```bash
cd d:\Projects\antigravity-apex
npm run dev
```

Windows 環境では、[`start.cmd`](../start.cmd) のダブルクリック、または初期化を含む [`setup.cmd`](../setup.cmd) の実行でも即座に起動できます。

ターミナルに以下のような起動メッセージが出力されます：
```text
[ANTIGRAVITY APEX] Server running on http://127.0.0.1:3001
[ANTIGRAVITY APEX] WebSocket stream at ws://127.0.0.1:3001/ws
[ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
[ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
VITE v8.3.5 ready in 250 ms
➜  Local:   http://localhost:5173/
```

### ステップ 2: ダッシュボードを開く
ブラウザで以下の URL にアクセスします：
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

**Refero / Vercel** スタイルのインターフェースが表示され（Paper Light と Obsidian Dark の両テーマに対応）、接続ステータスが緑色の **ONLINE** と表示されます。

---

## 3. ダッシュボードの主要画面ツアー

Antigravity Apex は、複雑なマルチエージェント運用を8つの専用ビューに整理しています：

### 1. 概要 (Overview / Mission Control)
システム全体の状況を俯瞰するコックピット：
- **Director ステータス**：モデルバージョン（`Gemini 3.8 Flash High`）、アクティブセッション数、排他ファイルロック。
- **重要 KPI**：アクティブサブエージェント数、完了タスク数、全体成功率、累積トークン使用量。
- **リアルタイムテレメトリ**：エージェントの起動、完了、品質ゲート結果を伝えるイベントストリーム。
- **1-Click セットアップ**：17エージェントの全構成を Antigravity 環境へ瞬時に展開・同期。

### 2. エージェント管理 (Agent Management)
17の専門ロール一覧グリッド：
- 各ロールの現在状態（`idle` 待機中、`running` 実行中、`blocked` 停止中、`escalated` エスカレーション中）を把握。
- `~/.gemini/config/plugins/ai-director/agents/*.md` から読み込まれるプロンプト仕様と責務定義を閲覧。
- エージェント別の成功率や過去の実行履歴を追跡。
- Antigravity へのワンクリック同期を実行可能。

### 3. ワークフロー (Live Workflow)
タスクのライフサイクルを示すインタラクティブな状態遷移グラフ：
- ステージ遷移：`Director_Triage` → `Solo` / `Specialist` → `QualityGate_L1` → `Independent_L2` → `LegalGate` → `Architect_L3` → `Argon_L4` → `Approved`。
- 各ノードで現在処理中のタスクをパルスアニメーションで強調表示。

### 4. モデル分析 (Model Analytics)
トークン消費量と実行パフォーマンスの精密分析：
- モデル別内訳：**Gemini 3.8 Flash**、**Gemini Pro (Senior Architect)**、**Gemini 4 Argon**。
- 検証済みログから抽出した **LIVE** 指標と、予測値である **ESTIMATED** 指標を明確に分離表示。
- コスト試算、入力・出力・キャッシュ読み取り（cache-read）トークンのカウンター。

### 5. タスク管理 (Task Manager)
タスクの運用管理ボード：
- ステータス、優先度、担当エージェントによる柔軟な絞り込み。
- タスクの詳細、リトライ回数、エラーログの閲覧。
- タスク完了時にエージェントが提出した厳格な **9項目サブエージェントレポート** の検証。

### 6. Director ナレッジベース (Director Memory)
AI Director の共有ナレッジベースを直接閲覧・編集：
- `DIRECTOR_PROTOCOL.md`、`AGENT_REGISTRY.md`、`QUALITY_GATES.md`、`FAILURE_LOG.md` などの主要ポリシーをブラウザ上で更新。
- 保存した変更は `~/.gemini/antigravity/knowledge/ai-director/` へ即時反映。

### 7. エスカレーションセンター (Escalation Center / Gemini 4 Argon)
Level 4 エスカレーションの運用コックピット：
- 連続失敗、診断デッドロック、エージェント間の見解矛盾を自律的に検知。
- 感度モードの切り替え（`conservative` 保守的、`balanced` 標準、`aggressive` 積極的）。
- 18項目マスク済みプロンプトパックの自動生成とクリップボードコピー。
- 閉ループでの裁定入力と Flash 専門家への再割当ワークフロー。

### 8. 統合イベントストリーム (Unified Event Stream)
高スループット JSON イベントのインスペクター：
- システム内の全イベント（`agent.*`、`task.*`、`legal_gate.*`、`escalation.*`）をリアルタイム受信。
- イベント種別、エージェント ID、タスク ID でのミリ秒単位フィルタリング。
- デバッグ用の JSON ペイロード 1クリックコピー。

---

## 4. 次のステップ

管制ダッシュボードの起動が完了したら、以下のドキュメントをご活用ください：
- [**AGENTS.ja.md**](AGENTS.ja.md) — 全17専門ロールの役割とプロンプト仕様。
- [**ORCHESTRATION.md**](ORCHESTRATION.md) — タスク振り分け、並行処理ルール、品質ゲートの規程。
- `npm run doctor` を実行して、環境全体の健全性チェックを実施。
