[English](ARCHITECTURE.md) • [Русский](ARCHITECTURE.ru.md) • [Español](ARCHITECTURE.es.md) • [Français](ARCHITECTURE.fr.md) • [Português](ARCHITECTURE.pt.md)

# Architecture du Système

Ce document détaille les plans d'architecture, les interactions entre composants internes et la conception du stockage des données d'**Antigravity Apex**.

---

## 1. Architecture Système de Haut Niveau

Antigravity Apex relie l'environnement d'exécution multi-agents local de **Google Antigravity** à un tableau de bord de pilotage en temps réel via un backend réactif événementiel sans relectures superflues sur le disque.

```mermaid
graph TB
    subgraph AntigravityHost["Environnement Local Antigravity"]
        AG_BRAIN["Transcriptions du Brain\n(~/.gemini/antigravity/brain/**/transcript.jsonl)"]
        AG_PRESENCE["Verrous de Présence\n(~/.gemini/antigravity/presence/*.lock)"]
        AG_MEM["Base de Connaissances\n(~/.gemini/antigravity/knowledge/ai-director/*.md)"]
        AG_CLI["Binaire CLI\n(agy.exe)"]
    end

    subgraph BackendCore["Services Centraux Node.js / Express"]
        CHOKIDAR["Surveillant FS Chokidar\n(createAntigravityPathFilter)"]
        STREAM_READER["JsonlStreamReader\n(Ingestion UTF-8 par Blocs de 64 Ko)"]
        INGEST_QUEUE["IngestionQueue\n(Transactions Atomiques et Déduplication)"]
        SUPERVISOR["ProcessSupervisor\n(Régulation de Concurrence, Terminaison d'Arbre)"]
        LEGAL_GATE["LegalGateService\n(Audit 152-FZ, 243-FZ, RGPD)"]
        CONTROL["ControlService\n(Synthétiseur de Pack de Prompts Argon)"]
        EVENT_BUS["EventBus & Serveur WebSocket\n(Battement de Cœur, Auth Sécurisée)"]
        REST_ROUTER["Routeur API REST\n(Validation Zod, Middleware d'Erreur)"]
    end

    subgraph StorageEngine["Moteur de Stockage SQLite (Mode WAL)"]
        DB_TASKS[("tasks")]
        DB_EVENTS[("events")]
        DB_PARSE_STATE[("log_parse_state")]
        DB_USAGE[("model_usage & session_tokens")]
        DB_SETTINGS[("settings")]
    end

    subgraph FrontendUI["Interface Liquid Dark Glass (React 19 / Vite)"]
        UI_OVERVIEW["Cockpit Vue d'Ensemble"]
        UI_AGENTS["Grille de Gestion des 17 Agents"]
        UI_WORKFLOW["Graphe Interactif de Flux en Direct"]
        UI_ANALYTICS["Analytique des Modèles et Registre de Jetons"]
        UI_TASKS["Gestionnaire de Tâches et Rapports en 9 Points"]
        UI_MEMORY["Éditeur de Mémoire du Director"]
        UI_CONTROL["Centre de Contrôle et Console Argon"]
        UI_EVENTS["Flux d'Événements Unifié"]
    end

    AG_BRAIN -->|Modification de Fichier| CHOKIDAR
    AG_PRESENCE -->|Changement de Verrou| CHOKIDAR
    CHOKIDAR --> STREAM_READER
    STREAM_READER --> INGEST_QUEUE
    INGEST_QUEUE --> DB_EVENTS
    INGEST_QUEUE --> DB_PARSE_STATE
    INGEST_QUEUE --> DB_USAGE
    INGEST_QUEUE -->|Diffusion Post-Commit| EVENT_BUS
    
    SUPERVISOR <-->|Lancement / Arrêt| AG_CLI
    SUPERVISOR --> EVENT_BUS
    SUPERVISOR --> DB_TASKS

    LEGAL_GATE --> EVENT_BUS
    LEGAL_GATE --> DB_EVENTS

    REST_ROUTER <--> StorageEngine
    REST_ROUTER <--> AG_MEM

    EVENT_BUS <-->|ws://127.0.0.1:3001/ws| FrontendUI
    REST_ROUTER <-->|http://127.0.0.1:3001/api/*| FrontendUI
```

---

## 2. Services Centraux du Backend

### 2.1 JsonlStreamReader (Moteur sans Relecture Disque)
Situé dans [`server/src/services/jsonl-stream-reader.ts`](../server/src/services/jsonl-stream-reader.ts).

Les analyseurs de journaux classiques relisent les fichiers depuis la ligne 0 à chaque modification, ce qui engendre une surcharge disque et CPU majeure à mesure que les transcriptions grossissent. `JsonlStreamReader` élimine ce goulot d'étranglement :
- **Suivi par Décalage d'Octets (Byte-Offset)** : Enregistre l'offset exact (`last_offset`) dans la table SQLite `log_parse_state`.
- **Lecture par Blocs de 64 Ko** : Lit uniquement les nouvelles données ajoutées au moyen de descripteurs de fichiers natifs (`fs.readSync`).
- **Sécurité Multi-Octets UTF-8** : Si un caractère cyrillique (2 octets) ou un émoji (4 octets) se trouve à cheval sur la frontière de 64 Ko, la séquence d'octets partielle est conservée et préfixée au bloc suivant.
- **Détection des Rotations et Troncatures** : Compare la taille actuelle du fichier, son numéro d'inode et sa date de création avec les métadonnées enregistrées. Si le fichier est tronqué ou renouvelé, l'offset est réinitialisé à 0 de façon propre sans exception non gérée.

### 2.2 IngestionQueue et Diffusion Post-Commit
Situé dans [`server/src/services/ingestion-queue.ts`](../server/src/services/ingestion-queue.ts).

- **Déduplication Déterministe d'Événements** : Calcule une signature SHA-256 à partir des attributs immuables de l'événement (`conversation_id:step_number:type`). Les événements déjà présents sont ignorés silencieusement.
- **Transactions Atomiques** : Toutes les écritures en base (`events`, `session_token_usage`, `log_parse_state`) sont regroupées au sein d'une transaction SQLite unique (`db.transaction(...)`).
- **Invariant Post-Commit** : Les événements sont diffusés sur l'`EventBus` WebSocket **strictement après** la validation réussie (`commit`) de la transaction en base de données. Les clients ne reçoivent jamais d'événements fantômes dont la persistance aurait échoué.

### 2.3 ProcessSupervisor (Gestion du Cycle de Vie des Processus)
Situé dans [`server/src/services/process-supervisor.ts`](../server/src/services/process-supervisor.ts).

- **Limites de Concurrence** : Restreint l'exécution à `maxConcurrentAgents` (défaut : 3, maximum : 6). Les tâches excédentaires passent à l'état `QUEUED` et sont traitées dans l'ordre d'arrivée dès qu'un agent se libère.
- **Multiplexage des Flux en Direct** : Redirige la sortie standard `stdout` et d'erreur `stderr` du sous-agent directement vers des événements WebSocket (`task.updated`, avec fragments de sortie en direct) pour un affichage interactif dans le terminal du navigateur.
- **Terminaison d'Arborescence Garantie** : Lorsqu'une tâche expire ou est annulée par l'utilisateur, le superviseur déclenche l'arrêt complet de l'arbre de processus (`taskkill /pid <PID> /T /F` sous Windows) pour clore le processus parent ainsi que tous les compilateurs ou exécuteurs de tests enfants.

#### Machine à États Finis (FSM) du Superviseur de Processus

```mermaid
stateDiagram-v2
    [*] --> QUEUED: spawnTask() / Limite de concurrence atteinte
    [*] --> STARTING: spawnTask() / Emplacement disponible
    QUEUED --> STARTING: Emplacement libéré (dépilage de la file)
    STARTING --> RUNNING: Processus démarré (PID obtenu)
    STARTING --> FAILED: Échec au lancement (agent invalide / erreur OS)
    
    RUNNING --> COMPLETED: Code de sortie 0
    RUNNING --> FAILED: Code de sortie != 0 / erreur d'exécution
    RUNNING --> TIMEOUT: Délai dépassé (arrêt de l'arbre de processus)
    
    QUEUED --> CANCELLED: Annulation utilisateur
    RUNNING --> CANCELLED: Interruption utilisateur (arrêt de l'arbre de processus)
    
    COMPLETED --> [*]
    FAILED --> [*]
    TIMEOUT --> [*]
    CANCELLED --> [*]
```

### 2.4 LegalGateService (Porte Qualité 2b)
Situé dans [`server/src/services/legal-gate.ts`](../server/src/services/legal-gate.ts).

Automatise le contrôle de conformité légale pour les juridictions de la Fédération de Russie (`RU`) et de l'Union Européenne (`EU_NL`) :
- **10 Critères de Juridiction** : Enregistrement de l'entité, nationalité des fondateurs, localisation des bases de données, public cible, moyens de paiement, registres réglementaires, canaux de distribution, intégrations tierces, droit applicable, territoire publicitaire.
- **Corpus Réglementaire** : 152-FZ, 156-FZ consentement explicite séparé, 23-FZ localisation primaire des bases de données, 149-FZ diffusion d'informations et registre ORI, 243-FZ régulation de l'IA (invariant temporel : obligations d'étiquetage et d'entraînement des Articles 8 à 10 applicables au 01.03.2027), Partie IV du Code Civil relative au droit d'auteur, 38-FZ/479-FZ publicité, RGPD/UAVG et AI Act européen.
- **Invariant Non Bloquant** : Lorsqu'un audit conclut à un statut `BLOCKED_RED`, seule la sous-opération en infraction est interrompue ; les développements sains parallèles (design UI, accessibilité, tests unitaires) continuent sans être entravés.

### 2.5 ControlService et Escalade Niveau 4 vers Argon
Situé dans [`server/src/services/control.ts`](../server/src/services/control.ts).

Met en œuvre le protocole d'escalade d'AI Development Director :
- **Encadrement des Retentatives** : Surveille le nombre d'échecs par tâche. Si une approche échoue à deux reprises, la tâche est verrouillée contre toute nouvelle tentative aveugle.
- **Synthèse du Pack de Prompts Argon** : Génère un pack Markdown autonome structuré en 10 points comprenant :
  1. Nom du composant et rôle attribué.
  2. Énoncé synthétique du problème en 2 phrases.
  3. Synthèse et preuves de l'échec 1.
  4. Synthèse et preuves de l'échec 2.
  5. Extrait minimal isolé pour reproduction (20 à 50 lignes).
  6. Question ciblée de diagnostic architectural.
  7. Instructions impératives de bascule manuelle pour l'opérateur humain.
- **Désescalade et Résolution du Verdict** : Dès que l'opérateur saisit le verdict fourni par Argon, la tâche est réassignée à un spécialiste Flash pour son implémentation logicielle.

---

## 3. Architecture de la Base de Données (SQLite WAL)

Le schéma de la base de données est géré via `better-sqlite3` dans [`server/src/db/database.ts`](../server/src/db/database.ts) :

### Mode WAL et Pragmas de Concurrence
```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```
- **Mode WAL** : Autorise des lectures simultanées sans jamais verrouiller les écritures.
- **Busy Timeout (5000 ms)** : Empêche les erreurs `SQLITE_BUSY` lors des rafales d'ingestion de journaux.

### Tables Principales de la Base de Données

| Nom de Table | Clé Primaire | Description |
|--------------|--------------|-------------|
| `events` | `id` (TEXT) | Tous les événements système, agents, tâches et audits juridiques avec charge utile JSON. |
| `tasks` | `id` (TEXT) | Tâches suivies, statuts, compteurs de retentatives, priorités et rapports en 9 points. |
| `log_parse_state` | `file_path` (TEXT) | Décalages d'octets, inodes, mtimes et compteurs de lignes pour chaque fichier journal. |
| `session_token_usage` | `conversation_id` (TEXT) | Ventilation des jetons (`input`, `output`, `cache_read`) par conversation active. |
| `model_usage` | `tier` (TEXT) | Totaux agrégés des exécutions, taux de réussite et volumes de jetons par modèle. |
| `settings` | `key` (TEXT) | Clés et paramètres opérationnels dynamiques au moment de l'exécution. |
| `escalations` | `id` (TEXT) | Escalades autonomes vers Gemini 4 Argon, signatures d'échecs, packs de prompts et verdicts. |

---

## 4. Architecture Frontend (React 19 & Liquid Dark Glass)

Le client frontend est conçu avec **React 19**, **TypeScript** et **Tailwind CSS v3** :

- **Orientation Esthétique** : Interface dark glass inspirée des logiciels professionnels Apple Pro Tools, rehaussée de lueurs ambiantes subtiles (`backdrop-blur-deep`, `bg-neutral-900/80`, `border-neutral-800`).
- **Synchronisation d'État Temps Réel** : Le composant racine `App.tsx` entretient une connexion WebSocket continue avec `/ws`. Les événements entrants mettent à jour le tableau des tâches, les indicateurs clés et le fil télémétrique instantanément sans rafraîchissement manuel.
- **Invariant Zéro Erreur Console** : Typage rigoureux, gestionnaires d'erreurs d'affichage (Error Boundaries) et validation des données assurent une console de développement parfaitement vierge sous toutes conditions réseau.
