[English](FAQ.md) • [Русский](FAQ.ru.md) • [简体中文](FAQ.zh.md) • [日本語](FAQ.ja.md) • [Deutsch](FAQ.de.md)

# 常见问题与解答 (FAQ)

本文档解答关于 **Antigravity Apex** 的各类常见技术、系统架构与日常运维疑问。

---

## 1. 概述与系统架构

### 什么是 Antigravity Apex？
Antigravity Apex 是专为 **Google Antigravity** 多智能体环境与 **AI Development Director** 编排调度体系打造的本地企业级任务指挥控制中心与运维监视器。它为开发者提供自主子智能体运行状态、活跃会话、实时 Token 消耗和多级质量门禁的集中式全景透明度。

### Antigravity Apex 会取代 Antigravity CLI 或 IDE 吗？
不会。Antigravity Apex 与 Antigravity 协同工作，作为上层的全局运维监管层。Antigravity 负责在沙箱工作区中执行具体的代码编写与工具调用；Antigravity Apex 则负责监视执行轨迹、调度并发限制、裁决质量门禁以及在死锁时管理向 Level 4 Argon 的自主升级。

### 本机未安装 Antigravity 时可以使用 Antigravity Apex 吗？
可以。Antigravity Apex 采用完全解耦设计。若未检测到 Antigravity 运行，控制台将自动进入离线管理模式，支持本地任务追踪、Director 知识库在线编辑与模拟遥测调试。

### 支持哪些操作系统？
Antigravity Apex 经过全面测试，原生支持：
- **Windows 10 / 11** (64 位)
- **macOS 12+** (支持 Apple Silicon M 系列芯片与 Intel 芯片)
- **Linux** (Ubuntu 22.04+、Debian 11+、Fedora 38+、Arch Linux 等常见发行版)

---

## 2. 并发性能与底层机制

### 最多支持多少个子智能体同时并行运行？
系统架构最多支持 **6 个并发子智能体** (`MAX_CONCURRENT_SUBAGENTS = 6`)。默认并发上限设置为 **3 个活动智能体**，以保证系统响应流畅并规避外部 API 频控。此外，针对高成本的 Pro-tier 模型，系统施加了最多 **2 个并发实例** 的硬性保护。

### 什么是“零磁盘全量读取”摄入引擎？
传统的日志监控工具在文件发生微小变动时，往往需要从头重新扫描整个日志文件。在复杂的长会话中，日志迅速增加至几十兆字节，会导致严重的磁盘 I/O 争抢与 CPU 飙升。

Antigravity Apex 的 `JsonlStreamReader` 在 SQLite 中精准持久化每个文件的读取字节偏移量（`last_offset`）。当日志追加时，仅从上次偏移点开始增量读取 64 KB 的数据块，同时具备多字节 UTF-8 跨块拼接保护，杜绝了无谓的磁盘读取。

### 运行控制台会拖慢本地代码构建与编译吗？
几乎无感知。服务端运行在轻量级 Node.js 事件循环上，结合原生 C++ 绑定的 `better-sqlite3`（WAL 模式），在待机时 CPU 占用小于 1%，内存常驻仅约 60 MB。

---

## 3. 模型路由与 Token 成本

### 系统支持哪些 Google Gemini 模型？
系统按照角色职责分派给 Google Gemini 家族的不同模型：
- **Gemini 3.8 Flash High**：Director 总指挥、任务分诊与质量合规仲裁。
- **Gemini Flash (Medium/Low)**：高速、低成本的标准研发（前端、后端、QA、代码审查、技术调研等日常实施）。
- **Gemini Pro**：深度架构设计、复杂竞态排查（Level 3 Senior Architect）。
- **Gemini 4 Argon**：针对致命死锁在封闭回路中启用的旗舰级推理模型（Level 4）。

### LIVE 与 ESTIMATED Token 指标有什么区别？
- **LIVE**：直接从已校验的 Antigravity 运行转录文件（`transcript.jsonl`）中实时提取的精确值，客观反映自主任务实际消耗的输入、输出和缓存读取 Token。
- **ESTIMATED**：对于在实时会话外手工创建的任务，系统基于历史均值推算的预计消耗量。

### 为什么将 Gemini 4 Argon 置于“封闭回路 (Closed Contour)”？
Gemini 4 Argon 是能力极强的顶尖推理模型，专为攻坚架构级死锁而设。为防止 Token 意外失控与未经深思熟虑的代码篡改：
1. 它绝不因偶发轻微错误触发（必须经历 2 次不同方案失败且无法解决）。
2. 它仅接收经过严格清洗与脱敏的 **18 点提示词包**（包含 20–50 行极简隔离复现用例）。
3. 由操作人员手动切换至 Argon 环境执行诊断。
4. Argon 输出的不是直接提交的代码，而是架构诊断结论与裁决策略，随后重新交由 Flash 专家进行代码实施。

---

## 4. 质量门禁与法律合规

### 技术子智能体 9 点标准报告包含哪些内容？
所有技术专家在完成任务时必须提交以下 9 个要点，否则无法通过 Gate 1：
1. `taskName`（任务名称）
2. `status`（状态：`SUCCESS`、`FAILURE`、`BLOCKED`）
3. `summary`（工作摘要）
4. `modifiedFiles`（修改的文件列表）
5. `executedChecks`（执行的检查命令）
6. `checkResults`（真实的检查结果输出）
7. `issuesAndRisks`（已知问题与风险）
8. `pendingItems`（超范围未结事项）
9. `nextSteps`（后续步骤）

报告若仅口头宣称“全部通过”而无真实测试框架执行结果，会被系统直接驳回。

### 什么是质量门禁 2b（法律合规门禁）？
Gate 2b 在代码实施或发布前，自动化审查方案是否符合 **俄罗斯联邦** (`RU`) 与 **欧盟** (`EU_NL`) 的强制性法定法规：
- 俄罗斯法律：152-FZ（个人数据法）、156-FZ（隔离同意书）、23-FZ（数据库境内首录）、149-FZ（信息法与 ORI 名录）、243-FZ（人工智能法）、民法典第四部分（著作权）、38-FZ/479-FZ（广告法与 3% 专项扣除）、2300-1 法与 69-FZ（禁止电商暗模式）、54-FZ（在线收银系统）。
- 欧盟法律：GDPR（2016/679 规则）、欧盟人工智能法案（EU AI Act 2024/1689）、ePrivacy 指令。

### 法律合规门禁能替代专业人类律师吗？
不能。Gate 2b 是一套自动化的工程技术合规扫描器，旨在软件研发周期的最早期识别明显的法定违规行为。对于高危操作（判定为 `RED` 或涉及复杂的跨境数据传输），门禁结论会明确建议咨询执业专业律师。

### 遇到 `RED` 状态时的“非阻塞隔离特性”是什么意思？
当法律门禁将某个违规行为判定为 `BLOCKED_RED` 时，系统 **仅阻断涉及合规风险的特定技术子任务**（例如未本地化的个人数据直传）。而安全的并行任务（如 UI 界面美化、设计规范提取、单元测试编写、无障碍适配）均不受影响，继续正常交付。

---

## 5. 定制化与扩展

### 我可以向 17 角色池中添加自定义新角色吗？
完全可以。添加自定义专家的步骤：
1. 在 `~/.gemini/config/plugins/ai-director/agents/<role-id>.md` 中创建对应的 Markdown 角色定义文件。
2. 在控制台 **Control Center** 的允许列表中添加该角色 ID，或调用 `POST /api/control/settings`。
3. 新角色将即刻显示在 **Agent Management** 看板中，可用于任务分配。

### 如何将 Antigravity Apex 部署在远程服务器上？
在 `.env` 中设置 `HOST=0.0.0.0`，并在 `server/src/config.ts` 的 `CONFIG.ALLOWED_ORIGINS` 中添加允许访问的域名。客户端在请求标头中附带 `Authorization: Bearer <API_KEY>` 即可实现远程安全访问。
