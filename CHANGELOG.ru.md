# Журнал изменений (Changelog)

[English](CHANGELOG.md) • [Русский](CHANGELOG.ru.md) • [Español](CHANGELOG.es.md) • [Français](CHANGELOG.fr.md) • [Português](CHANGELOG.pt.md) • [简体中文](CHANGELOG.zh.md) • [日本語](CHANGELOG.ja.md) • [Deutsch](CHANGELOG.de.md)

Все значимые изменения в проекте **Antigravity Apex** документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/), и проект строго придерживается [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-01

### Первый публичный релиз (Open Source)

Первый релиз **Antigravity Apex** — центра управления мультиагентной системой Google Antigravity под управлением **AI Development Director**.

### Добавлено

#### 1. Управление мультиагентной системой и пул из 17 специалистов
- Полная поддержка 17 специализированных ролей:
  - **Базовые роли**: `director` (Gemini 3.8 Flash High), `researcher` (Flash), `frontend-developer` (Flash), `backend-developer` (Flash), `ui-ux-designer` (Flash), `qa-engineer` (Flash), `code-reviewer` (Flash), `senior-architect` (Pro Tier), `legal-compliance` (Flash).
  - **Профильные специалисты**: `security-engineer` (Flash/Pro), `devops-engineer` (Flash/Pro), `product-manager` (Flash), `ai-evaluation-engineer` (Flash/Pro), `performance-engineer` (Flash/Pro), `accessibility-specialist` (Flash), `database-specialist` (Flash/Pro), `data-engineer` (Flash/Pro).
- Динамический контроль параллелизма: настройка до 6 параллельных субагентов (`MAX_CONCURRENT_SUBAGENTS = 6`), стандартная параллельность 3 и лимит максимум в 2 тяжелые модели уровня Pro одновременно.
- Автоматическая обработка очереди с отслеживанием статусов `QUEUED`, `STARTING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`, `TIMEOUT`.

#### 2. Интеллектуальный движок эскалации к Gemini 4 Argon
- Автономное обнаружение тупиковых ситуаций:
  - Фиксация двух последовательных неудачных попыток в рамках одного подхода.
  - Автоматическая эскалация на **Уровень 3: Senior Architect (Pro Tier)**.
  - При стойком архитектурном тупике — генерация изолированного 18-пунктного **Argon Prompt Pack** с автоматической очисткой системных путей и маскированием секретов.
  - Защита от спама и кулдаун 5 минут на основе хэшей сигнатур.
  - Закрытый контур деэскалации (`POST /api/escalations/:id/response`) с автоматическим разбором рекомендаций и передачей задач Flash-специалистам.

#### 3. Многоступенчатые шлюзы качества и 9-пунктные отчёты
- **Gate 1 (L1 Самоконтроль)**: Обязательные локальные тесты, линтеры и проверка 9-пунктных отчётов субагентов.
- **Gate 2 (L2 Независимый контроль)**: Проверка результатов выделенными ролями `qa-engineer` и `code-reviewer`.
- **Gate 2b (Юридический шлюз Legal Gate)**:
  - Автоматическая оценка соответствия нормам РФ (`RU`: 152-ФЗ, 156-ФЗ, 23-ФЗ локализация, 149-ФЗ, 243-ФЗ регулирование ИИ, ГК РФ Часть IV, 38-ФЗ/479-ФЗ реклама, ЗоЗПП 2300-1 / 69-ФЗ, 54-ФЗ).
  - Нормы ЕС (`EU_NL`: GDPR / UAVG, EU AI Act, ePrivacy).
  - Неблокирующий инвариант: при `BLOCKED_RED` останавливается только рискованная подзадача.

#### 4. Потоковый парсинг логов без повторного чтения диска
- Движок `JsonlStreamReader` для инкрементального чтения транскриптов Antigravity (`transcript.jsonl`) буферами по 64 КБ с сохранением многобайтового UTF-8 (кириллица, эмодзи).
- Отслеживание inode, размера и времени модификации для моментальной реакции на ротацию файлов.
- Детерминированные ID событий по SHA-256 для исключения дубликатов в SQLite.

#### 5. Телеметрия и интеграция с Antigravity
- Монитор активных блокировок присутствия (`~/.gemini/antigravity/presence/*.lock`).
- Разделение подтверждённых **LIVE** токенов и расчётных **ESTIMATED** значений.
- Встроенный редактор базы знаний Директора (`Memory Explorer`).

#### 6. Интерфейс Refero / Vercel со светлой и тёмной темами
- 8 разделов: Mission Control, Агенты, Оркестрация, Аналитика, Задачи, Память, Центр эскалаций, События.
- Нативная поддержка светлой темы Paper White и тёмной темы Obsidian Black.
- Доступность по WCAG 2.1 AA и мобильное адаптивное меню.

#### 7. Экосистема установки одной кнопкой (1-Click Installation)
- **Автономный Windows .EXE установщик**: [`Antigravity-Apex-Setup.exe`](https://github.com/fen3211/antigravity-apex/releases/latest/download/Antigravity-Apex-Setup.exe) (v1.0.0) — полная автоматическая установка в один клик без консоли и без Git (проверка Node.js, скачивание репозитория, развертывание 17 агентов, запуск Doctor и открытие браузера).
- **Скрипт сборки инсталлятора**: [`scripts/installer/build.ps1`](scripts/installer/build.ps1) и исходный код на C# [`scripts/installer/Program.cs`](scripts/installer/Program.cs).
- **Лаунчеры рабочего стола**: двойной клик по [`setup.cmd`](setup.cmd) / [`setup.bat`](setup.bat) (Windows) или запуск [`setup.sh`](setup.sh) (Linux/macOS).
- **Быстрые ежедневные лаунчеры**: [`start.cmd`](start.cmd) / [`start.bat`](start.bat) и [`start.sh`](start.sh).
- **Скрипты развертывания 17 специалистов**: [`scripts/install.ps1`](scripts/install.ps1) (PowerShell) и [`scripts/install.sh`](scripts/install.sh) (Bash) для прямой установки правил и навыков в `~/.gemini/config/plugins/ai-director`.
- **Встроенная диагностика Doctor (19 проверок)**: [`scripts/doctor.js`](scripts/doctor.js) (`npm run doctor`) для мгновенного аудита готовности окружения и SQLite.
- **Удаленные однострочники в терминале**: [`scripts/get.ps1`](scripts/get.ps1) (`irm ... | iex`) и [`scripts/get.sh`](scripts/get.sh) (`curl ... | bash`).
- **Синхронизация из веб-интерфейса**: кнопка **`⚡ 1-Click Setup`** в шапке и кнопка **`1-Click Sync Antigravity`** на странице агентов для мгновенного развертывания конфигураций.
- **Облачный запуск в один клик**: готовый контейнер [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) для GitHub Codespaces.

#### 8. Интернационализация (i18n) на 8 языков
- Полноценная поддержка 8 языков в веб-интерфейсе и документации:
  - 🇬🇧 English (Основной / Primary default)
  - 🇷🇺 Русский
  - 🇪🇸 Español
  - 🇫🇷 Français
  - 🇵🇹 Português
  - 🇨🇳 简体中文
  - 🇯🇵 日本語
  - 🇩🇪 Deutsch
- Выпадающий переключатель языков в шапке (`Header`) с флагами стран.
- Интерактивная панель выбора языка в настройках (`ControlCenter`) с сохранением в `localStorage`.
- Полная параллельная документация на всех 8 языках.
