# AI COMMAND CENTER
## Premium Multi-Agent Management Dashboard for Antigravity AI Development Director

**AI Command Center** — это отдельная локальная панель мониторинга и оперативного контроля над мультиагентной системой Google Antigravity и глобальной конфигурацией **AI Development Director**.

Разработан в стиле **Premium Liquid Dark Glass** (Apple Liquid Glass / Developer Tools Vibe) без визуального шума и типовых шаблонов. 

---

## 1. Возможности и Реальные Интеграции

### Реально работающие интеграции (100% Live & Verified):
- **Live Antigravity Transcripts Inspector**: Мониторинг каталога `~/.gemini/antigravity/brain/**/transcript.jsonl`. Извлечение реального количества токенов (`input_tokens`, `output_tokens`, `cache_read_tokens`), вызовов субагентов (`invoke_subagent`), шагов и статусов ошибок. На локальной машине протестировано чтение 74 реальных сессий.
- **Active Presence Detector**: Отслеживание lock-файлов `~/.gemini/antigravity/presence/*.lock` в реальном времени через `chokidar`. Точное определение активных сессий и времени последней активности.
- **Direct Memory Integration**: Прямое подключение к глобальной базе знаний `~/.gemini/antigravity/knowledge/ai-director/`. Чтение и онлайн-редактирование файлов:
  - `DIRECTOR_PROTOCOL.md`
  - `AGENT_REGISTRY.md`
  - `MODEL_ROUTING_POLICY.md`
  - `ESCALATION_POLICY.md`
  - `QUALITY_GATES.md`
  - `FAILURE_LOG.md`
  - `VERIFIED_SOLUTIONS.md`
  - `PROJECT_SPECIFIC_LESSONS.md`
- **Agent Registry Parser**: Автоматический парсинг системных спецификаций агентов из `~/.gemini/config/plugins/ai-director/agents/*.md` (`director`, `researcher`, `frontend-developer`, `backend-developer`, `ui-ux-designer`, `qa-engineer`, `code-reviewer`, `senior-architect`, `firestore-rules-author`).
- **Antigravity CLI Bridge**: Проверенное взаимодействие с `agy.exe` (`agy models`, `agy agents`, `agy plugins list`, `agy -p ...`).
- **Automated Retry & Escalation Engine**: В соответствии с правилом 5 AI Director, при превышении лимита повторных попыток (2 попытки на один подход) задача автоматически эскалируется на **Level 3: Senior Architect (Pro Tier)**, а при повторном тупике — на **Level 4: Gemini 4 Argon**.
- **9-Point Subagent Report Inspector**: Отображение и валидация всех 9 обязательных пунктов отчетов субагентов (Название, Статус, Что сделано, Файлы, Проверки, Результаты, Риски, Незавершенное, Рекомендованные шаги).
- **Argon Prompt Pack Synthesizer**: Генератор пакета эскалации 4-го уровня с минимальным изолированным контекстом (20–50 строк), доказательствами двух провалов и директивой для оператора.
- **Real-Time WebSocket Event Stream**: Единый формат 10 типов событий (`agent.*`, `task.*`, `escalation.*`, `quality_gate.*`) с локальным хранением в SQLite (WAL mode).

### Ограничения Antigravity и разграничение данных:
- **Баланс и облачные квоты**: Antigravity не транслирует системные облачные лимиты/долларовый баланс через CLI или файлы. В аналитике Command Center четко разграничены метрики: подтвержденные токены сессий помечены бейджем **LIVE**, а агрегированные прогнозные данные — бейджем **ESTIMATED**.
- **Безопасность выполнения**: Произвольный запуск bash/powershell команд из браузера заблокирован. Вызовы `agy` изолированы белым списком аргументов и требуют явного чекбокса подтверждения оператора.

---

## 2. Архитектура и Стек Технологий

- **Frontend**:
  - React 19 + TypeScript + Vite
  - Tailwind CSS v3 с кастомной палитрой Dark Glass (`backdrop-blur-deep`, `shadow-glass-card`)
  - Lucide React (иконки системного уровня)
  - Framer Motion
  - Zero console errors (проверено Playwright)
- **Backend**:
  - Node.js (v24.20) + Express + TypeScript (`tsx`)
  - WebSocket Server (`ws`)
  - `better-sqlite3` (высокопроизводительный WAL-режим, индексированные таблицы `tasks`, `events`, `settings`, `model_usage`)
  - `chokidar` (реактивный файловый наблюдатель без постоянного поллинга)
  - Zod (строгая валидация входящих схем)

---

## 3. Быстрый Запуск на Windows

### Предварительные требования:
- Node.js >= 18 (протестировано на Node v24)
- Установленный Antigravity (`agy.exe` в `%LOCALAPPDATA%\agy\bin\agy.exe`)

### Шаги запуска:

1. **Клонирование / Переход в папку**:
   ```bash
   cd d:\Projects\ai-command-center
   ```

2. **Установка зависимостей**:
   ```bash
   npm install
   npm --prefix client install
   ```

3. **Запуск тестов**:
   ```bash
   npm test
   ```
   *Все 7 сквозных системных тестов должны завершиться со статусом PASS.*

4. **Запуск в режиме разработчика (Server + Client)**:
   ```bash
   npm run dev
   ```
   Или запустите двойным кликом файл `start.cmd`.

5. **Открыть в браузере**:
   - Панель управления: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
   - Backend API Health: [http://127.0.0.1:3001/health](http://127.0.0.1:3001/health)
   - WebSocket Stream: `ws://127.0.0.1:3001/ws`

---

## 4. Разделы Дашборда

1. **Overview**: Сводка ключевых KPI, Director Status, токены текущей сессии, счетчики эскалаций и живая лента телеметрии.
2. **Agent Management**: Сетка из 9 специалистов (Director, Researcher, Frontend, Backend, UI/UX, QA, Reviewer, Senior Architect, Firestore Rules), просмотр Markdown спецификаций и переключение статусов.
3. **Live Workflow**: Интерактивная карта Director → Subagents → QA → Reviewer → Approval с ветвлениями на Senior Architect (L3) и Argon (L4).
4. **Model Analytics**: Использование Gemini 3.8 Flash, Pro и Argon с подтвержденными логами токенов.
5. **Task Management**: Очередь задач, фильтры, перезапуск с контролем лимитов и просмотр 9-пунктных отчетов субагентов.
6. **Director Memory**: Полноценный онлайн-редактор базы знаний `~/.gemini/antigravity/knowledge/ai-director/`.
7. **Control Center**: Настройка лимитов параллелизма (макс. 3), синтез пакетов эскалации к Argon и безопасный запуск задач через `agy CLI`.
8. **Unified Event Stream**: Полноэкранный JSON-инспектор событий с экспортом и фильтрацией.

---

## 5. Лицензия
MIT. Разработано в роли AI Development Director для мультиагентной системы Antigravity.
