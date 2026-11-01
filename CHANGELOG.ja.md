# 変更履歴 (Changelog)

[English](CHANGELOG.md) • [Русский](CHANGELOG.ru.md) • [Español](CHANGELOG.es.md) • [Français](CHANGELOG.fr.md) • [Português](CHANGELOG.pt.md) • [简体中文](CHANGELOG.zh.md) • [日本語](CHANGELOG.ja.md) • [Deutsch](CHANGELOG.de.md)

**Antigravity Apex** に関するすべての重要な変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、本プロジェクトは [セマンティック バージョニング (Semantic Versioning)](https://semver.org/lang/ja/) に準拠しています。

---

## [1.0.0] - 2026-11-01

### 初期オープンソースリリース (Initial Open Source Release)

Google Antigravity および **AI Development Director** フレームワーク向けの本番品質マルチエージェント管制ダッシュボード **Antigravity Apex** の初版リリース。

### 追加機能 (Added)

#### 1. マルチエージェントオーケストレーションと17役割のエキスパートプール
- 17の専門役割を完全サポート：
  - **コア役割**：`director` (Gemini 3.8 Flash High)、`researcher` (Flash)、`frontend-developer` (Flash)、`backend-developer` (Flash)、`ui-ux-designer` (Flash)、`qa-engineer` (Flash)、`code-reviewer` (Flash)、`senior-architect` (Pro Tier)、`legal-compliance` (Flash)。
  - **ドメインエキスパート**：`security-engineer` (セキュリティ)、`devops-engineer` (DevOps)、`product-manager` (PM)、`ai-evaluation-engineer` (AI評価)、`performance-engineer` (性能改善)、`accessibility-specialist` (アクセシビリティ)、`database-specialist` (DB設計)、`data-engineer` (データエンジニア)。
- 動的同時実行制御：最大6つのサブエージェントを並行処理可能（`MAX_CONCURRENT_SUBAGENTS = 6`）、デフォルトは3、高負荷なProモデルは最大2に制限。
- 自動キュードレイン機能（`QUEUED`, `STARTING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`, `TIMEOUT`）。

#### 2. Gemini 4 Argon インテリジェント・エスカレーションエンジン (Level 4)
- Argon エスカレーションプロトコルの完全実装：
  - 同一アプローチでの2回連続失敗を自律検知。
  - **レベル3：シニアアーキテクト (Pro Tier)** への自動エスカレーション。
  - アーキテクチャの膠着状態において、秘密鍵やパスをサニタイズした18項目の **Argon Prompt Pack** を自動生成。
  - SHA-256署名による5分間のスパム防止クールダウンと却下メモリ。
  - クローズドループ解決エンドポイント（`POST /api/escalations/:id/response`）によるFlashエキスパートへの指示転送。

#### 3. マルチティア品質ゲートと9項目レポート
- **Gate 1 (L1 自己検証)**：単体テスト、リンター、9項目の構造化レポートの義務化。
- **Gate 2 (L2 独立検証)**：QAエンジニアとコードレビュアーによる独立検証。
- **Gate 2b (法的コンプライアンスゲート)**：個人情報保護、AI規制、著作権法に関する事前監査。

#### 4. ディスク負荷ゼロの増分ログストリーム解析
- 64KBバッファによる `JsonlStreamReader` で Antigravity ログ（`transcript.jsonl`）を高速増分読み込み。
- inode とタイムスタンプ追跡により、ログのローテーションや切り捨てを即時検出。
- SHA-256 ハッシュによる決定論的イベントIDで重複登録を防止。

#### 5. リアルタイムテレメトリと Antigravity ブリッジ
- プロセスロック（`~/.gemini/antigravity/presence/*.lock`）の監視。
- 実測 **LIVE** トークンと予測 **ESTIMATED** トークンの厳密な分離。
- ディレクター知識ベースの対話型エディタ（`Memory Explorer`）。

#### 6. Refero / Vercel ミニマルデザインと明暗デュアルテーマ
- ライト（Paper White `#FAFAFA`）とダーク（Obsidian Black `#0A0A0A`）の2つのテーマ。
- インラインスクリプトによる画面ちらつき（Zero FOUT）の防止、WCAG 2.1 AA 準拠。

#### 7. 1クリック簡単インストール環境
- **Windows ネイティブインストーラー**：[`Antigravity-Apex-Setup.exe`](https://github.com/fen3211/antigravity-apex/releases/latest/download/Antigravity-Apex-Setup.exe) (v1.0.0) —— コマンド入力やGit不要の自動インストール。
- **デスクトップランチャー**：[`setup.cmd`](setup.cmd) / [`setup.bat`](setup.bat) および [`setup.sh`](setup.sh)。
- **日常起動用ランチャー**：[`start.cmd`](start.cmd) / [`start.bat`](start.bat) および [`start.sh`](start.sh)。
- **17エージェント配置スクリプト**：[`scripts/install.ps1`](scripts/install.ps1) および [`scripts/install.sh`](scripts/install.sh)。
- **自己診断ツール Doctor**：[`scripts/doctor.js`](scripts/doctor.js)（`npm run doctor`）による19項目の健全性診断。
- **ターミナルワンライナー**：[`scripts/get.ps1`](scripts/get.ps1) および [`scripts/get.sh`](scripts/get.sh)。
- **Web UI 内 1 クリック同期ボタン**：ヘッダーの `⚡ 1-Click Setup`。
- **クラウド環境**：[`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json)。

#### 8. 8言語対応の多言語国際化 (i18n)
- ダッシュボードとドキュメントで8言語を完全サポート：
  - 🇬🇧 英語 (English - プライマリ / デフォルト)
  - 🇷🇺 ロシア語 (Русский)
  - 🇪🇸 スペイン語 (Español)
  - 🇫🇷 フランス語 (Français)
  - 🇵🇹 ポルトガル語 (Português)
  - 🇨🇳 簡体字中国語 (Chinese)
  - 🇯🇵 日本語 (Japanese)
  - 🇩🇪 ドイツ語 (Deutsch)
- ヘッダー内の言語切り替えドロップダウンメニュー。
- 設定画面（`ControlCenter`）の言語選択カードパネル（`localStorage` に自動保存）。
- 全ドキュメントの8言語並行展開。
