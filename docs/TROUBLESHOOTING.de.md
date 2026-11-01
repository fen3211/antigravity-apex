[English](TROUBLESHOOTING.md) • [Русский](TROUBLESHOOTING.ru.md) • [简体中文](TROUBLESHOOTING.zh.md) • [日本語](TROUBLESHOOTING.ja.md) • [Deutsch](TROUBLESHOOTING.de.md)

# Fehlerbehebung & Diagnoserichtlinien

Diese Anleitung bietet Diagnoseverfahren und konkrete Lösungen für typische Probleme beim Betrieb von **Antigravity Apex**.

---

## 1. WebSocket-Verbindungsabbruch & "DISCONNECTED"-Status

### Symptome
- Der Status-Indikator in der Kopfzeile zeigt **DISCONNECTED** oder **RECONNECTING** an.
- Der einheitliche Ereignisstrom (Unified Event Stream) wird nicht mehr in Echtzeit aktualisiert.

### Diagnoseschritte
1. Öffnen Sie die Browser-Entwicklertools (F12) und prüfen Sie die Logs in **Console** und **Network** (Filter auf WS).
2. Achten Sie auf den WebSocket-Schließungscode (Close Code):
   - `1008 (Policy Violation)`: Authentifizierungsfehler (ungültiger API-Key) oder nicht autorisierter Origin (CORS-Fehler).
   - `1009 (Message too large)`: Eine Einzelnachricht hat die Schutzgrenze von 64 KB überschritten.
   - `1006 (Abnormal Closure)`: Der Backend-Prozess wurde unerwartet beendet oder die Netzwerkverbindung unterbrochen.

### Fehlerbehebung
- **Token synchronisieren**: Rufen Sie `http://127.0.0.1:3001/api/auth/token` direkt im Browser auf, um ein frisches Token zu laden. Der Client speichert und verwendet dieses automatisch.
- **Origin-Konfiguration**: Wenn Sie über eine benutzerdefinierte IP auf das Dashboard zugreifen (z. B. `http://192.168.1.50:5173`), tragen Sie diese in `CONFIG.ALLOWED_ORIGINS` in `server/src/config.ts` ein.
- **Server neu starten**: Bei einem Absturz prüfen Sie die Terminal-Ausgabe auf Stacktraces und starten Sie neu über `npm run dev` oder [`start.cmd`](../start.cmd).

---

## 2. Antigravity-Sitzungen oder -Transkripte nicht erkannt

### Symptome
- **Overview** zeigt `0 Active Locks` und `0 Live Transcripts`, obwohl Antigravity in einem anderen Terminal ausgeführt wird.

### Diagnoseschritte
1. Prüfen Sie die Basispfade in den Server-Startprotokollen:
   ```text
   [ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
   [ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
   ```
2. Überprüfen Sie, ob die Verzeichnisse auf dem Dateisystem existieren:
   - Locks: `~/.gemini/antigravity/presence/`
   - Transkripte: `~/.gemini/antigravity/brain/**/.system_generated/logs/transcript.jsonl`

### Fehlerbehebung
- **Pfade überschreiben**: Falls Antigravity an einem abweichenden Ort liegt, definieren Sie die Pfade explizit in `.env`:
  ```env
  ANTIGRAVITY_DIR=D:\CustomPath\.gemini\antigravity
  BRAIN_DIR=D:\CustomPath\.gemini\antigravity\brain
  PRESENCE_DIR=D:\CustomPath\.gemini\antigravity\presence
  KNOWLEDGE_DIR=D:\CustomPath\.gemini\antigravity\knowledge\ai-director
  ```
- **Dateiberechtigungen**: Stellen Sie sicher, dass das Benutzerkonto, unter dem Node.js läuft, Leserechte für `.gemini` besitzt.

---

## 3. Subagenten-Prozess hängt oder läuft ins Timeout

### Symptome
- Eine Aufgabe verharrt dauerhaft im Status `in_progress`.
- Der vom Supervisor gestartete Prozess erzeugt keine neuen Logausgaben mehr.

### Diagnoseschritte
1. Navigieren Sie im Dashboard zum Tab **Task Manager**.
2. Wählen Sie die hängende Aufgabe aus und prüfen Sie Prozess-PID und Ausführungsdetails.

### Fehlerbehebung
- **Abbruch über das UI**: Klicken Sie in der Task-Detailansicht auf **Cancel Task**. Der Supervisor sendet ein Abbruchsignal.
- **Prozessbaum beenden**: Reagiert der Prozess nicht, beendet der Supervisor automatisch den gesamten Prozessbaum. Unter Windows kann dies in der PowerShell manuell erzwungen werden:
  ```powershell
  taskkill /PID <PID> /T /F
  ```
- **Timeout anpassen**: Erhöhen Sie für umfangreiche Builds oder E2E-Tests den Parameter `timeoutMs` beim Aufruf:
  ```json
  {
    "timeoutMs": 300000
  }
  ```

---

## 4. SQLite-Datenbank blockiert (`SQLITE_BUSY: database is locked`)

### Symptome
- REST-API-Anfragen schlagen mit HTTP 500 und `SQLITE_BUSY: database is locked` fehl.

### Diagnoseschritte
1. Prüfen Sie, ob externe GUI-Tools (z. B. DB Browser for SQLite) die Datei `command_center.sqlite` im Exklusivmodus geöffnet halten.
2. Überprüfen Sie das Vorhandensein der WAL-Dateien: `command_center.sqlite-wal` und `command_center.sqlite-shm`.

### Fehlerbehebung
- **Externe Programme schließen**: Schließen Sie alle externen SQLite-Tools, die Sperren halten könnten.
- **WAL-Pragma verifizieren**: Antigravity Apex nutzt standardmäßig WAL-Modus und `busy_timeout = 5000`. Stellen Sie sicher, dass dieser Timeout bei Anpassungen von `database.ts` erhalten bleibt.
- **Datenbank zurücksetzen**: Bei irreparabler Beschädigung löschen Sie `command_center.sqlite*`. Beim nächsten Start wird eine frische Datenbank automatisch initialisiert.

---

## 5. Legal Gate liefert `BLOCKED_RED`

### Symptome
- Eine Aufgabe scheitert an Quality Gate 2b mit dem Status `BLOCKED_RED`.

### Diagnoseschritte
1. Prüfen Sie das der Aufgabe beigefügte `LegalAssessment`-Objekt oder rufen Sie `GET /api/events?type=legal_gate.blocked` auf.
2. Analysieren Sie die Felder `identifiedRisks` und `mechanismOfNonCompliance`.

### Typische Ursachen & Abhilfemaßnahmen
- **Virale Copyleft-Lizenzen**: Eine AGPL-3.0- oder GPL-3.0-Bibliothek wurde in proprietären oder Cloud-Code integriert. Ersetzen Sie diese durch eine MIT-, Apache-2.0- oder BSD-lizenzierte Alternative.
- **Lokalisierung russischer personenbezogener Daten (23-FZ)**: Daten russischer Staatsbürger werden ohne primäre Speicherung in Russland direkt ins Ausland übertragen. Richten Sie eine primäre Erfassung auf einem russischen Server ein.
- **Vorausgewählte Checkboxen (69-FZ)**: Im Bezahl- oder Registrierungsablauf ist eine Checkbox vorab angehakt. Entfernen Sie die Vorabauswahl gemäß Dark-Pattern-Verbot.
- **Nicht-blockierende Isolation beachten**: Bei `BLOCKED_RED` wird **nur die spezifische nicht-konforme Unteraufgabe gestoppt**. Sichere Arbeiten (UI-Design, Styles, Unit-Tests) laufen unterbrechungsfrei weiter.

---

## 6. CLI-Ausführung abgelehnt (`Agent not allowed` / `Command failed`)

### Symptome
- Der Start einer Aufgabe schlägt fehl mit `error: Agent "<name>" is not allowed` oder `Invalid CLI arguments`.

### Diagnoseschritte
1. Prüfen Sie die Whitelist-Konfiguration: `GET /api/control/settings`.
2. Überprüfen Sie den Prompt auf unzulässige Shell-Metazeichen: `&`, `|`, `;`, `$`, `>`, `<`, `` ` ``.

### Fehlerbehebung
- Stellen Sie sicher, dass der Agent in `settings.allowedAgents` aufgeführt ist. Neue Agenten-IDs können im **Control Center** hinzugefügt werden.
- Entfernen Sie komplexe Shell-Verkettungen aus Ihren Prompts und übergeben Sie reine Textanweisungen an `agy.exe`.
