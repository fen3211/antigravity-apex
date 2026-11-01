# Руководство по установке и настройке

[English](INSTALLATION.md) • [Русский](INSTALLATION.ru.md)

Это подробное пошаговое руководство по установке и настройке **AI Command Center** в операционных системах **Windows**, **macOS** и **Linux**, включая установку одной кнопкой, однострочники для терминала и ручной запуск.

---

## ⚡ Установка в 1 клик (One-Click)

### Быстрая установка в Windows (1 клик)
1. Скачайте или клонируйте этот репозиторий.
2. Дважды кликните по файлу [`setup.cmd`](../setup.cmd) (или [`setup.bat`](../setup.bat)) в корне проекта.
3. Скрипт автоматически установит все зависимости, развернёт конфигурацию из 17 агентов в `~/.gemini/config/plugins/ai-director`, выполнит диагностику `doctor.js`, запустит сервер и откроет браузер по адресу `http://127.0.0.1:5173/`.

### Быстрая установка в Linux / macOS (1 клик)
```bash
chmod +x setup.sh && ./setup.sh
```

### Удаленный однострочник (без предварительного клонирования)
- **Windows (PowerShell)**:
  ```powershell
  irm https://raw.githubusercontent.com/fen3211/ai-command-center/main/scripts/get.ps1 | iex
  ```
- **Linux & macOS (Bash)**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/fen3211/ai-command-center/main/scripts/get.sh | bash
  ```

---

## 1. Системные требования и предварительные условия

### Минимальные требования
- **Node.js**: версия `v18.0.0` или выше (протестировано на Node.js v20.x LTS и v24.x).
- **npm**: версия `v9.0.0` или выше.
- **ОЗУ**: минимум 2 ГБ (рекомендуется 4 ГБ при высокой параллельности субагентов).
- **Место на диске**: 200 МБ свободного места для зависимостей и базы SQLite.
- **Операционная система**:
  - Windows 10/11 (64-бит)
  - macOS 12+ (Apple Silicon или Intel)
  - Ubuntu 22.04+ / Debian 11+ / Fedora 38+ / Arch Linux

### Окружение Antigravity (Опционально, но рекомендуется)
Для живого мониторинга сессий и телеметрии:
- Установленный Google Antigravity.
- Стандартная рабочая директория `~/.gemini/antigravity/` (в Windows: `%USERPROFILE%\.gemini\antigravity`).
- Исполняемый файл CLI `agy.exe` (в Windows обычно `%LOCALAPPDATA%\agy\bin\agy.exe`).

> [!NOTE]
> AI Command Center отлично работает и без запущенного Antigravity. В этом случае дашборд сохраняет задачи в локальную базу SQLite и отображает телеметрию в автономном режиме.

---

## 2. Ручная установка шаг за шагом

### Шаг 1: Клонирование репозитория
```bash
git clone https://github.com/fen3211/ai-command-center.git
cd ai-command-center
```

### Шаг 2: Установка зависимостей бэкенда
```bash
npm install
```

### Шаг 3: Установка зависимостей фронтенда
```bash
npm --prefix client install
```

### Шаг 4: Настройка переменных окружения
Скопируйте шаблон `.env.example` в `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

При первом запуске, если переменная `COMMAND_CENTER_API_KEY` не заполнена, сервер автоматически создаст 32-байтный токен и запишет его в `.env`.

### Шаг 5: Развертывание агентов и правил Antigravity
Разверните комплект из 17 агентов, правил и навыков в ваше окружение Antigravity:

**Windows (PowerShell):**
```powershell
.\scripts\install.ps1 -Force
```

**macOS / Linux:**
```bash
./scripts/install.sh --force
```

---

## 3. Инициализация базы данных

База данных SQLite (`command_center.sqlite`) инициализируется автоматически при первом старте сервера.

Особенности базы данных:
- **Движок**: `better-sqlite3` с нативными биндингами C++.
- **Режим журнала**: **WAL (Write-Ahead Logging)** для параллельного неблокирующего чтения и атомарной записи.
- **Прагмы**: `busy_timeout = 5000` для исключения ошибок блокировки при частых записях логов.
- **Таблицы**: `tasks`, `events`, `settings`, `model_usage`, `session_token_usage`, `log_parse_state`, `legal_assessments`, `escalations`.

Ручные миграции SQL не требуются.

---

## 4. Диагностика окружения (`npm run doctor`)

Запустите встроенную диагностику в любой момент:

```bash
npm run doctor
```

Проверяет:
- Версии среды выполнения Node.js и npm
- Доступность Git
- Режим WAL и целостность базы данных SQLite
- Наличие всех 17 файлов определений субагентов
- Правила оркестрации и навыки (`director-orchestration`, `argon-escalation`)
- Каталоги Antigravity (`brain`, `presence`, `knowledge`)

---

## 5. Запуск тестов

Убедитесь, что все компоненты функционируют штатно:

```bash
npm test
```

Запускаются 8 специализированных тестовых сьютов:
1. `tests/api.test.ts`: Безопасность REST API, CORS, токены, защита от инъекций CLI.
2. `tests/ingestion.test.ts`: Инкрементальный парсер потоков, чанки по 64 КБ, ротация файлов.
3. `tests/analytics.test.ts`: Разделение LIVE и ESTIMATED токенов, учёт стоимости.
4. `tests/websocket-resilience.test.ts`: Авторизация WebSocket, защита от перегрузки, ping-pong.
5. `tests/process-supervisor.test.ts`: Запуск процессов, таймауты, дерево процессов и завершение без зомби.
6. `tests/legal-compliance.test.ts`: Юридический шлюз 2b по 16 правовым сценариям.
7. `tests/backend-audit.test.ts`: Кроссплатформенность, защита от обхода путей (Path Traversal), Doctor.
8. `tests/intelligent-argon-escalation.test.ts`: Эскалация L4, генератор 18-пунктных промпт-паков, кулдаун.

Все тесты должны завершиться со статусом **0 ошибок**.

---

## 6. Режимы запуска

### Режим A: Режим разработки (Hot-Reload)
```bash
npm run dev
```

### Режим B: Быстрый запуск в Windows
Дважды кликните по [`start.cmd`](../start.cmd).

### Режим C: Сборка и запуск для Production
```bash
npm run server:build
npm --prefix client run build
npm start
```
