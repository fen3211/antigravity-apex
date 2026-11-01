# Архитектурная документация и диаграммы Antigravity Apex

Данный каталог содержит официальную архитектурную спецификацию и Mermaid-диаграммы для Open Source релиза **Antigravity Apex** — панели управления и телеметрии мультиагентной системы Google Antigravity и глобального AI Development Director.

---

## 1. Реестр архитектурных диаграмм

| Файл диаграммы | Название и назначение | Основные узлы и концепции |
| :--- | :--- | :--- |
| [`system-architecture.mmd`](./system-architecture.mmd) | **System Architecture**<br>Общая компонентная архитектура системы | User, React 19 SPA, Express Ingress Guards, SQLite WAL, Process Supervisor, Ingestion Pipeline, Antigravity Bridge, WebSocket, Antigravity Brain |
| [`agent-orchestration.mmd`](./agent-orchestration.mmd) | **Agent Orchestration Workflow**<br>Жизненный цикл задачи и оркестрация | Director Triage, 17 специалистов в 5 дивизионах, Concurrency Slot Pool (до 6), Quality Gates L1/L2, Gate 2b (Legal), Senior Architect L3, Argon L4 и De-escalation loop |
| [`installation-flow.mmd`](./installation-flow.mmd) | **Installation & Onboarding Flow**<br>Развертывание, диагностика и запуск | Clone, Health Doctor, Discovery конфигурации, автогенерация API-ключа, деплой правил агентов, миграции SQLite, запуск валидации, Ready |
| [`security-architecture.mmd`](./security-architecture.mmd) | **Security Architecture & Trust Boundaries**<br>Модель угроз и эшелонированная защита | 4 границы доверия, Localhost binding (127.0.0.1), Timing-safe API Key Auth, CORS, Path Traversal Shield, Process Tree Isolation, подтверждение опасных команд |
| [`data-flow.mmd`](./data-flow.mmd) | **Event & Telemetry Data Flow**<br>Потоковая обработка событий телеметрии | `transcript.jsonl` -> Chokidar -> `JsonlStreamReader` (кванты 64KB, UTF-8 StringDecoder) -> `IngestionQueue` -> Atomic SQLite WAL -> `EventBus` -> WebSocket -> Client React FSM |

---

## 2. Подробное описание архитектурных подсистем

### 2.1. Системная архитектура (`system-architecture.mmd`)
Архитектура Antigravity Apex построена по принципу модульного разделения ответственности:
- **Presentation Layer (Клиентский уровень)**: React 19 SPA на базе Vite и Tailwind CSS (тема Premium Dark Glass). Включает модули аналитики моделей, канбан задач, инспектор базы знаний Director Memory и интерактивную карту жизненного цикла. Клиент использует двухканальную связь: типизированный REST-клиент (`fetchJson`) с автоматическим получением токена и реактивный клиент веб-сокетов (`EventStreamClient`).
- **Backend Application Gateway (Сервер Express + WS @ 127.0.0.1:3001)**:
  - *Ingress Guards*: строгая проверка CORS по белому списку доверенных локальных источников, аутентификация через middleware `requireAuth` с защитой от атак по времени (`crypto.timingSafeEqual`), лимитер размера фреймов WS (максимум 64 КБ).
  - *Core Services*: `TaskManager` (управление жизненным циклом и стадиями задач), `ControlService` (политики маршрутизации и генератор Argon Prompt Pack), `LegalGateService` (юридический шлюз РФ/ЕС Gate 2b), `AnalyticsService` (агрегация токенов сессий и разметка Provenance: LIVE vs ESTIMATED).
  - *Process Isolation*: `TaskProcessSupervisor` — пул параллельных процессов (до 6 активных) с контролем тайм-аутов и безопасным завершением дерева процессов (`taskkill /T /F` на Windows, `SIGKILL` на POSIX).
  - *Ingestion Pipeline*: `AntigravityBridge`, `IngestionQueue` и потоковый ридер `JsonlStreamReader`.
- **Persistence Layer (Хранилище SQLite WAL)**: Высокопроизводительный движок на базе `better-sqlite3`. Включен режим Write-Ahead Logging (`journal_mode = WAL`), таймаут ожидания блокировок `busy_timeout = 5000ms` и каскадные внешние ключи. Хранит историю задач, единый поток событий `events`, системные настройки, метрики использования моделей, токены сессий и состояние парсинга логов (`log_parse_state`).
- **Antigravity Ecosystem (Локальная среда)**: Взаимодействие с бинарным файлом `agy.exe`, чтение логов сессий `transcript.jsonl`, отслеживание файлов блокировок присутствия `presence/*.lock`, чтение и обновление базы знаний `knowledge/ai-director/*.md` и спецификаций агентов.

---

### 2.2. Оркестрация и дивизионы 17 специалистов (`agent-orchestration.mmd`)
Система реализует строгую многоуровневую модель оркестрации под управлением **AI Development Director** (Gemini 3.8 Flash High):
1. **Триаж задач**:
   - *Простые задачи (<15 строк, опечатка, мелкий фикс)*: выполняются Director самостоятельно в режиме Solo.
   - *Средние задачи (1–3 файла, конкретный компонент)*: делегируются ровно одному профильному специалисту.
   - *Крупные задачи (сквозные фичи, модуль + UI + API)*: декомпозируются на 2–6 независимых подзадач с изоляцией в Git Worktree (`git worktree add`).
2. **Дивизионы специалистов (17 ролей без дублирования)**:
   - **Дивизион 1. Command & Governance (Управление и арбитраж)**:
     - `director` (Flash High) — главный координатор, триаж задач, арбитраж качества.
     - `product-manager` (Flash) — анализ требований, User Stories, Acceptance Criteria, определение MVP.
     - `legal-compliance` (Flash) — Legal Advisor (152-ФЗ, 243-ФЗ, 149-ФЗ, ЗоЗПП, GDPR, авторское право) и Technical Writer (README, спецификации, runbooks).
   - **Дивизион 2. Architecture & Data Foundation (Архитектура и данные)**:
     - `senior-architect` (Pro Tier) — системная архитектура, race conditions, память, L3-эскалация.
     - `database-specialist` (Flash/Pro) — схемы реляционных БД, индексы, миграции, транзакции, блокировки.
     - `data-engineer` (Flash/Pro) — ETL/ELT пайплайны, потоковая обработка, парсинг JSONL/CSV, качество данных.
   - **Дивизион 3. Product Engineering (Инженерия и интерфейсы)**:
     - `frontend-developer` (Flash) — React, Next.js, TypeScript, кинематика UI, адаптивность.
     - `backend-developer` (Flash) — Node.js, Express, REST/WebSocket API, авторизация, логика.
     - `ui-ux-designer` (Flash) — дизайн-системы Dark Glass, сценарии пользователей, визуальная иерархия.
   - **Дивизион 4. Verification & Quality (Верификация и качество)**:
     - `qa-engineer` (Flash) — автоматизированные Unit/Integration/E2E тесты, проверка регрессий.
     - `code-reviewer` (Flash) — независимый аудит diff-ов, паттерны, безопасность и чистота кода.
     - `ai-evaluation-engineer` (Flash/Pro) — оценка качества LLM, эвалы промптов, поиск галлюцинаций, задержки.
   - **Дивизион 5. Specialized Hardening & Infrastructure (Надежность и инфраструктура)**:
     - `security-engineer` (Flash/Pro) — OWASP Top 10, аудит секретов, injection defense, безопасность MCP.
     - `devops-engineer` (Flash/Pro) — CI/CD, Docker, управление процессами, мониторинг, отказоустойчивость.
     - `performance-engineer` (Flash/Pro) — Core Web Vitals (LCP/CLS/INP), профилирование CPU и утечек памяти.
     - `accessibility-specialist` (Flash) — доступность по WCAG 2.2 AA/AAA, ARIA, семантика, screen readers.
3. **Пул слотов параллелизма (Concurrency Slot Pool)**:
   - Лимит параллельных агентов: `MAX_CONCURRENT_SUBAGENTS = 6` (по умолчанию 3).
   - Ограничение на тяжелые модели: `MAX_CONCURRENT_EXPENSIVE_MODELS = 2` (для Pro-tier).
   - Очередь FIFO с автоматическим освобождением слотов при завершении задач.
4. **Многоступенчатый контроль качества**:
   - *Quality Gate L1 (Self-Audit)*: обязательный 9-пунктный отчет субагента, запуск линтера, тестов и сборки.
   - *Gate 2b (Legal Gate)*: аудит агент `legal-compliance` ДО выполнения кода, затрагивающего ПДн, AI API, парсинг, оферты. Неблокирующий инвариант: статус `RED` блокирует только рискованный модуль, безопасные части проекта продолжаются.
   - *Quality Gate L2 (Independent Review)*: независимая приемка `qa-engineer` и `code-reviewer`.
5. **Протокол эскалации и замкнутый цикл (Closed-Loop)**:
   - При 2 неудачных попытках на один подход: задача эскалируется на **Level 3: Senior Architect (Pro Tier)**.
   - При повторном тупике: Director генерирует официальный 10-пунктный **Argon Prompt Pack**. Оператор переключает модель на **Gemini 4 Argon (High)**, получает архитектурное решение и через эндпоинт `/api/control/argon-verdict` возвращает задачу на реализацию в **Gemini 3.8 Flash High** (деэскалация).

---

### 2.3. Поток развертывания и онбординга (`installation-flow.mmd`)
Процедура первого запуска включает 7 последовательных фаз:
1. **Phase 1: Repository Acquisition**: клонирование репозитория.
2. **Phase 2: Health Doctor**: автоматическая проверка наличия Node.js (>= 18), `npm`, утилиты `agy.exe` (при отсутствии активируется детерминированный mock-режим) и папки `~/.gemini/antigravity`.
3. **Phase 3: Config Discovery**: проверка `.env`, автогенерация криптографически стойкого 32-байтного API-ключа (`COMMAND_CENTER_API_KEY`) при его отсутствии и сохранение в `.env`.
4. **Phase 4: Dependency Resolution**: установка зависимостей бэкенда (`npm install`) и фронтенда (`npm --prefix client install`), компиляция клиентского бандла.
5. **Phase 5: Agent Rules Deploy & DB Init**: линковка правил 17 агентов в глобальные каталоги плагина, создание таблиц SQLite, включение WAL-режима и сидирование настроек.
6. **Phase 6: Validation Suite**: выполнение полного тест-сьюта (`npm test`: 20 системных тестов, 11 тестов инжестии, 9 тестов супервайзера процессов, 16 сценариев правового аудита).
7. **Phase 7: Runtime Ready**: запуск сервера и клиента через `npm run dev` или `start.cmd`, доступность по адресу `http://127.0.0.1:5173`.

---

### 2.4. Безопасность и границы доверия (`security-architecture.mmd`)
Система реализует эшелонированную защиту с 4 границами доверия:
- **Граница 1: Loopback Isolation (Сетевой сокет)**: Сервер слушает строго адрес `127.0.0.1` (`CONFIG.HOST`). Любые внешние сетевые пакеты отбрасываются операционной системой на уровне сокета.
- **Граница 2: HTTP/WS Ingress**:
  - CORS Whitelist: доступ разрешен только локальным адресам (`localhost:5173`, `127.0.0.1:5173`, `localhost:3000`, `localhost:3001`). Запросы с неизвестным Origin блокируются со статусом HTTP 403 Forbidden.
  - Бутстрап токена (`/api/auth/token`): доступен исключительно локальным loopback-запросам (`isLocalRequest`).
  - Constant-Time Auth: валидация токена через `crypto.timingSafeEqual` предотвращает атаки по времени (Timing Attacks).
  - Защита WebSocket: проверка токена до хэндшейка, ограничение размера фрейма до 64 КБ с немедленным разрывом соединения при превышении.
- **Граница 3: Application Core & Data Defense**:
  - Path Traversal Shield: имена файлов проверяются регулярным выражением `/^[a-zA-Z0-9_-]+\.md$/`, переходы `..` блокируются.
  - Dangerous Command Guard: произвольное выполнение shell-команд через UI запрещено; вызовы `agy` требуют явного флага `confirm: true` и валидации имени агента по белому списку.
  - SQL Injection Shield: 100% запросов к SQLite выполняются через параметризованные Prepared Statements (`@param` или `?`).
- **Граница 4: OS Process Tree Isolation**:
  - `TaskProcessSupervisor` изолирует запуск дочерних процессов `agy.exe`.
  - При отмене или превышении таймаута (120 секунд) вызывается принудительное завершение всего дерева процессов (`taskkill /pid ${pid} /T /F` на Windows, `process.kill(-pid, 'SIGKILL')` на POSIX), что гарантирует отсутствие зомби-процессов.

---

### 2.5. Потоковая обработка событий и телеметрии (`data-flow.mmd`)
Поток телеметрии обеспечивает сбор данных в реальном времени с нулевым риском пропуска данных или повреждения памяти:
1. **Генерация логов**: Движок Antigravity записывает вызовы субагентов, токены и шаги в `~/.gemini/antigravity/brain/<convId>/.system_generated/logs/transcript.jsonl`.
2. **Файловый наблюдатель**: `chokidar` перехватывает событие изменения файла и пропускает его через предикат-фильтр (отсекающий `.tmp`, `.swp`, `.crdownload` и системный мусор).
3. **Очередь IngestionQueue**: файл ставится в очередь с дедупликацией (`enqueuedSet`, `activeSet`, `rerunSet`), предотвращая состояния гонки при частых последовательных записях.
4. **Квантовый ридер JsonlStreamReader**:
   - Читает файл блоками по 64 КБ (`BUFFER_SIZE = 64 * 1024`) начиная с сохраненного смещения `last_offset`.
   - Использует `StringDecoder('utf8')` для бесшовной склейки многобайтовых символов UTF-8 (кириллица, эмодзи), разбитых на границе блока.
   - Автоматически определяет ротацию или усечение файла (`file_size < last_offset`) и безопасно сбрасывает смещение в 0.
   - Устойчив к битому JSON: логирует ошибку, пропускает поврежденную строку и продолжает чтение.
   - Генерирует детерминированные идентификаторы событий (`evt_<convId>_s<stepIndex>_agent_started`).
5. **Атомарная транзакция SQLite WAL**:
   - В единой транзакции выполняет `INSERT OR IGNORE INTO events`, сохраняет прогресс в `log_parse_state` и обновляет счетчики токенов в `session_token_usage` и `model_usage`.
6. **Инвариант Post-Commit**: События публикуются в `EventBus` только **после** успешной фиксации транзакции в SQLite.
7. **Веб-сокет и React FSM**: Брокер транслирует фрейм в WebSocket, где клиентский конечный автомат (`EventStreamClient`) обновляет состояние компонентов React (подсветка активного агента в графе, одометр токенов, канбан задач) без перезагрузки страницы.

---

## 3. Инструкция по визуализации диаграмм

Все `.mmd` файлы используют стандартный синтаксис Mermaid. Для их просмотра вы можете:
1. Использовать расширение **Mermaid Preview** / **Markdown Preview Mermaid Support** в VS Code / Antigravity IDE.
2. Вставить содержимое любого `.mmd` файла в онлайн-редактор [Mermaid Live Editor](https://mermaid.live).
3. Скомпилировать диаграммы в PNG/SVG с помощью Mermaid CLI:
   ```bash
   npx @mermaid-js/mermaid-cli -i docs/diagrams/system-architecture.mmd -o docs/diagrams/system-architecture.png
   ```
