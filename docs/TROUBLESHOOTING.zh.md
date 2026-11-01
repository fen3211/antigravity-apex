[English](TROUBLESHOOTING.md) • [Русский](TROUBLESHOOTING.ru.md) • [简体中文](TROUBLESHOOTING.zh.md) • [日本語](TROUBLESHOOTING.ja.md) • [Deutsch](TROUBLESHOOTING.de.md)

# 故障排查与诊断指南

本文档为运行 **Antigravity Apex** 过程中遇到的各类常见问题提供标准的诊断步骤与解决方案。

---

## 1. WebSocket 连接中断与 "DISCONNECTED" 状态

### 常见症状
- 界面顶部状态指示灯显示为红色的 **DISCONNECTED** 或黄色的 **RECONNECTING**。
- 统一事件流（Unified Event Stream）停止实时滚动刷新。

### 诊断步骤
1. 按 `F12` 打开浏览器开发者工具，检查 **Console** 与 **Network**（过滤 WS 标签页）日志。
2. 观察 WebSocket 关闭码（Close Code）：
   - `1008 (Policy Violation)`：身份认证失败（API Token 错误或缺失）或来源域未经授权（CORS 拦截）。
   - `1009 (Message too large)`：单条消息帧大小超过了 64 KB 的保护上限。
   - `1006 (Abnormal Closure)`：后端服务进程崩溃或网络物理接口中断。

### 解决方案
- **Token 重新同步**：直接在浏览器中访问 `http://127.0.0.1:3001/api/auth/token` 获取当前有效 Token，客户端会自动保存并重新连接。
- **配置跨域来源**：如果您使用局域网 IP（例如 `http://192.168.1.50:5173`）访问控制台，请在 `server/src/config.ts` 的 `CONFIG.ALLOWED_ORIGINS` 数组中添加该来源地址。
- **重启后端服务**：若服务端进程异常退出，请查看终端输出的报错调用栈，并通过 `npm run dev` 或 [`start.cmd`](../start.cmd) 重启。

---

## 2. 未检测到 Antigravity 会话或运行记录

### 常见症状
- 控制大屏（Overview）显示 `0 Active Locks` 和 `0 Live Transcripts`，但此时本地另一个终端中正有 Antigravity 任务在运行。

### 诊断步骤
1. 查看服务端启动时输出的基准路径：
   ```text
   [ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
   [ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
   ```
2. 检查物理磁盘上对应路径是否存在：
   - 锁文件：`~/.gemini/antigravity/presence/`
   - 转录日志：`~/.gemini/antigravity/brain/**/.system_generated/logs/transcript.jsonl`

### 解决方案
- **环境变量路径覆盖**：如果您的 Antigravity 安装在非标准目录，请在 `.env` 中显式指定物理路径：
  ```env
  ANTIGRAVITY_DIR=D:\CustomPath\.gemini\antigravity
  BRAIN_DIR=D:\CustomPath\.gemini\antigravity\brain
  PRESENCE_DIR=D:\CustomPath\.gemini\antigravity\presence
  KNOWLEDGE_DIR=D:\CustomPath\.gemini\antigravity\knowledge\ai-director
  ```
- **权限检查**：确保当前运行 Node.js 的用户账户对 `.gemini` 目录具有完全读写权限。

---

## 3. 子智能体进程假死或执行超时

### 常见症状
- 某个任务长时间停留在 `in_progress` 状态无任何新动态。
- 终端显示由进程监视器派生的子智能体停止输出日志。

### 诊断步骤
1. 前往控制台的 **Task Manager**（任务管理）页面。
2. 选中假死任务，查看其执行详情与当前操作系统进程 PID。

### 解决方案
- **前端界面取消**：点击任务抽屉面板中的 **Cancel Task**（取消任务）按钮，监视器将发送中断信号。
- **强制杀灭进程树**：若进程无法优雅退出，监视器会自动执行进程树强杀。在 Windows 下亦可手动在 PowerShell 中执行：
  ```powershell
  taskkill /PID <PID> /T /F
  ```
- **调整任务超时阈值**：对于耗时较长的大型编译或 E2E 测试任务，可在触发执行时增加超时参数（`timeoutMs`）：
  ```json
  {
    "timeoutMs": 300000
  }
  ```

---

## 4. SQLite 数据库锁表 (`SQLITE_BUSY: database is locked`)

### 常见症状
- REST API 接口返回 HTTP 500 状态码，伴随 `SQLITE_BUSY: database is locked` 报错信息。

### 诊断步骤
1. 检查是否有外部 SQLite 桌面客户端（如 DB Browser for SQLite）以独占排他锁模式打开了 `command_center.sqlite`。
2. 检查数据库预写日志文件是否存在：`command_center.sqlite-wal` 与 `command_center.sqlite-shm`。

### 解决方案
- **关闭外部连接**：关闭所有打开了数据库文件的外部 GUI 工具与查看器。
- **校验 WAL 模式参数**：Antigravity Apex 默认开启 WAL 模式并设置 `busy_timeout = 5000`。若曾修改 `database.ts`，请确保保留此超时排队设置。
- **重置数据库**：若数据库文件损坏，可关闭服务并删除 `command_center.sqlite*` 关联文件。再次启动服务端时会自动生成全新干净的数据库结构。

---

## 5. 法律合规门禁返回 `BLOCKED_RED`

### 常见症状
- 任务在 Quality Gate 2b（合规门禁）处被拦截，状态标记为 `BLOCKED_RED`。

### 诊断步骤
1. 检查任务挂载的 `LegalAssessment` 评估对象，或请求 `GET /api/events?type=legal_gate.blocked`。
2. 查看报告中的 `identifiedRisks`（识别出的风险）与 `mechanismOfNonCompliance`（违规法理机制）。

### 常见违规诱因与整改措施
- **传染性强 Copyleft 许可证**：代码库中引入了 AGPL-3.0 或 GPL-3.0 依赖，且该系统涉及闭源商用或云服务分发。解决方式：替换为 MIT、Apache-2.0 或 BSD 许可的替代库。
- **俄罗斯联邦个人数据本地化违规 (23-FZ)**：系统未经俄罗斯境内服务器初次记录，直接将俄罗斯公民个人数据向境外传输。解决方式：实现境内本地数据库首录存储，再执行合规跨国同步。
- **电商暗模式预勾选框 (69-FZ)**：结算或同意流程中存在默认选中的复选框。解决方式：移除默认勾选状态，满足 2025 年 9 月 1 日生效的反暗模式禁令。
- **铭记非阻塞隔离特性**：当出现 `BLOCKED_RED` 时，**仅阻断违规的技术子任务**，团队无需暂停无害的前端设计、CSS 样式或测试编写工作。

---

## 6. CLI 执行被拒绝 (`Agent not allowed` / `Command failed`)

### 常见症状
- 在控制中心派发任务时报错：`error: Agent "<name>" is not allowed` 或 `Invalid CLI arguments`。

### 诊断步骤
1. 检查白名单配置：请求 `GET /api/control/settings`。
2. 检查提示词输入中是否含有被禁止的 Shell 特殊元字符：`&`、`|`、`;`、`$`、`>`、`<`、`` ` ``。

### 解决方案
- 确保执行的智能体标识已存在于 `settings.allowedAgents` 数组中。可通过控制中心界面添加新智能体 ID。
- 移除提示词中拼接的复杂 Shell 管道或分号操作符，只向 `agy.exe` 传递清晰纯文本任务指令。
