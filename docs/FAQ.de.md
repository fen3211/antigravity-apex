[English](FAQ.md) • [Русский](FAQ.ru.md) • [简体中文](FAQ.zh.md) • [日本語](FAQ.ja.md) • [Deutsch](FAQ.de.md)

# Häufig gestellte Fragen (FAQ)

Dieses Dokument beantwortet häufige technische, architektonische und operative Fragen zu **Antigravity Apex**.

---

## 1. Allgemeines & Architektur

### Was ist Antigravity Apex?
Antigravity Apex ist ein lokales Echtzeit-Missionsleitsystem und ein Prozess-Supervisor für **Google Antigravity** Multi-Agenten-Arbeitsbereiche und das **AI Development Director** Framework. Es bietet zentrale Transparenz über autonome Subagenten, aktive Sitzungen, Token-Verbräuche und mehrstufige Quality Gates.

### Ersetzt Antigravity Apex die Antigravity CLI oder IDE?
Nein. Antigravity Apex arbeitet als übergeordnete operative Überwachungsebene neben Antigravity. Während Antigravity autonome Aufgaben und Werkzeuginteraktionen ausführt, überwacht Antigravity Apex die Ausführungstranskripte, steuert Nebenläufigkeit, prüft Quality Gates und regelt Stufe-4-Argon-Eskalationen bei Blockaden.

### Kann Antigravity Apex ohne installiertes Antigravity ausgeführt werden?
Ja. Antigravity Apex ist vollständig entkoppelt. Wenn Antigravity nicht installiert ist oder nicht läuft, arbeitet das Dashboard im Offline-Modus mit lokalem Aufgabenmanagement, Wissensbasis-Bearbeitung und simulierter Telemetrie.

### Welche Plattformen werden unterstützt?
Antigravity Apex ist getestet und optimiert für:
- **Windows 10/11** (64-Bit)
- **macOS 12+** (Apple Silicon und Intel)
- **Linux** (Ubuntu 22.04+, Debian 11+, Fedora, Arch)

---

## 2. Nebenläufigkeit & Performance

### Wie viele Subagenten können parallel ausgeführt werden?
Das System unterstützt bis zu **6 gleichzeitige Subagenten** (`MAX_CONCURRENT_SUBAGENTS = 6`). Standardmäßig ist die Nebenläufigkeit auf **3 aktive Agenten** gedrosselt, um die Systemreaktionsfähigkeit zu wahren und externe API-Limits zu vermeiden. Teure Pro-Tier-Modelle sind zusätzlich auf maximal **2 parallele Instanzen** begrenzt.

### Was ist die "Zero-Disk-Read" Ingestion-Engine?
Herkömmliche Log-Monitore lesen bei jeder Dateiänderung die gesamte Protokolldatei ab Zeile 0 neu ein. In langen Antigravity-Sitzungen wachsen Protokolle auf Dutzende Megabyte an, was zu CPU- und I/O-Spitzen führt.

Der `JsonlStreamReader` von Antigravity Apex speichert den exakten Byte-Offset (`last_offset`) in SQLite. Bei Änderungen liest er ausschließlich die neu angehängten 64-KB-Datenblöcke direkt ab diesem Offset, schützt UTF-8-Zeichengrenzen vor Fragmentierung und eliminiert unnötige Festplattenzugriffe.

### Beeinträchtigt das Dashboard die Leistung lokaler Builds?
Der Einfluss ist vernachlässigbar. Das Backend läuft auf einer leichtgewichtigen Node.js-Event-Loop mit `better-sqlite3` im WAL-Modus und verbraucht im Leerlauf unter 1 % CPU und ca. 60 MB RAM.

---

## 3. Modell-Routing & Token-Kosten

### Welche KI-Modelle werden unterstützt?
Das System verteilt Aufgaben dynamisch auf die Google Gemini-Familie:
- **Gemini 3.8 Flash High**: Director-Orchestrierung, Aufgaben-Triage und Qualitätsschlichtung.
- **Gemini Flash (Medium/Low)**: Schnelle, kostengünstige Standardentwicklung (Frontend, Backend, QA, Review, Recherche).
- **Gemini Pro**: Tiefgehende architektonische Refaktorisierung, Analyse von Race Conditions (Stufe 3 Senior Architect).
- **Gemini 4 Argon**: Flaggschiff-Reasoning im geschlossenen Kreis für kritische Deadlocks (Stufe 4).

### Was unterscheidet LIVE- und ESTIMATED-Token-Metriken?
- **LIVE**: Tokens, die direkt aus verifizierten Antigravity-Transkripten (`transcript.jsonl`) extrahiert wurden. Sie spiegeln den tatsächlichen Verbrauch an Prompt-, Completion- und Cache-Read-Tokens wider.
- **ESTIMATED**: Hochgerechnete Werte auf Basis historischer Durchschnitte für Aufgaben außerhalb von Live-Sitzungen.

### Warum wird Gemini 4 Argon in einem "geschlossenen Kreis" (Closed Contour) gehalten?
Gemini 4 Argon ist ein extrem leistungsfähiges Modell, das für kritische Blockaden reserviert ist. Um unkontrollierte Token-Kosten und versehentliche Regressionen zu vermeiden:
1. Es wird niemals bei Routinefehlern ausgelöst (erfordert 2 gescheiterte Ansätze).
2. Es erhält ein isoliertes **18-Punkte-Prompt-Pack** mit einem minimalen 20–50-zeiligen Reproduktionsbeispiel und bereinigten Fehler-Traces.
3. Der menschliche Operator wechselt manuell zu Argon.
4. Argon liefert eine Architekurdiagnose und Lösungsstrategie, die anschließend von Flash-Spezialisten in Code umgesetzt wird.

---

## 4. Quality Gates & Rechtskonformität

### Was sind die 9 Pflichtpunkte des Subagenten-Reports?
Jeder technische Spezialist muss vor dem Bestehen von Gate 1 einen strukturierten Bericht vorlegen:
1. `taskName` (Aufgabenbezeichner)
2. `status` (`SUCCESS`, `FAILURE` oder `BLOCKED`)
3. `summary` (Zusammenfassung)
4. `modifiedFiles` (Geänderte Dateien)
5. `executedChecks` (Ausgeführte Prüfbefehle)
6. `checkResults` (Tatsächliche Testergebnisse)
7. `issuesAndRisks` (Bekannte Risiken)
8. `pendingItems` (Offene Punkte)
9. `nextSteps` (Nächste Schritte)

Berichte, die ohne Testausgaben behaupten, dass alle Tests bestanden wurden, werden automatisch zurückgewiesen.

### Was ist Quality Gate 2b (Rechtskonformitäts-Gate)?
Gate 2b prüft Features vor der Implementierung auf Konformität mit Gesetzen der **Russischen Föderation** (`RU`) und der **Europäischen Union** (`EU_NL`):
- Russische Gesetze: 152-FZ (Datenschutz), 156-FZ (getrennte Einwilligung), 23-FZ (Datenbanklokalisierung), 149-FZ (Informationen & ORI-Register), 243-FZ (KI-Gesetz), Teil IV ZGB (Urheberrecht), 38-FZ/479-FZ (Werbung), Gesetz 2300-1 / 69-FZ (Verbot von Dark Patterns), 54-FZ (Online-Kassen).
- Europäische Gesetze: DSGVO (Verordnung 2016/679), EU AI Act (Verordnung 2024/1689), ePrivacy-Richtlinie.

### Ersetzt das Legal Gate einen menschlichen Anwalt?
Nein. Gate 2b ist ein automatisierter technischer Scanner, um gesetzliche Verstöße frühzeitig im Entwicklungszyklus aufzudecken. Bei hohem Risiko (`RED` oder grenzüberschreitenden Datentransfers) empfiehlt das Gate die Konsultation eines qualifizierten Juristen.

### Was bedeutet die "nicht-blockierende Isolation" bei `RED`?
Wird ein Verstoß mit `BLOCKED_RED` markiert, blockiert das System **nur die spezifische illegale Unteraufgabe** (z. B. unlokalisierte Übertragung personenbezogener Daten). Sichere parallele Arbeiten (UI-Design, Farbschemata, Unit-Tests) werden nicht unterbrochen.

---

## 5. Anpassung & Erweiterung

### Können neue Agentenrollen hinzugefügt werden?
Ja. So registrieren Sie einen benutzerdefinierten Spezialisten:
1. Erstellen Sie eine Markdown-Spezifikation: `~/.gemini/config/plugins/ai-director/agents/<role-id>.md`.
2. Fügen Sie die ID zur Liste `allowedAgents` im **Control Center** oder per `POST /api/control/settings` hinzu.
3. Der Agent erscheint sofort im **Agent Management**-Grid und steht für Aufgaben bereit.

### Wie betreibe ich Antigravity Apex auf einem Remote-Server?
Setzen Sie `HOST=0.0.0.0` in `.env` und tragen Sie die erlaubten Domains in `CONFIG.ALLOWED_ORIGINS` ein. Autorisieren Sie Anfragen mit `Authorization: Bearer <API_KEY>` im Request-Header.
