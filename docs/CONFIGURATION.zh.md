[English](CONFIGURATION.md) • [Русский](CONFIGURATION.ru.md) • [简体中文](CONFIGURATION.zh.md) • [日本語](CONFIGURATION.ja.md) • [Deutsch](CONFIGURATION.de.md)

# 配置参考手册

本文档为 **Antigravity Apex** 的所有静态环境变量和运行时动态配置参数提供完整参考。

---

## 1. 静态环境变量 (`.env`)

Antigravity Apex 在启动时通过 `dotenv` 加载根目录下的 `.env` 文件。所有参数均具备开箱即用的默认值。

### 服务网络与运行时参数

| 变量名 | 数据类型 | 默认值 | 说明 |
|--------|----------|--------|------|
| `PORT` | `number` | `3001` | Express 服务端与 WebSocket 监听的 HTTP 端口号。 |
| `HOST` | `string` | `127.0.0.1` | 服务端监听的网络接口地址。默认为本地回环地址（Loopback）以确保本地安全性。 |
| `NODE_ENV` | `string` | `development` | 运行环境模式。生产环境构建设置为 `production` 以启用严格缓存并关闭详细调试日志。 |

### 安全与身份鉴权

| 变量名 | 数据类型 | 默认值 | 说明 |
|--------|----------|--------|------|
| `COMMAND_CENTER_API_KEY` | `string` | *(自动生成)* | 32 字节高强度十六进制加密 Token（共 64 位字符），用于所有写操作 REST 接口与 WebSocket 连接鉴权。若留空，服务端在首次启动时会自动生成并写入 `.env`。 |

### Antigravity 文件系统路径

默认情况下，路径自动基于用户主目录（`~/.gemini/antigravity`）进行解析。您可以根据需要单独覆盖：

| 变量名 | Windows 默认路径 | Linux / macOS 默认路径 | 说明 |
|--------|------------------|------------------------|------|
| `ANTIGRAVITY_DIR` | `%USERPROFILE%\.gemini\antigravity` | `~/.gemini/antigravity` | Google Antigravity 主安装目录。 |
| `KNOWLEDGE_DIR` | `%USERPROFILE%\.gemini\antigravity\knowledge\ai-director` | `~/.gemini/antigravity/knowledge/ai-director` | 存放 AI Director Markdown 协议规范与记忆的目录。 |
| `PRESENCE_DIR` | `%USERPROFILE%\.gemini\antigravity\presence` | `~/.gemini/antigravity/presence` | 存放活跃会话锁文件（`.lock`）的目录。 |
| `BRAIN_DIR` | `%USERPROFILE%\.gemini\antigravity\brain` | `~/.gemini/antigravity/brain` | 存放子智能体运行记录（`transcript.jsonl`）的目录。 |
| `AGY_CLI_PATH` | `%LOCALAPPDATA%\agy\bin\agy.exe` | `/usr/local/bin/agy` | Antigravity 命令行执行文件的实际物理路径。 |
| `DB_PATH` | `./command_center.sqlite` | `./command_center.sqlite` | 本地 SQLite 数据库的物理文件存储路径。 |

---

## 2. 动态运行时配置 (Runtime Settings API)

除 `.env` 外，Antigravity Apex 还在 SQLite 的 `settings` 表中保存了动态运行时策略。这些设置可以在界面中（**Control Center**）修改，或通过 REST API 进行调整：

- **接口端点**：`GET /api/control/settings` 与 `POST /api/control/settings`
- **鉴权要求**：需在请求头或 Query 参数中提供有效的 `COMMAND_CENTER_API_KEY`。

### 数据结构与默认配置示例

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

### 关键参数解析

1. `maxConcurrentAgents` (整数, 1–10)：
   控制进程监视器允许同时生成的子智能体数量上限。常规推荐值：`3`；高负荷上限：`6`。
2. `maxRetryAttempts` (整数, 1–10)：
   针对同一方案允许的最大重试次数。超限后自动触发向 Senior Architect 的 Level 3 升级。默认值：`2`。
3. `defaultModelTier` (字符串)：
   新派发任务分配的默认 Gemini 模型级别。通常为 `gemini-3.8-flash-high`。
4. `escalationPolicy` (`"strict"` | `"relaxed"`)：
   - `"strict"`（严格模式）：连续失败 2 次后立即锁定任务并生成 Argon 提示词包。
   - `"relaxed"`（宽松模式）：允许在升级前额外进行 1 次重试。
5. `autoQualityGates` (布尔值)：
   为 true 时，系统在子智能体提交 9 点报告后自动触发 Quality Gate 1 自动化校验。
6. `allowedAgents` (字符串数组)：
   允许通过执行桥接启动的合法智能体 ID 白名单。有效防止未授权的智能体执行。

---

## 3. CORS 跨域与网络白名单

后端通过 `CONFIG.ALLOWED_ORIGINS` 严格校验来源域：

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

来自未经授权来源的请求将被直接拒绝（返回 **HTTP 403 Forbidden**）。若前端运行在自定义端口或局域网主机名上，请修改 `server/src/config.ts` 中的 `ALLOWED_ORIGINS`。

---

## 4. WebSocket 运行参数

WebSocket 服务器（`ws://127.0.0.1:3001/ws`）受到严格的稳定性限制保护：

- **单包最大载荷**：`64 KB` (`MAX_WS_PAYLOAD = 64 * 1024`)。任何超过此阈值的消息帧都会被拒绝，服务端将发送 WebSocket 关闭码 `1009 (Message too large)` 并立即关闭连接。
- **心跳保活间隔**：30 秒。客户端须对 `ping` 消息回复 `pong` 响应帧；无响应的超时连接将被自动清理。
- **身份鉴权方式**：支持以下三种方式之一提供 Token：
  - URL Query 参数：`?token=<API_KEY>`
  - HTTP 标头：`Authorization: Bearer <API_KEY>`
  - 自定义标头：`x-api-key: <API_KEY>`

---

## 5. 文件监听器过滤器规则 (Chokidar)

Chokidar 文件监听器通过 `createAntigravityPathFilter(brainDir, presenceDir)` 实施高精度过滤：

### 允许监听的目标：
- `PRESENCE_DIR` 目录下以 `.lock` 结尾的文件。
- `BRAIN_DIR` 目录中 `.system_generated/logs/` 子目录下名为 `transcript.jsonl` 的文件。

### 显式忽略与排除的目标：
- 临时文件：`.tmp`、`.swp`、`~*`、`.bak`、`~$*`、`.crdownload`。
- 点开头的隐藏文件及目录（`.system_generated` 除外）。
- 庞大的构建与缓存目录：`node_modules`、`.git`、`dist`、`scratch`、`tempmediaStorage`、`.user_uploaded`。
