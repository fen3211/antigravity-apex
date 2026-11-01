# Guide de Dépannage et de Diagnostic

[English](TROUBLESHOOTING.md) • [Русский](TROUBLESHOOTING.ru.md) • [Español](TROUBLESHOOTING.es.md) • [Français](TROUBLESHOOTING.fr.md) • [Português](TROUBLESHOOTING.pt.md)

Ce guide fournit des procédures de diagnostic et des solutions concrètes aux problèmes fréquemment rencontrés lors de l'utilisation d'**Antigravity Apex**.

---

## 1. Déconnexion WebSocket et Statut "DISCONNECTED"

### Symptômes
- La pastille d'état dans l'en-tête indique **DISCONNECTED** ou **RECONNECTING**.
- Le Flux d'Événements Unifié cesse de s'actualiser en temps réel.

### Procédure de Diagnostic
1. Ouvrez les Outils de Développement du navigateur (F12) et examinez la **Console** et l'onglet **Réseau** (filtre WS).
2. Vérifiez le code de fermeture WebSocket :
   - `1008 (Policy Violation)` : Échec d'authentification (clé API invalide) ou origine CORS non autorisée.
   - `1009 (Message too large)` : Un message unitaire a dépassé le plafond de 64 Ko.
   - `1006 (Abnormal Closure)` : Le processus serveur s'est arrêté ou la connexion réseau a été rompue.

### Résolution
- **Discordance de Jeton** : Obtenez un jeton valide en ouvrant directement `http://127.0.0.1:3001/api/auth/token` dans votre navigateur. Le client le mémorisera et l'utilisera automatiquement.
- **Discordance d'Origine** : Si vous accédez au tableau de bord depuis une IP ou un hôte personnalisé (ex. `http://192.168.1.50:5173`), déclarez cette origine dans `CONFIG.ALLOWED_ORIGINS` dans `server/src/config.ts`.
- **Redémarrer le Serveur** : Si le backend s'est arrêté de façon inattendue, consultez le terminal pour repérer la trace d'erreur et relancez via `npm run dev` ou `start.cmd`.

---

## 2. Sessions ou Transcriptions Antigravity Non Détectées

### Symptômes
- La page **Overview** affiche `0 Active Locks` et `0 Live Transcripts`, bien qu'Antigravity s'exécute dans un autre terminal.

### Procédure de Diagnostic
1. Vérifiez les chemins de base Antigravity affichés lors du démarrage du serveur :
   ```text
   [ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
   [ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
   ```
2. Assurez-vous que les dossiers et fichiers existent réellement sur le disque :
   - Verrous : `~/.gemini/antigravity/presence/`
   - Transcriptions : `~/.gemini/antigravity/brain/**/.system_generated/logs/transcript.jsonl`

### Résolution
- **Redéfinition des Chemins** : Si votre installation utilise un dossier spécifique, configurez explicitement les chemins dans `.env` :
   ```env
   ANTIGRAVITY_DIR=D:\CheminPersonnalise\.gemini\antigravity
   BRAIN_DIR=D:\CheminPersonnalise\.gemini\antigravity\brain
   PRESENCE_DIR=D:\CheminPersonnalise\.gemini\antigravity\presence
   KNOWLEDGE_DIR=D:\CheminPersonnalise\.gemini\antigravity\knowledge\ai-director
   ```
- **Permissions de Fichiers** : Vérifiez que l'utilisateur exécutant Node.js possède les droits de lecture sur le dossier `.gemini`.

---

## 3. Blocage ou Expiration de Délai (Timeout) d'un Sous-Agent

### Symptômes
- Une tâche reste indéfiniment à l'état `in_progress`.
- Le terminal indique que le sous-agent démarré par le superviseur a cessé d'émettre des journaux.

### Procédure de Diagnostic
1. Rendez-vous dans l'onglet **Task Manager** du tableau de bord.
2. Cliquez sur la tâche bloquée pour examiner les détails d'exécution et le PID du processus.

### Résolution
- **Annulation depuis le Dashboard** : Cliquez sur le bouton **Cancel Task** dans le panneau latéral. Le superviseur émettra un signal d'arrêt.
- **Terminaison d'Arbre de Processus** : Si le processus refuse de s'interrompre normalement, le superviseur déclenche l'arrêt complet de l'arbre. Sous Windows, vous pouvez forcer l'arrêt depuis PowerShell :
   ```powershell
   taskkill /PID <PID> /T /F
   ```
- **Ajustement du Timeout** : Pour les tâches lourdes de compilation ou de tests E2E, augmentez la valeur du délai lors de l'appel `/tasks/:id/execute` :
   ```json
   {
     "timeoutMs": 300000
   }
   ```

---

## 4. Verrous sur la Base de Données SQLite (`SQLITE_BUSY: database is locked`)

### Symptômes
- Les requêtes API REST échouent avec une réponse HTTP 500 indiquant `SQLITE_BUSY: database is locked`.

### Procédure de Diagnostic
1. Vérifiez si un visualiseur externe de SQLite (comme DB Browser for SQLite) garde `command_center.sqlite` ouvert en accès exclusif.
2. Confirmez la présence des fichiers du journal WAL : `command_center.sqlite-wal` et `command_center.sqlite-shm`.

### Résolution
- **Fermer les Visualiseurs Externes** : Quittez les outils graphiques externes maintenant des verrous d'accès.
- **Pragma WAL** : Antigravity Apex utilise le mode WAL et applique par défaut `busy_timeout = 5000`. Si vous avez personnalisé `database.ts`, conservez un délai d'au moins 5000 ms.
- **Réinitialisation de la Base** : Si la base de données est irrémédiablement corrompue, supprimez `command_center.sqlite`, `command_center.sqlite-wal` et `command_center.sqlite-shm`. Le serveur régénèrera des tables propres au redémarrage.

---

## 5. La Porte Légale Retourne `BLOCKED_RED`

### Symptômes
- Une tâche échoue à la Porte Qualité 2b avec le statut `BLOCKED_RED`.

### Procédure de Diagnostic
1. Consultez l'objet `LegalAssessment` rattaché à la tâche ou interrogez `GET /api/events?type=legal_gate.blocked`.
2. Lisez précisément les champs `identifiedRisks` et `mechanismOfNonCompliance`.

### Causes Fréquentes & Solutions
- **Licence Copyleft Contaminante** : Intégration d'une bibliothèque sous licence AGPL-3.0 ou GPL-3.0 dans un projet propriétaire distribué. Remplacez-la par une dépendance sous licence MIT, Apache-2.0 ou BSD.
- **Localisation des Données en Russie (23-FZ)** : Une base ou un service cloud stockant des données personnelles de citoyens russes est hébergé à l'étranger sans enregistrement primaire en Russie. Mettez en place la saisie primaire locale avant réplication.
- **Cases Précochées (69-FZ)** : Présence d'une case à cocher pré-activée dans un parcours de commande ou de consentement. Désactivez le pré-cochage pour respecter la directive anti-dark patterns en vigueur depuis le 01.09.2025.
- **Invariant Non Bloquant** : En présence d'un statut `BLOCKED_RED`, seule la sous-tâche en infraction est suspendue. Vous pouvez continuer le travail d'interface ou les tests unitaires sans interruption.

---

## 6. Refus d'Exécution CLI (`Agent not allowed` / `Command failed`)

### Symptômes
- Le lancement d'une tâche depuis le Control Center échoue avec l'erreur `error: Agent "<name>" is not allowed` ou `Invalid CLI arguments`.

### Procédure de Diagnostic
1. Vérifiez la liste blanche des rôles autorisés : `GET /api/control/settings`.
2. Inspectez le prompt pour détecter la présence de métacaractères de shell interdits : `&`, `|`, `;`, `$`, `>`, `<`, `` ` ``.

### Résolution
- Vérifiez que l'identifiant de l'agent figure dans `settings.allowedAgents`. Vous pouvez autoriser de nouveaux rôles via l'onglet paramètres du **Control Center**.
- Supprimez les commandes de shell chaînées du contenu du prompt. Transmettez un texte explicatif direct à `agy.exe`.
