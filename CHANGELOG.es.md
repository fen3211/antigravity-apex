# Registro de Cambios (Changelog)

[English](CHANGELOG.md) • [Русский](CHANGELOG.ru.md) • [Español](CHANGELOG.es.md) • [Français](CHANGELOG.fr.md) • [Português](CHANGELOG.pt.md) • [简体中文](CHANGELOG.zh.md) • [日本語](CHANGELOG.ja.md) • [Deutsch](CHANGELOG.de.md)

Todos los cambios notables en **Antigravity Apex** están documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-01

### Lanzamiento Inicial de Código Abierto (Open Source)

Versión inicial de producción de **Antigravity Apex**, el panel de control de misión y supervisión de telemetría multiagente para Google Antigravity y el marco **AI Development Director**.

### Añadido

#### 1. Orquestación Multiagente y Grupo Canónico de 17 Roles Especialistas
- Soporte integral para 17 roles especializados:
  - **Roles Centrales**: `director` (Gemini 3.8 Flash High), `researcher` (Flash), `frontend-developer` (Flash), `backend-developer` (Flash), `ui-ux-designer` (Flash), `qa-engineer` (Flash), `code-reviewer` (Flash), `senior-architect` (Nivel Pro), `legal-compliance` (Flash).
  - **Especialistas de Dominio**: `security-engineer` (Flash/Pro), `devops-engineer` (Flash/Pro), `product-manager` (Flash), `ai-evaluation-engineer` (Flash/Pro), `performance-engineer` (Flash/Pro), `accessibility-specialist` (Flash), `database-specialist` (Flash/Pro), `data-engineer` (Flash/Pro).
- Control de concurrencia dinámico: configurable hasta 6 subagentes paralelos (`MAX_CONCURRENT_SUBAGENTS = 6`), concurrencia predeterminada de 3 y límite de 2 modelos Pro simultáneos.
- Vaciado automático de cola con seguimiento de estados `QUEUED`, `STARTING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED` y `TIMEOUT`.

#### 2. Motor de Escalada Inteligente a Gemini 4 Argon (Nivel 4)
- Implementación completa del protocolo de escalada Argon:
  - Detección autónoma de 2 intentos fallidos consecutivos por enfoque.
  - Escalada automática al **Nivel 3: Senior Architect (Pro Tier)**.
  - En caso de bloqueo arquitectónico persistente: generación de un **Argon Prompt Pack** de 18 puntos desinfectado sin fugas de secretos o rutas privadas.
  - Memoria de rechazo y enfriamiento anti-spam por firma SHA-256 (5 minutos).
  - Endpoint de resolución de circuito cerrado (`POST /api/escalations/:id/response`) que devuelve soluciones arquitectónicas validadas a los especialistas Flash para su ejecución.

#### 3. Puertas de Calidad Multinivel y Reportes de 9 Puntos
- **Gate 1 (Autoverificación L1)**: Pruebas unitarias locales, linters y validación de reportes estrictos de 9 puntos.
- **Gate 2 (Verificación Independiente L2)**: Auditoría automatizada por `qa-engineer` y `code-reviewer`.
- **Gate 2b (Puerta Legal y de Cumplimiento)**:
  - Evaluación automatizada en jurisdicciones rusa (`RU`: 152-FZ, 156-FZ, 243-FZ IA) y europea (`EU_NL`: RGPD, Ley de IA de la UE).
  - Invariante no bloqueante: detiene solo la suboperación riesgosa mientras permite que continúen las tareas seguras.

#### 4. Ingestión Incremental de Registros sin Carga de Disco
- Motor `JsonlStreamReader` para leer transcripciones en vivo (`transcript.jsonl`) en búferes de 64 KB con protección UTF-8 multibyte.
- Detección inmediata de rotación, truncamiento o reemplazo de archivos mediante seguimiento de inodos y marcas de tiempo.
- IDs de eventos deterministas mediante SHA-256 para evitar duplicados en SQLite.

#### 5. Telemetría en Tiempo Real y Puente Antigravity
- Monitor de bloqueos de presencia activos (`~/.gemini/antigravity/presence/*.lock`).
- Separación estricta de tokens confirmados **LIVE** y proyectados **ESTIMATED**.
- Explorador de Memoria interactivo (`Memory Explorer`) para ver y editar documentos de la base de conocimiento del Director.

#### 6. Sistema de Diseño Refero / Vercel con Temas Claro y Oscuro
- Interfaz de ingeniería limpia con tema Claro (Paper White `#FAFAFA`) y Oscuro (Obsidian Black `#0A0A0A`).
- Cero parpadeo al cargar (Zero FOUT) mediante script inline.
- Ratios de contraste accesibles (WCAG 2.1 AA) y panel lateral adaptable a móviles.

#### 7. Ecosistema de Instalación en 1 Clic
- **Instalador ejecutable para Windows**: [`Antigravity-Apex-Setup.exe`](https://github.com/fen3211/antigravity-apex/releases/latest/download/Antigravity-Apex-Setup.exe) (v1.0.0) — instalación nativa automática sin consola ni Git.
- **Lanzadores de escritorio**: [`setup.cmd`](setup.cmd) / [`setup.bat`](setup.bat) para Windows y [`setup.sh`](setup.sh) para Linux/macOS.
- **Lanzadores rápidos diarios**: [`start.cmd`](start.cmd) / [`start.bat`](start.bat) y [`start.sh`](start.sh).
- **Scripts de despliegue de 17 especialistas**: [`scripts/install.ps1`](scripts/install.ps1) (PowerShell) y [`scripts/install.sh`](scripts/install.sh) (Bash).
- **Diagnóstico del sistema Doctor**: [`scripts/doctor.js`](scripts/doctor.js) (`npm run doctor`) con 19 verificaciones automáticas.
- **Instaladores remotos de una línea**: [`scripts/get.ps1`](scripts/get.ps1) y [`scripts/get.sh`](scripts/get.sh).
- **Sincronización en la interfaz web**: botón `⚡ 1-Click Setup` en la barra superior.
- **Espacio en la nube en 1 clic**: [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) para GitHub Codespaces.

#### 8. Internacionalización Multilingüe (8 Idiomas)
- Soporte para 8 idiomas en el panel web y la documentación técnica:
  - 🇬🇧 English (Principal / Predeterminado)
  - 🇷🇺 Ruso
  - 🇪🇸 Español
  - 🇫🇷 Francés
  - 🇵🇹 Portugués
  - 🇨🇳 Chino Simplificado
  - 🇯🇵 Japonés
  - 🇩🇪 Alemán
- Selector desplegable de idiomas en la cabecera (`Header`) con banderas de emojis.
- Selector interactivo de tarjetas de idioma en Ajustes (`ControlCenter`) con persistencia en `localStorage`.
- Suite completa de documentación paralela en los 8 idiomas.
