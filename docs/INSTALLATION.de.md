# Installations- und Setup-Anleitung

[English](INSTALLATION.md) • [Русский](INSTALLATION.ru.md) • [简体中文](INSTALLATION.zh.md) • [日本語](INSTALLATION.ja.md) • [Deutsch](INSTALLATION.de.md)

Diese Anleitung bietet eine umfassende Schritt-für-Schritt-Anleitung zur Installation und Konfiguration von **Antigravity Apex** unter **Windows**, **macOS** und **Linux**, einschließlich 1-Klick-Startskripten, Terminal-Einzeilern und manuellem Setup.

---

## ⚡ 1-Klick-Schnellinstallation

### Windows 1-Klick Setup
1. Laden Sie dieses Repository herunter oder klonen Sie es.
2. Doppelklicken Sie auf [`setup.cmd`](../setup.cmd) (oder [`setup.bat`](../setup.bat)) im Projektstammverzeichnis.
3. Das Skript installiert alle Abhängigkeiten, richtet die 17-Agenten-Konfiguration in `~/.gemini/config/plugins/ai-director` ein, führt `doctor.js` aus, startet den Server und öffnet `http://127.0.0.1:5173/` in Ihrem Browser.

### Linux / macOS 1-Klick Setup
```bash
chmod +x setup.sh && ./setup.sh
```

### Remote-Einzeiler (Kein Klonen erforderlich)
- **Windows (PowerShell)**:
  ```powershell
  irm https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.ps1 | iex
  ```
- **Linux & macOS (Bash)**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash
  ```

---

## 1. Systemanforderungen & Voraussetzungen

### Mindestanforderungen
- **Node.js**: `v18.0.0` oder höher (getestet unter Node.js v20.x LTS und v24.x).
- **npm**: `v9.0.0` oder höher.
- **Arbeitsspeicher (RAM)**: Mindestens 2 GB (4 GB oder mehr für parallele Subagenten empfohlen).
- **Festplattenspeicher**: Mindestens 200 MB freier Speicherplatz für Abhängigkeiten und SQLite-Datenbank.
- **Unterstützte Betriebssysteme**:
  - Windows 10/11 (64-Bit)
  - macOS 12+ (Apple Silicon oder Intel)
  - Ubuntu 22.04+ / Debian 11+ / Fedora 38+ / Arch Linux

### Antigravity-Laufzeitumgebung (Optional, aber empfohlen)
Für die vollständige Live-Sitzungs- und Telemetrieüberwachung:
- Installiertes Google Antigravity auf dem lokalen System.
- Standard-Arbeitsbereichsverzeichnis unter `~/.gemini/antigravity/` (unter Windows: `%USERPROFILE%\.gemini\antigravity`).
- Antigravity CLI Binary `agy.exe` (unter Windows typischerweise unter `%LOCALAPPDATA%\agy\bin\agy.exe`).

> [!NOTE]
> Antigravity Apex funktioniert auch dann einwandfrei, wenn Antigravity nicht aktiv ist. In diesem Fall arbeitet das Dashboard mit lokalem Aufgabenmanagement, SQLite-Persistenz und simulierter Telemetrie.

---

## 2. Manuelle Schritt-für-Schritt-Installation

### Schritt 1: Repository klonen
```bash
git clone https://github.com/fen3211/antigravity-apex.git
cd antigravity-apex
```

### Schritt 2: Backend-Abhängigkeiten installieren
```bash
npm install
```

### Schritt 3: Frontend-Client-Abhängigkeiten installieren
```bash
npm --prefix client install
```

### Schritt 4: Umgebungsvariablen konfigurieren
Kopieren Sie die Vorlage `.env.example` nach `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Beim ersten Start generiert der Server automatisch ein kryptografisch sicheres 32-Byte-Token und speichert dieses in `.env`, falls `COMMAND_CENTER_API_KEY` leer ist.

### Schritt 5: Antigravity-Agenten & Skills bereitstellen
Installieren Sie die 17 Spezialisten, Regeln und Skills in Ihrer Antigravity-Umgebung:

**Windows (PowerShell):**
```powershell
.\scripts\install.ps1 -Force
```

**macOS / Linux:**
```bash
./scripts/install.sh --force
```

---

## 3. Datenbank-Initialisierung

Die SQLite-Datenbank (`command_center.sqlite`) wird beim Starten des Servers automatisch initialisiert.

Wesentliche Merkmale:
- **Engine**: `better-sqlite3` mit nativen C++ Bindings.
- **Journal-Modus**: **WAL (Write-Ahead Logging)** für sperrfreie Lesezugriffe und maximale atomare Schreibleistung.
- **Pragmas**: `busy_timeout = 5000` zur Vermeidung von Datenbank-Locks bei hohen Stream-Lasten.
- **Tabellen**: `tasks`, `events`, `settings`, `model_usage`, `session_token_usage`, `log_parse_state`, `legal_assessments`, `escalations`.

Es sind keine manuellen SQL-Migrationsskripte erforderlich.

---

## 4. Systemdiagnose (`npm run doctor`)

Führen Sie die umfassende Systemprüfung jederzeit aus:

```bash
npm run doctor
```

Prüft:
- Laufzeitversionen von Node.js & npm
- Git-Verfügbarkeit und Branch-Status
- SQLite WAL-Modus und Schemaintegrität
- Vorhandensein aller 17 Agentendefinitionen
- Orchestrierungsregeln und Skills (`director-orchestration`, `argon-escalation`)
- Antigravity-Verzeichnisse (`brain`, `presence`, `knowledge`)

---

## 5. Verifikation & Tests

Stellen Sie sicher, dass alle Systemanforderungen erfüllt sind, indem Sie die Test-Suite ausführen:

```bash
npm test
```

Führt alle 8 spezialisierten Test-Suites aus:
1. `tests/api.test.ts`: REST-API-Sicherheit, CORS, Authentifizierung und CLI-Injektionsschutz.
2. `tests/ingestion.test.ts`: Inkrementeller Stream-Reader, 64-KB-Chunking und Dateirotation.
3. `tests/analytics.test.ts`: LIVE vs. ESTIMATED Token-Metriken und Kostenberechnung.
4. `tests/websocket-resilience.test.ts`: WebSocket-Authentifizierung, Payload-Grenzen, Ping-Pong-Heartbeats.
5. `tests/process-supervisor.test.ts`: Subagenten-Prozesssteuerung, Tree-Kill-Timeouts und Nebenläufigkeitskontrolle.
6. `tests/legal-compliance.test.ts`: Compliance-Audit nach Gate 2b über 16 gesetzliche Szenarien.
7. `tests/backend-audit.test.ts`: Plattformübergreifende Pfaderkennung, Path-Traversal-Schutz und System-Doctor.
8. `tests/intelligent-argon-escalation.test.ts`: Stufe-4-Argon-Eskalation, 18-Punkte-Prompt-Pack und Anti-Spam-Cooldown.

---

## 6. Start-Modi

### Modus A: Entwicklungsmodus (Hot-Reload)
```bash
npm run dev
```

### Modus B: Windows 1-Klick Schnellstart
Doppelklicken Sie auf [`start.cmd`](../start.cmd).

### Modus C: Produktions-Build & Start
```bash
npm run server:build
npm --prefix client run build
npm start
```
