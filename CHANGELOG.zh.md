# 更新日志 (Changelog)

[English](CHANGELOG.md) • [Русский](CHANGELOG.ru.md) • [Español](CHANGELOG.es.md) • [Français](CHANGELOG.fr.md) • [Português](CHANGELOG.pt.md) • [简体中文](CHANGELOG.zh.md) • [日本語](CHANGELOG.ja.md) • [Deutsch](CHANGELOG.de.md)

**Antigravity Apex** 项目的所有重要变更均记录在此文件中。

本项目格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，并严格遵守 [语义化版本规范 (Semantic Versioning)](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2026-11-01

### 首次开源公开发布 (Initial Open Source Release)

**Antigravity Apex** 的首个生产级公开发布版本 —— 专为 Google Antigravity 与 **AI Development Director** 框架量身打造的多智能体任务调度中心与实时遥测系统。

### 新增功能 (Added)

#### 1. 多智能体编排与 17 角色专家池
- 全面支持 17 种专业工程角色分工：
  - **核心角色**：`director`（Gemini 3.8 Flash High 架构协调）、`researcher`（Flash 调研）、`frontend-developer`（Flash 前端）、`backend-developer`（Flash 后端）、`ui-ux-designer`（Flash 设计）、`qa-engineer`（Flash 测试）、`code-reviewer`（Flash 审查）、`senior-architect`（Pro 级系统架构师）、`legal-compliance`（Flash 法规与技术文档）。
  - **垂直专家**：`security-engineer`（安全工程师）、`devops-engineer`（运维工程）、`product-manager`（产品经理）、`ai-evaluation-engineer`（AI 评测）、`performance-engineer`（性能优化）、`accessibility-specialist`（无障碍访问）、`database-specialist`（数据库专家）、`data-engineer`（数据工程）。
- 动态并发控制：支持最高 6 个并行子智能体并发执行（`MAX_CONCURRENT_SUBAGENTS = 6`），默认并发数为 3，同时对高负载 Pro 级模型执行最多 2 个的并发限额。
- 自动队列调度机制，支持 `QUEUED`、`STARTING`、`RUNNING`、`COMPLETED`、`FAILED`、`CANCELLED` 与 `TIMEOUT` 全生命周期状态跟踪。

#### 2. Gemini 4 Argon 智能四级上报引擎 (Level 4 Escalation)
- 完整实现 Argon 架构级问题上报协议：
  - 自动侦测单途径下的连续 2 次失败尝试。
  - 自动平滑晋级至 **第 3 级：高级系统架构师 (Pro Tier)**。
  - 面对顽固架构僵局时，自动提取最小复现上下文并脱敏隐私路径与 Token 密钥，生成标准的 18 点式 **Argon Prompt Pack**。
  - 基于 SHA-256 签名的 5 分钟防刷冷却与驳回记忆库。
  - 闭环解决方案反向注回端点（`POST /api/escalations/:id/response`），由 Director 自动解析并将任务下发给 Flash 专家执行。

#### 3. 多级质量控制网关与 9 点式技术报告协议
- **Gate 1 (L1 自检网关)**：执行本地单元测试、Linter 校验，强制执行 9 点式结构化报告。
- **Gate 2 (L2 独立审查网关)**：由 `qa-engineer` 与 `code-reviewer` 执行双重客观验收。
- **Gate 2b (合规法务网关)**：针对个人数据、AI 生成规范、网络爬虫及开源协议进行合规审查，遵循非阻塞安全设计。

#### 4. 零磁盘冗余读取的高性能日志增量流解析器
- 内置 `JsonlStreamReader` 引擎，以 64 KB 分块增量读取 Antigravity 运行日志（`transcript.jsonl`），完美保障多字节 UTF-8 字符（中文及表情符号）截断安全。
- 追踪文件 inode、尺寸与修改时间，即时响应日志文件轮转与截断。
- 基于 SHA-256 计算事件确定性哈希 ID，保证 SQLite 数据库零重复入库。

#### 5. 实时遥测、在线心跳与 Antigravity 桥接
- 实时侦测活跃进程锁（`~/.gemini/antigravity/presence/*.lock`）。
- 严格区分实测 **LIVE** Token 与估算 **ESTIMATED** Token。
- 交互式知识库文件管理器（`Memory Explorer`）。

#### 6. Refero / Vercel 极简工程美学与深浅双主题
- 提供浅色纸质白（`#FAFAFA`）与深色曜石黑（`#0A0A0A`）双模式。
- 内联脚本消除主题闪烁（Zero FOUT），支持 WCAG 2.1 AA 级对比度。

#### 7. 一键全自动安装生态系统 (1-Click Ecosystem)
- **Windows 原生独立安装器**：[`Antigravity-Apex-Setup.exe`](https://github.com/fen3211/antigravity-apex/releases/latest/download/Antigravity-Apex-Setup.exe) (v1.0.0) —— 无需控制台与 Git 的零门槛一键式安装。
- **桌面双击启动脚本**：[`setup.cmd`](setup.cmd) / [`setup.bat`](setup.bat) 与 [`setup.sh`](setup.sh)。
- **日常快速启动器**：[`start.cmd`](start.cmd) / [`start.bat`](start.bat) 与 [`start.sh`](start.sh)。
- **17 智能体部署脚本**：[`scripts/install.ps1`](scripts/install.ps1) 与 [`scripts/install.sh`](scripts/install.sh)。
- **系统诊断工具 Doctor**：[`scripts/doctor.js`](scripts/doctor.js)（`npm run doctor`）执行 19 项全自动系统体检。
- **终端远程一键命令**：[`scripts/get.ps1`](scripts/get.ps1) 与 [`scripts/get.sh`](scripts/get.sh)。
- **网页端内置同步按钮**：导航栏一键安装 `⚡ 1-Click Setup` 与智能体列表一键同步。
- **云端沙箱容器**：[`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json)。

#### 8. 八种语言全功能多语言国际化 (i18n)
- 仪表盘与技术文档全面支持 8 种国际主流语言：
  - 🇬🇧 英语 (English - 主语言 / 默认)
  - 🇷🇺 俄语 (Русский)
  - 🇪🇸 西班牙语 (Español)
  - 🇫🇷 法语 (Français)
  - 🇵🇹 葡萄牙语 (Português)
  - 🇨🇳 简体中文 (Chinese)
  - 🇯🇵 日语 (日本語)
  - 🇩🇪 德语 (Deutsch)
- 导航栏语言快速切换下拉菜单，带国旗标识与即时状态响应。
- 设置中心（`ControlCenter`）语言卡片面板，自动同步保存至 `localStorage`。
- 全套文档完成 8 语种高保真平行翻译与相互跳转。
