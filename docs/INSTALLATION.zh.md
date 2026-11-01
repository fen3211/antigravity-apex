# 安装与环境部署指南

[English](INSTALLATION.md) • [Русский](INSTALLATION.ru.md) • [简体中文](INSTALLATION.zh.md) • [日本語](INSTALLATION.ja.md) • [Deutsch](INSTALLATION.de.md)

本指南为在 **Windows**、**macOS** 和 **Linux** 环境下安装与配置 **Antigravity Apex** 提供详尽的逐步指导，包含一键桌面启动器、终端单行命令以及全手动编译部署步骤。

---

## ⚡ 一键极速安装

### Windows 一键安装
1. 下载或克隆本代码仓库。
2. 双击项目根目录下的 [`setup.cmd`](../setup.cmd)（或 [`setup.bat`](../setup.bat)）。
3. 脚本将自动安装全部依赖项、将 17 个智能体配置部署到 `~/.gemini/config/plugins/ai-director`、运行 `doctor.js` 自检、启动服务并在浏览器中自动打开 `http://127.0.0.1:5173/`。

### Linux / macOS 一键安装
```bash
chmod +x setup.sh && ./setup.sh
```

### 远程单行命令安装（无需预先克隆）
- **Windows (PowerShell)**:
  ```powershell
  irm https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.ps1 | iex
  ```
- **Linux & macOS (Bash)**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash
  ```

---

## 1. 系统要求与环境准备

### 最低配置要求
- **Node.js**：`v18.0.0` 或更高版本（已在 Node.js v20.x LTS 与 v24.x 环境全面测试验证）。
- **npm**：`v9.0.0` 或更高版本。
- **内存 (RAM)**：最低 2 GB（运行多子智能体并行时推荐 4 GB 及以上）。
- **磁盘空间**：至少 200 MB 可用空间用于依赖项安装和本地 SQLite 数据库。
- **支持操作系统**：
  - Windows 10/11 (64 位)
  - macOS 12+ (Apple Silicon 或 Intel 芯片)
  - Ubuntu 22.04+ / Debian 11+ / Fedora 38+ / Arch Linux

### Antigravity 运行环境（可选但强烈推荐）
若需要监控实时会话与动态遥测：
- 本机已安装 Google Antigravity。
- 默认工作区目录位于 `~/.gemini/antigravity/`（Windows 环境为 `%USERPROFILE%\.gemini\antigravity`）。
- Antigravity 命令行执行文件 `agy.exe`（Windows 下通常位于 `%LOCALAPPDATA%\agy\bin\agy.exe`）。

> [!NOTE]
> 即使本机未运行 Antigravity，Antigravity Apex 也能完全正常工作。在无外部 Antigravity 的环境下，仪表盘将自动启用离线任务管理、本地数据库持久化以及模拟遥测支持。

---

## 2. 手动逐步安装

### 第 1 步：克隆代码仓库
```bash
git clone https://github.com/fen3211/antigravity-apex.git
cd antigravity-apex
```

### 第 2 步：安装服务端依赖
```bash
npm install
```

### 第 3 步：安装前端客户端依赖
```bash
npm --prefix client install
```

### 第 4 步：配置环境变量
复制提供的模板文件 `.env.example` 为 `.env`：

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

首次启动时，若 `COMMAND_CENTER_API_KEY` 为空，服务端会自动生成一个 32 字节的高强度加密 Token 并自动保存到 `.env` 中。

### 第 5 步：部署 Antigravity 智能体与技能
将完整的 17 个智能体定义、调度规则与技能一键部署到 Antigravity 目录：

**Windows (PowerShell):**
```powershell
.\scripts\install.ps1 -Force
```

**macOS / Linux:**
```bash
./scripts/install.sh --force
```

---

## 3. 数据库初始化

SQLite 数据库（`command_center.sqlite`）会在服务端首次启动时自动建表与初始化。

核心数据库特性：
- **存储引擎**：基于原生 C++ 绑定的 `better-sqlite3`。
- **日志模式 (Journal Mode)**：默认开启 **WAL (Write-Ahead Logging)** 预写日志，实现无锁高并发读取与极速原子写入。
- **并发控制**：设置 `busy_timeout = 5000`，有效防止在高吞吐日志摄入突发时出现锁库错误。
- **数据表集**：`tasks`、`events`、`settings`、`model_usage`、`session_token_usage`、`log_parse_state`、`legal_assessments`、`escalations`。

无需手动执行任何 SQL 数据库迁移脚本。

---

## 4. 系统自检 (`npm run doctor`)

可随时通过命令行执行全方位系统健康诊断：

```bash
npm run doctor
```

检查项目包括：
- Node.js 与 npm 运行时版本
- Git 可用性与当前分支状态
- SQLite WAL 模式与数据表完整性
- 17 个专职智能体定义文件的存在性
- 编排规则与技能（`director-orchestration`、`argon-escalation`）
- Antigravity 本地目录（`brain`、`presence`、`knowledge`）的联通性

---

## 5. 验证与自动化测试

执行自动化测试套件以验证安装环境：

```bash
npm test
```

将执行全部 8 个专项测试套件：
1. `tests/api.test.ts`：REST API 安全、CORS、Token 鉴权与命令行注入防御。
2. `tests/ingestion.test.ts`：增量流读取器、64 KB 分块及文件轮转安全。
3. `tests/analytics.test.ts`：LIVE 与 ESTIMATED Token 指标及成本核算。
4. `tests/websocket-resilience.test.ts`：WebSocket 鉴权、消息边界与心跳保活。
5. `tests/process-supervisor.test.ts`：子智能体进程生成、进程树终止超时与并发控制。
6. `tests/legal-compliance.test.ts`：法律门禁 2b 涵盖 16 种法定场景的自动化合规测试。
7. `tests/backend-audit.test.ts`：跨平台路径探索、防路径穿越攻击及 Doctor 检查。
8. `tests/intelligent-argon-escalation.test.ts`：4 级 Argon 升级、18 点提示词包与防刷冷却机制。

---

## 6. 运行模式

### 模式 A：开发热重载模式 (Hot-Reload)
```bash
npm run dev
```

### 模式 B：Windows 桌面一键秒级启动
双击 [`start.cmd`](../start.cmd)。

### 模式 C：生产环境编译与启动
```bash
npm run server:build
npm --prefix client run build
npm start
```
