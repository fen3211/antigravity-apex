# AI Development Director - Пакет конфигурации агентов

[English](README.md) • [Русский](README.ru.md)

Этот пакет содержит полную, протестированную в реальной разработке конфигурацию для мультиагентной системы **AI Development Director** в Google Antigravity.

## Состав пакета

- **`agents/`**: Универсальные Markdown-определения для всех 17 ролей специалистов:
  1. `director` (Gemini 3.8 Flash High — Главный координатор и оркестратор)
  2. `researcher` (Gemini Flash — Исследование документации и кодовой базы)
  3. `senior-architect` (Gemini Pro — Сложная системная архитектура и эскалация L3)
  4. `frontend-developer` (Gemini Flash — React, Next.js, CSS, адаптивный UI)
  5. `backend-developer` (Gemini Flash — API, серверная логика, схемы, базы данных)
  6. `ui-ux-designer` (Gemini Flash — UX-исследования, эргономика, дизайн-системы)
  7. `qa-engineer` (Gemini Flash — Автоматизированное тестирование и шлюзы качества)
  8. `code-reviewer` (Gemini Flash — Независимый аудит изменений и код-стайл)
  9. `legal-compliance` (Gemini Flash — Юридический советник и технический писатель)
  10. `security-engineer` (Gemini Flash / Pro — Аудит безопасности OWASP и DevSecOps)
  11. `devops-engineer` (Gemini Flash / Pro — CI/CD, Docker, супервизор процессов)
  12. `product-manager` (Gemini Flash — Анализ требований, User Stories, MVP)
  13. `ai-evaluation-engineer` (Gemini Flash / Pro — Оценка качества моделей и эвалы)
  14. `performance-engineer` (Gemini Flash / Pro — Оптимизация Core Web Vitals и профилирование)
  15. `accessibility-specialist` (Gemini Flash — Доступность по стандарту WCAG 2.1/2.2)
  16. `database-specialist` (Gemini Flash / Pro — Схемы SQLite/PostgreSQL, миграции, индексы)
  17. `data-engineer` (Gemini Flash / Pro — Потоки данных, парсинг транскриптов, дедупликация)

- **`rules/`**: Глобальные системные правила и операционные инварианты:
  - `AGENTS.md`: Лимиты параллелизма (до 6 субагентов, стандарт 3, макс 2 Pro), Legal Gate 2b, протокол эскалации к Argon.
  - `GEMINI.md`: Полная персона Директора, матрица триажа задач, многоступенчатый контроль качества.

- **`skills/`**: Операционные регламенты:
  - `director-orchestration/SKILL.md`: Базовый регламент по оценке задач, выбору ролей и проверкам.
  - `argon-escalation/SKILL.md`: Регламент эскалации Уровня 4 к Gemini 4 Argon.

- **`templates/`**: Шаблоны для расширения системы:
  - `agent-template.md`: Шаблон создания нового специализированного агента.
  - `skill-template.md`: Шаблон создания навыка.
  - `project-rules-template.md`: Шаблон проектных правил.
  - `escalation-pack-template.md`: Шаблон промпт-пака эскалации Argon.

## ⚡ Установка одной кнопкой (1-Click)

### Windows (1-Click)
Запустите `..\setup.cmd` или выполните в PowerShell:
```powershell
..\scripts\install.ps1 -Force
```

### macOS / Linux (1-Click)
```bash
../scripts/install.sh --force
```

### Кнопка «1-Click Setup» в интерфейсе
В веб-интерфейсе AI Command Center нажмите кнопку **`⚡ 1-Click Setup`** в шапке или **`1-Click Sync Antigravity`** на вкладке «Агенты».
