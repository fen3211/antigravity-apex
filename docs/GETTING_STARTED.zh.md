# Antigravity Apex 快速入门指南

[English](GETTING_STARTED.md) • [Русский](GETTING_STARTED.ru.md) • [简体中文](GETTING_STARTED.zh.md) • [日本語](GETTING_STARTED.ja.md) • [Deutsch](GETTING_STARTED.de.md)

欢迎使用 **Antigravity Apex** —— 专为 **Google Antigravity** 与 **AI Development Director** 多智能体编排框架打造的任务指挥控制中心。

本指南将带领您在 5 分钟内快速上手 Antigravity Apex，从本地服务启动到自主子智能体监控、9 点技术报告审核以及实时遥测数据审查。

---

## 1. 什么是 Antigravity Apex？

Google Antigravity 允许自主 AI 智能体在隔离的工作空间中协同构建软件。然而，随着前端、后端、安全、测试和法务子智能体的并发运作，开发者迫切需要一个集中化、全局透明的可视化控制台。

Antigravity Apex 提供：
- **实时全局透明度**：毫秒级实时追踪活跃会话、正在运行的子智能体以及 Token 消耗。
- **动态并发控制**：安全调度并发子智能体（最多支持 6 个并行工作者），防止内存耗尽与 API 频控超限。
- **多层质量门禁**：在任务批准合并前强制执行严格的验证（Gate 1 单元测试、Gate 2 独立代码审查、Gate 2b 法律合规）。
- **闭环 Argon L4 升级**：自主捕获重复失败（2 次重试上限），并生成最小复现提示词包升级至 Gemini Pro 或 Gemini 4 Argon。

---

## 2. 5 分钟极速上手教程

### 第 1 步：启动服务
打开终端并进入项目根目录：

```bash
cd antigravity-apex
npm run dev
```

在 Windows 环境下，您也可以直接双击 [`start.cmd`](../start.cmd)，或者运行 [`setup.cmd`](../setup.cmd) 进行一键环境初始化。

终端将输出就绪信息：
```text
[ANTIGRAVITY APEX] Server running on http://127.0.0.1:3001
[ANTIGRAVITY APEX] WebSocket stream at ws://127.0.0.1:3001/ws
[ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
[ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
VITE v8.3.5 ready in 250 ms
➜  Local:   http://localhost:5173/
```

### 第 2 步：打开控制大屏
在浏览器中访问：
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

界面将呈现 **Refero / Vercel** 风格的控制台（支持 Paper Light 明亮与 Obsidian Dark 深色双模主题），顶部连接状态胶囊应显示为绿色的 **ONLINE**。

---

## 3. 控制台核心板块导览

Antigravity Apex 将复杂的多智能体运行遥测数据归类到 8 个专注视图中：

### 1. 概览大屏 (Overview / Mission Control)
高层全局状态中枢：
- **Director 状态**：模型版本（`Gemini 3.8 Flash High`）、活跃会话数与文件排他锁。
- **核心 KPI 指标**：活跃子智能体、已完成任务数、综合成功率与总 Token 消耗。
- **实时遥测动态**：滚动播报智能体启动、完成及质量门禁结果的实时事件流。
- **1-Click 一键配置**：一键将 17 个智能体配置一键部署同步至 Antigravity 运行环境。

### 2. 智能体管理 (Agent Management)
17 角色专业团队看板：
- 实时查看全部专家的状态（`idle` 空闲、`running` 运行中、`blocked` 阻塞、`escalated` 升级中）。
- 直接查看加载自 `~/.gemini/config/plugins/ai-director/agents/*.md` 的系统提示词规范与职责定义。
- 监控每个专家的历史成功率与执行记录。
- 触发一键同步至 Antigravity 插件目录。

### 3. 编排工作流 (Live Workflow)
任务全生命周期的交互式流程图：
- 节点状态流转：`Director_Triage` → `Solo` / `Specialist` → `QualityGate_L1` → `Independent_L2` → `LegalGate` → `Architect_L3` → `Argon_L4` → `Approved`。
- 动态呼吸灯动画高亮当前节点上的活跃任务。

### 4. 模型分析 (Model Analytics)
Token 开销与性能深度追踪：
- 按 Gemini 模型族细分：**Gemini 3.8 Flash**、**Gemini Pro (Senior Architect)** 与 **Gemini 4 Argon**。
- 严格区分已验证的 **LIVE**（转录文件真实提取）与估算的 **ESTIMATED** 指标。
- 费用核算、输入/输出/缓存读取（cache-read）Token 计数器。

### 5. 任务管理 (Task Manager)
运维任务看板：
- 按状态、优先级与指派专家筛选任务。
- 检查任务详情、重试计数器与错误追踪日志。
- 检查专家在任务完成时提交的严格 **技术子智能体 9 点报告**。

### 6. Director 知识库记忆 (Director Memory)
全局 AI Director 知识库在线浏览器与编辑器：
- 在线编辑 `DIRECTOR_PROTOCOL.md`、`AGENT_REGISTRY.md`、`QUALITY_GATES.md`、`FAILURE_LOG.md` 等核心策略文件。
- 保存后零延迟直接持久化写入 `~/.gemini/antigravity/knowledge/ai-director/`。

### 7. 4 级升级中心 (Escalation Center / Gemini 4 Argon)
Level 4 升级管理座舱：
- 自主捕捉重复失败、诊断死锁与智能体结论矛盾。
- 灵敏度一键切换（`conservative` 保守、`balanced` 平衡、`aggressive` 激进）。
- 一键生成 18 点脱敏提示词包并复制到剪贴板。
- 闭环裁决输入与回流分派工作流。

### 8. 统一事件流 (Unified Event Stream)
高吞吐 JSON 事件调试监视器：
- 捕获系统所有事件（`agent.*`、`task.*`、`legal_gate.*`、`escalation.*`）。
- 按事件类型、智能体 ID、任务 ID 毫秒级筛选。
- 支持一键复制 JSON Payload 用于故障排查。

---

## 4. 下一步

现在您的指挥中心已顺利运行：
- 阅读 [**AGENTS.zh.md**](AGENTS.zh.md) 了解 17 位专家的详尽职责与提示词边界。
- 阅读 [**ORCHESTRATION.md**](ORCHESTRATION.md) 了解任务分发、并发限制与质量门禁规范。
- 运行 `npm run doctor` 验证完整系统健康诊断。
