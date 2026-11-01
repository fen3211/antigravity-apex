# Erste Schritte mit Antigravity Apex

[English](GETTING_STARTED.md) • [Русский](GETTING_STARTED.ru.md) • [简体中文](GETTING_STARTED.zh.md) • [日本語](GETTING_STARTED.ja.md) • [Deutsch](GETTING_STARTED.de.md)

Willkommen bei **Antigravity Apex**, dem Missionsleitstand und Telemetrie-Dashboard für **Google Antigravity** und das **AI Development Director** Multi-Agenten-Orchestrierungsframework.

Dieses Handbuch führt Sie durch die ersten 5 Minuten mit Antigravity Apex – vom Starten der lokalen Umgebung über die Überwachung autonomer Subagenten bis hin zur Prüfung der 9-Punkte-Reports und Live-Telemetrie.

---

## 1. Was ist Antigravity Apex?

Google Antigravity ermöglicht es autonomen KI-Agenten, Software in isolierten Arbeitsbereichen zu erstellen. Wenn jedoch Subagenten gleichzeitig an Frontend, Backend, Sicherheit, Tests und Rechtskonformität arbeiten, benötigen Entwickler zentrale Transparenz und Steuerung.

Antigravity Apex bietet:
- **Echtzeit-Observability**: Verfolgen Sie aktive Agentensitzungen, laufende Subagenten und Token-Verbräuche in Echtzeit.
- **Dynamische Nebenläufigkeitskontrolle**: Sichere Drosselung paralleler Subagenten (bis zu 6 parallele Worker), um Speichersättigung und API-Rate-Limits zu verhindern.
- **Mehrstufige Quality Gates**: Strenge Verifikation (Gate 1 Unit-Tests, Gate 2 unabhängiges Review, Gate 2b Rechtskonformität), bevor Aufgaben freigegeben werden.
- **Closed-Contour Argon L4 Eskalation**: Automatische Erkennung wiederholter Fehlschläge (Limit: 2 Versuche) und Eskalation zu Gemini Pro oder Gemini 4 Argon mit minimalen Reproduktionspaketen.

---

## 2. 5-Minuten-Schnellanleitung

### Schritt 1: Dienste starten
Öffnen Sie Ihr Terminal und navigieren Sie zum Projektverzeichnis:

```bash
cd d:\Projects\antigravity-apex
npm run dev
```

Unter Windows können Sie alternativ auf [`start.cmd`](../start.cmd) doppelklicken oder [`setup.cmd`](../setup.cmd) für die automatische 1-Klick-Einrichtung ausführen.

Das Terminal meldet:
```text
[ANTIGRAVITY APEX] Server running on http://127.0.0.1:3001
[ANTIGRAVITY APEX] WebSocket stream at ws://127.0.0.1:3001/ws
[ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
[ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
VITE v8.3.5 ready in 250 ms
➜  Local:   http://localhost:5173/
```

### Schritt 2: Dashboard öffnen
Öffnen Sie Ihren Webbrowser und rufen Sie auf:
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

Das Dashboard im **Refero / Vercel**-Design (mit Unterstützung für Paper Light und Obsidian Dark Themes) zeigt den Verbindungsstatus grün als **ONLINE** an.

---

## 3. Rundgang durch die Dashboard-Bereiche

Antigravity Apex gliedert die komplexe Multi-Agenten-Telemetrie in 8 strukturierte Ansichten:

### 1. Übersicht (Mission Control)
Das zentrale Status-Cockpit:
- **Director-Status**: Modellversion (`Gemini 3.8 Flash High`), aktive Sitzungen und Dateisperren (Locks).
- **KPI-Metriken**: Aktive Subagenten, abgeschlossene Aufgaben, Gesamterfolgsquote und kumulierter Tokenverbrauch.
- **Echtzeit-Telemetrie**: Live-Ticker mit Ereignissen zu Agentenstarts, Fertigstellungen und Quality-Gate-Ergebnissen.
- **1-Click Setup**: Sofortiges Bereitstellen und Synchronisieren aller 17 Agenten in Antigravity.

### 2. Agenten-Verwaltung (Agent Management)
Das Raster aller 17 Spezialistenrollen:
- Anzeige des Status (`idle` im Leerlauf, `running` aktiv, `blocked` blockiert, `escalated` eskaliert).
- Inspektion von System-Prompts und Aufgabenbereichen direkt aus `~/.gemini/config/plugins/ai-director/agents/*.md`.
- Überwachung der Erfolgsquoten und Historie pro Agent.
- 1-Klick-Synchronisation mit Antigravity.

### 3. Live-Workflow (Live Workflow)
Interaktiver grafischer Ablaufplan für Aufgaben:
- Phasen: `Director_Triage` → `Solo` / `Specialist` → `QualityGate_L1` → `Independent_L2` → `LegalGate` → `Architect_L3` → `Argon_L4` → `Approved`.
- Pulsierende Animationen heben aktive Aufgaben an den jeweiligen Knoten hervor.

### 4. Modell-Analytik (Model Analytics)
Token-Ausgaben und Performance-Tracking:
- Aufschlüsselung nach Gemini-Modellen: **Gemini 3.8 Flash**, **Gemini Pro (Senior Architect)** und **Gemini 4 Argon**.
- Klare Trennung zwischen verifizierten **LIVE**-Transkript-Tokens und prognostizierten **ESTIMATED**-Metriken.
- Kostenüberwachung und Zähler für Eingabe-, Ausgabe- und Cache-Read-Tokens.

### 5. Aufgaben-Manager (Task Manager)
Operatives Task-Board:
- Filtern nach Status, Priorität und zugewiesenem Agenten.
- Einsehen von Aufgabendetails, Wiederholungszählern und Fehlerprotokollen.
- Validierung des obligatorischen **9-Punkte-Subagenten-Reports** nach Fertigstellung.

### 6. Director-Wissensbasis (Director Memory)
Online-Editor für das globale Knowledge-Repository des AI Directors:
- Direktes Bearbeiten von `DIRECTOR_PROTOCOL.md`, `AGENT_REGISTRY.md`, `QUALITY_GATES.md`, `FAILURE_LOG.md` und weiteren Richtlinien.
- Änderungen werden verzögerungsfrei in `~/.gemini/antigravity/knowledge/ai-director/` gespeichert.

### 7. Eskalationszentrum (Escalation Center / Gemini 4 Argon)
Cockpit für Level-4-Eskalationen:
- Autonome Erkennung wiederholter Fehlschläge, diagnostischer Deadlocks und Agentenwidersprüche.
- Empfindlichkeitsumschalter (`conservative`, `balanced`, `aggressive`).
- Erzeugung von 18-Punkte maskierten Prompt-Packs mit 1-Klick-Kopierfunktion.
- Closed-Loop-Urteilserfassung und Rückübertragung an Flash-Spezialisten.

### 8. Einheitlicher Ereignisstrom (Unified Event Stream)
Hochdurchsatz-JSON-Ereignis-Inspektor:
- Echtzeit-Stream aller Systemereignisse (`agent.*`, `task.*`, `legal_gate.*`, `escalation.*`).
- Suchen und Filtern nach Ereignistyp, Agenten-ID und Aufgaben-ID.
- 1-Klick-Kopieren von JSON-Nutzdaten für das Debugging.

---

## 4. Nächste Schritte

Sobald Ihr Leitstand aktiv ist:
- Konsultieren Sie [**AGENTS.de.md**](AGENTS.de.md) für detaillierte Beschreibungen aller 17 Rollen.
- Lesen Sie [**ORCHESTRATION.md**](ORCHESTRATION.md) für Aufgabenzuweisung, Parallelitätsregeln und Quality-Gate-Richtlinien.
- Führen Sie `npm run doctor` aus, um die Systemdiagnose zu überprüfen.
