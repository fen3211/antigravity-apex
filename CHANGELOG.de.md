# Änderungsprotokoll (Changelog)

[English](CHANGELOG.md) • [Русский](CHANGELOG.ru.md) • [Español](CHANGELOG.es.md) • [Français](CHANGELOG.fr.md) • [Português](CHANGELOG.pt.md) • [简体中文](CHANGELOG.zh.md) • [日本語](CHANGELOG.ja.md) • [Deutsch](CHANGELOG.de.md)

Alle nennenswerten Änderungen an **Antigravity Apex** sind in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [1.0.0] - 2026-11-01

### Erstes Open-Source-Release

Die erste produktionsreife Version von **Antigravity Apex**, dem Missionskontroll- und Telemetrie-Dashboard für Google Antigravity und das **AI Development Director**-Framework.

### Hinzugefügt (Added)

#### 1. Multi-Agenten-Orchestrierung & 17-Rollen-Spezialistenpool
- Umfassende Unterstützung für 17 spezialisierte Ingenieurrollen:
  - **Kernrollen**: `director` (Gemini 3.8 Flash High), `researcher` (Flash), `frontend-developer` (Flash), `backend-developer` (Flash), `ui-ux-designer` (Flash), `qa-engineer` (Flash), `code-reviewer` (Flash), `senior-architect` (Pro Tier), `legal-compliance` (Flash).
  - **Fachspezialisten**: `security-engineer` (Flash/Pro), `devops-engineer` (Flash/Pro), `product-manager` (Flash), `ai-evaluation-engineer` (Flash/Pro), `performance-engineer` (Flash/Pro), `accessibility-specialist` (Flash), `database-specialist` (Flash/Pro), `data-engineer` (Flash/Pro).
- Dynamische Parallelitätssteuerung: Bis zu 6 parallele Subagenten gleichzeitig (`MAX_CONCURRENT_SUBAGENTS = 6`), Standard-Parallelität von 3 und Obergrenze von 2 Pro-Modellen gleichzeitig.
- Automatisches Warteschlangenmanagement mit Statusverfolgung (`QUEUED`, `STARTING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`, `TIMEOUT`).

#### 2. Intelligente Level-4-Eskalations-Engine zu Gemini 4 Argon
- Vollständige Implementierung des Argon-Eskalationsprotokolls:
  - Autonome Erkennung von 2 aufeinanderfolgenden Fehlversuchen pro Ansatz.
  - Automatische Eskalation auf **Level 3: Senior Architect (Pro Tier)**.
  - Bei persistenten Architekturblockaden: Erstellung eines strukturierten 18-Punkte-**Argon Prompt Packs** ohne Preisgabe sensibler Pfade oder Tokens.
  - 5-Minuten-Spamschutz-Cooldown und Ablehnungsgedächtnis basierend auf SHA-256-Signaturen.
  - Closed-Loop-Lösungsrückführung (`POST /api/escalations/:id/response`) zur Ausführung durch Flash-Spezialisten.

#### 3. Mehrstufige Qualitätstore & 9-Punkte-Berichtswesen
- **Gate 1 (L1-Selbstprüfung)**: Lokale Unit-Tests, Linter und strenge 9-Punkte-Statusberichte.
- **Gate 2 (L2-Unabhängige Prüfung)**: Automatisierte Abnahme durch `qa-engineer` und `code-reviewer`.
- **Gate 2b (Rechtliches Compliance-Gate)**: DSGVO/GDPR, EU AI Act und Urheberrechtsprüfung.

#### 4. Inkrementelles Log-Streaming ohne Festplattenbelastung
- `JsonlStreamReader`-Engine liest Antigravity-Transkripte (`transcript.jsonl`) in 64-KB-Puffern mit voller UTF-8-Multi-Byte-Sicherheit.
- Inode- und Zeitstempel-Überwachung zur sofortigen Erkennung von Log-Rotationen.
- Deterministische Event-IDs via SHA-256 zur Vermeidung von Dubletten in SQLite.

#### 5. Echtzeit-Telemetrie & Antigravity-Bridge
- Überwachung aktiver Präsenzsperren (`~/.gemini/antigravity/presence/*.lock`).
- Strikte Trennung von bestätigten **LIVE**-Tokens und geschätzten **ESTIMATED**-Tokens.
- Interaktiver Wissensdatenbank-Editor (`Memory Explorer`).

#### 6. Refero / Vercel-Designsystem mit Hell- & Dunkelmodus
- Aufgeräumte Benutzeroberfläche mit hellem (Paper White `#FAFAFA`) und dunklem Design (Obsidian Black `#0A0A0A`).
- Kein Aufblitzen beim Laden (Zero FOUT) durch Inline-Head-Skript, WCAG 2.1 AA-konform.

#### 7. 1-Klick-Installations-Ökosystem
- **Eigenständiger Windows-Installer (.EXE)**: [`Antigravity-Apex-Setup.exe`](https://github.com/fen3211/antigravity-apex/releases/latest/download/Antigravity-Apex-Setup.exe) (v1.0.0) — Vollautomatische native Installation ohne Terminal oder Git.
- **Desktop-Starter**: [`setup.cmd`](setup.cmd) / [`setup.bat`](setup.bat) für Windows und [`setup.sh`](setup.sh) für Linux/macOS.
- **Tägliche Schnellstarter**: [`start.cmd`](start.cmd) / [`start.bat`](start.bat) und [`start.sh`](start.sh).
- **17-Agenten-Bereitstellungsskripte**: [`scripts/install.ps1`](scripts/install.ps1) und [`scripts/install.sh`](scripts/install.sh).
- **Diagnose-Tool Doctor**: [`scripts/doctor.js`](scripts/doctor.js) (`npm run doctor`) mit 19 automatischen Systemtests.
- **Terminal-Einzeiler**: [`scripts/get.ps1`](scripts/get.ps1) und [`scripts/get.sh`](scripts/get.sh).
- **Web-UI-Synchronisation**: Button `⚡ 1-Click Setup` in der Kopfzeile.
- **Cloud-Sandbox**: [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json).

#### 8. Mehrsprachige Internationalisierung (8 Sprachen)
- Vollständige Unterstützung für 8 Sprachen im Web-Dashboard und in der Dokumentation:
  - 🇬🇧 Englisch (Primary / Standard)
  - 🇷🇺 Russisch
  - 🇪🇸 Spanisch
  - 🇫🇷 Französisch
  - 🇵🇹 Portugiesisch
  - 🇨🇳 Vereinfachtes Chinesisch
  - 🇯🇵 Japanisch
  - 🇩🇪 Deutsch
- Dropdown-Sprachwähler in der Kopfzeile (`Header`) mit Flaggen-Icons.
- Interaktives Sprachkarten-Menü in den Einstellungen (`ControlCenter`) mit Speicherung im `localStorage`.
- Komplette Dokumentationssuite in allen 8 Sprachen verfügbar.
