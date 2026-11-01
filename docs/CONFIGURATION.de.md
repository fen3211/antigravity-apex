[English](CONFIGURATION.md) • [Русский](CONFIGURATION.ru.md) • [简体中文](CONFIGURATION.zh.md) • [日本語](CONFIGURATION.ja.md) • [Deutsch](CONFIGURATION.de.md)

# Konfigurationsreferenz

Dieses Dokument bietet eine vollständige Übersicht über alle statischen und dynamischen Konfigurationsoptionen in **Antigravity Apex**.

---

## 1. Umgebungsvariablen (`.env`)

Antigravity Apex lädt Konfigurationen beim Start über `dotenv` aus der Datei `.env`. Alle Parameter verfügen über praxiserprobte Standardwerte.

### Server-Netzwerk & Laufzeit

| Variable | Typ | Standard | Beschreibung |
|----------|-----|----------|-------------|
| `PORT` | `number` | `3001` | Der HTTP- und WebSocket-Port des Express-Backends. |
| `HOST` | `string` | `127.0.0.1` | Die IP-Netzwerkschnittstelle. Standardmäßig auf die lokale Loopback-Adresse beschränkt. |
| `NODE_ENV` | `string` | `development` | In Produktionsumgebungen auf `production` setzen, um Caching zu aktivieren und Verbose-Logs zu deaktivieren. |

### Sicherheit & Authentifizierung

| Variable | Typ | Standard | Beschreibung |
|----------|-----|----------|-------------|
| `COMMAND_CENTER_API_KEY` | `string` | *(Automatisch)* | Kryptografisch sicheres 32-Byte-Hex-Token (64 Zeichen) für alle schreibenden REST-Endpunkte und WebSocket-Verbindungen. Wird bei leerem Wert beim ersten Start generiert und in `.env` gespeichert. |

### Antigravity-Dateipfade

Pfade werden standardmäßig relativ zum Benutzer-Home-Verzeichnis aufgelöst (`~/.gemini/antigravity`). Sie können individuell überschrieben werden:

| Variable | Standard (Windows) | Standard (Linux/macOS) | Beschreibung |
|----------|-------------------|-----------------------|-------------|
| `ANTIGRAVITY_DIR` | `%USERPROFILE%\.gemini\antigravity` | `~/.gemini/antigravity` | Basisverzeichnis der Google Antigravity Installation. |
| `KNOWLEDGE_DIR` | `%USERPROFILE%\.gemini\antigravity\knowledge\ai-director` | `~/.gemini/antigravity/knowledge/ai-director` | Verzeichnis der AI Development Director Markdown-Protokolldokumente. |
| `PRESENCE_DIR` | `%USERPROFILE%\.gemini\antigravity\presence` | `~/.gemini/antigravity/presence` | Verzeichnis für aktive Sitzungssperren (`.lock`). |
| `BRAIN_DIR` | `%USERPROFILE%\.gemini\antigravity\brain` | `~/.gemini/antigravity/brain` | Verzeichnis mit Transkripten von Subagenten-Läufen (`transcript.jsonl`). |
| `AGY_CLI_PATH` | `%LOCALAPPDATA%\agy\bin\agy.exe` | `/usr/local/bin/agy` | Pfad zur ausführbaren Antigravity CLI-Binärdatei. |
| `DB_PATH` | `./command_center.sqlite` | `./command_center.sqlite` | Dateipfad zur lokalen SQLite-Datenbank. |

---

## 2. Dynamische Laufzeiteinstellungen (Runtime API)

Zusätzlich zu `.env` speichert Antigravity Apex dynamische Betriebsparameter in der Tabelle `settings` der SQLite-Datenbank. Diese können über die Benutzeroberfläche (**Control Center**) oder die REST-API angepasst werden:

- **Endpunkte**: `GET /api/control/settings` und `POST /api/control/settings`
- **Authentifizierung**: Erfordert `COMMAND_CENTER_API_KEY` im Header oder Query-Parameter.

### Schema & Konfigurationsbeispiel

```json
{
  "maxConcurrentAgents": 3,
  "maxRetryAttempts": 2,
  "defaultModelTier": "gemini-3.8-flash-high",
  "escalationPolicy": "strict",
  "autoQualityGates": true,
  "allowedAgents": [
    "director",
    "researcher",
    "frontend-developer",
    "backend-developer",
    "ui-ux-designer",
    "qa-engineer",
    "code-reviewer",
    "senior-architect",
    "legal-compliance",
    "security-engineer",
    "devops-engineer",
    "product-manager",
    "ai-evaluation-engineer",
    "performance-engineer",
    "accessibility-specialist",
    "database-specialist",
    "data-engineer"
  ]
}
```

### Parameter-Erklärungen

1. `maxConcurrentAgents` (Integer, 1–10):
   Maximale Anzahl gleichzeitig ausgeführter Subagenten-Prozesse. Empfohlen: `3`; Maximum: `6`.
2. `maxRetryAttempts` (Integer, 1–10):
   Maximale Anzahl von Wiederholungen pro Lösungsansatz vor der automatischen Stufe-3-Eskalation zum Senior Architect. Standard: `2`.
3. `defaultModelTier` (String):
   Standard-Modellstufe für neue Aufgaben. Üblicherweise `gemini-3.8-flash-high`.
4. `escalationPolicy` (`"strict"` | `"relaxed"`):
   - `"strict"`: Sperrt Aufgaben nach 2 aufeinanderfolgenden Fehlern sofort und erzeugt ein Argon-Prompt-Pack.
   - `"relaxed"`: Erlaubt einen zusätzlichen Versuch vor der Eskalation.
5. `autoQualityGates` (Boolean):
   Führt Quality-Gate-1-Prüfungen nach dem Einreichen von Subagenten-Reports automatisch aus.
6. `allowedAgents` (Array von Strings):
   Strikte Whitelist erlaubter Agenten-IDs. Verhindert die Ausführung nicht autorisierter Rollen.

---

## 3. CORS & Netzwerk-Whitelisting

Das Backend erzwingt eine strikte Prüfung der Origin-Header über `CONFIG.ALLOWED_ORIGINS`:

```typescript
ALLOWED_ORIGINS: [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
]
```

Anfragen von nicht autorisierten Origins werden mit **HTTP 403 Forbidden** abgewiesen. Wenn das Frontend unter einem anderen Hostnamen läuft, fügen Sie diesen in `server/src/config.ts` hinzu.

---

## 4. WebSocket-Betriebsparameter

Der WebSocket-Server (`ws://127.0.0.1:3001/ws`) unterliegt definierten Ausfallsicherheitsgrenzen:

- **Maximale Nachrichtengröße**: `64 KB` (`MAX_WS_PAYLOAD = 64 * 1024`). Eingehende Frames oberhalb dieser Grenze werden abgewiesen und die Verbindung mit Code `1009 (Message too large)` beendet.
- **Heartbeat-Intervall**: 30 Sekunden. Clients müssen auf `ping`-Nachrichten mit `pong` antworten; inaktive Verbindungen werden beendet.
- **Authentifizierungsmethoden**:
  - Query-Parameter: `?token=<API_KEY>`
  - Header: `Authorization: Bearer <API_KEY>`
  - Header: `x-api-key: <API_KEY>`

---

## 5. Konfiguration des Dateisystem-Watchers (Chokidar)

Der Datei-Watcher filtert Ereignisse mittels `createAntigravityPathFilter(brainDir, presenceDir)`:

### Erlaubte Zieldateien:
- Dateien mit der Endung `.lock` innerhalb von `PRESENCE_DIR`.
- Dateien mit dem Namen `transcript.jsonl` in Unterverzeichnissen von `.system_generated/logs/` innerhalb von `BRAIN_DIR`.

### Ignorierte Ziele:
- Temporäre Dateien: `.tmp`, `.swp`, `~*`, `.bak`, `~$*`, `.crdownload`.
- Versteckte Dateien und Ordner (außer `.system_generated`).
- Build- und Cache-Verzeichnisse: `node_modules`, `.git`, `dist`, `scratch`, `tempmediaStorage`, `.user_uploaded`.
