# Руководство по интеграции с Google Antigravity

[English](ANTIGRAVITY.md) • [Русский](ANTIGRAVITY.ru.md)

В этом руководстве подробно описаны механизмы интеграции между **AI Command Center** и локальной средой выполнения мультиагентных систем **Google Antigravity**.

---

## 1. Архитектура Antigravity и структура файловой системы

Google Antigravity хранит состояние субагентов, транскрипты выполнения и базу знаний в домашней директории пользователя (`~/.gemini/antigravity/`):

```text
~/.gemini/
├── antigravity/
│   ├── brain/
│   │   └── <conversation-id>/
│   │       ├── .system_generated/
│   │       │   └── logs/
│   │       │       └── transcript.jsonl      <-- Потоковый парсинг через JsonlStreamReader
│   │       ├── scratch/                      <-- Временные файлы и тестовые скрипты
│   │       └── ...
│   ├── presence/
│   │   ├── session-1.lock                    <-- Мониторинг активных блокировок
│   │   └── session-2.lock
│   ├── knowledge/
│   │   └── ai-director/
│   │       ├── DIRECTOR_PROTOCOL.md          <-- Чтение/редактирование в Memory Explorer
│   │       ├── AGENT_REGISTRY.md
│   │       ├── MODEL_ROUTING_POLICY.md
│   │       ├── ESCALATION_POLICY.md
│   │       ├── QUALITY_GATES.md
│   │       ├── FAILURE_LOG.md
│   │       ├── VERIFIED_SOLUTIONS.md
│   │       └── PROJECT_SPECIFIC_LESSONS.md
│   └── conversations/                        <-- История сессий
└── config/
    └── plugins/
        └── ai-director/
            ├── agents/                       <-- Markdown-определения 17 ролей
            ├── rules/                        <-- Глобальные операционные правила (AGENTS.md)
            └── skills/                       <-- Навыки специалистов (SKILL.md)
```

---

## 2. Инкрементальный парсинг транскриптов и учет токенов

### Путь к файлам
`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`

### Механизм обработки
AI Command Center отслеживает эти файлы с помощью библиотеки `chokidar` и обрабатывает новые записи через `JsonlStreamReader`:
1. **Инкрементальные смещения**: Парсер читает только байты, добавленные с момента предыдущего сканирования (`last_offset`), исключая повторное чтение.
2. **Чанкинг и сохранение UTF-8**: Данные считываются буферами по 64 КБ. Незавершённые многобайтовые последовательности UTF-8 на стыках чанков сохраняются до прихода следующей порции данных, что гарантирует сохранность кириллицы и эмодзи.
3. **Извлечение метрик расхода**: Движок извлекает из записей:
   - `input_tokens` (входные токены)
   - `output_tokens` (выходные токены)
   - `cache_read_tokens` (токены, прочитанные из кэша контекста)
   - `step_count` (номер шага)
4. **Происхождение данных (Data Provenance)**:
   - Метрики из подтверждённых файлов `transcript.jsonl` помечаются меткой **`LIVE`**.
   - Агрегированные оценки или данные без живых транскриптов маркируются как **`ESTIMATED`** или **`DEMO`**.

---

## 3. Детектор активного присутствия (Presence)

### Путь к файлам
`~/.gemini/antigravity/presence/*.lock`

### Принцип работы
- Antigravity создаёт файл `.lock` при каждом запуске активной сессии субагента.
- Монитор `chokidar` отслеживает события `add`, `change` и `unlink` в папке `CONFIG.PRESENCE_DIR`.
- При появлении лок-файла счётчик `activeLocksCount` увеличивается, а сессия получает статус **LIVE**.
- При завершении или остановке процесса субагента файл блокировки удаляется, а статус возвращается в `idle`.

---

## 4. База знаний Директора и редактор памяти

### Каталог базы знаний
`~/.gemini/antigravity/knowledge/ai-director/`

AI Command Center содержит встроенный Markdown-браузер и редактор регламентов Директора.

### Основные документы базы знаний

| Документ | Назначение |
|---|---|
| `DIRECTOR_PROTOCOL.md` | Базовые правила взаимодействия, критерии триажа соло/субагенты и лимиты ресурсов. |
| `AGENT_REGISTRY.md` | Каталог доступных специалистов пула и назначенных моделей. |
| `MODEL_ROUTING_POLICY.md` | Правила маршрутизации моделей (Gemini 3.8 Flash vs Pro vs Argon). |
| `ESCALATION_POLICY.md` | Регламент лимита в 2 попытки, эскалации к Senior Architect (L3) и Argon (L4). |
| `QUALITY_GATES.md` | Стандарты Gate 1 (отчёт из 9 пунктов), Gate 2 (QA/Review), Gate 2b (Legal). |
| `FAILURE_LOG.md` | Журнал разбора инцидентов, антипаттерны и ошибки проектирования. |
| `VERIFIED_SOLUTIONS.md` | Проверенные архитектурные паттерны и шаблоны кода. |
| `PROJECT_SPECIFIC_LESSONS.md`| Уроки и специфические соглашения конкретного проекта. |

### REST API интеграция
- `GET /api/knowledge`: Список всех доступных файлов базы знаний.
- `GET /api/knowledge/:filename`: Получение сырого markdown-контента документа.
- `POST /api/knowledge/:filename`: Атомарное сохранение изменений на диск.

---

## 5. Исполняемый мост CLI (`agy.exe`)

Command Center проверяет наличие бинарного файла `agy.exe` (или `agy` в Unix) в путях:
- Windows: `%LOCALAPPDATA%\agy\bin\agy.exe` или системный `PATH`.
- Linux/macOS: `~/.local/bin/agy`, `/usr/local/bin/agy` или `/opt/homebrew/bin/agy`.

При наличии CLI мост поддерживает безопасное выполнение проверенных команд:
- Проверка доступных моделей: `agy models`
- Проверка плагинов: `agy plugins list`
- Безопасное выполнение промптов с защитой от шелл-инъекций
