[English](CONFIGURATION.md) • [Русский](CONFIGURATION.ru.md) • [Español](CONFIGURATION.es.md) • [Français](CONFIGURATION.fr.md) • [Português](CONFIGURATION.pt.md)

# Référence de Configuration

Ce document fournit une référence exhaustive de toutes les options de configuration statiques et dynamiques dans **Antigravity Apex**.

---

## 1. Variables d'Environnement (`.env`)

Antigravity Apex charge sa configuration depuis `.env` via `dotenv`. Tous les paramètres disposent de valeurs par défaut adaptées à la production.

### Réseau et Exécution du Serveur

| Variable | Type | Valeur par défaut | Description |
|----------|------|-------------------|-------------|
| `PORT` | `number` | `3001` | Port HTTP et WebSocket sur lequel le serveur backend Express écoute. |
| `HOST` | `string` | `127.0.0.1` | Adresse d'interface réseau d'écoute. Par défaut en boucle locale (loopback) pour la sécurité locale. |
| `NODE_ENV` | `string` | `development` | Définir sur `production` pour les builds de production afin d'activer le cache strict et réduire les journaux verbeux. |

### Sécurité et Authentification

| Variable | Type | Valeur par défaut | Description |
|----------|------|-------------------|-------------|
| `COMMAND_CENTER_API_KEY` | `string` | *(Généré automatiquement)* | Jeton hexadécimal cryptographique de 32 octets (64 caractères hex) requis pour tous les points d'accès REST de mutation et poignées de main WebSocket. Si laissé vide, le serveur en génère un au premier démarrage et le persiste dans `.env`. |

### Chemins du Système de Fichiers Antigravity

Par défaut, les chemins sont résolus relativement au dossier personnel de l'utilisateur (`~/.gemini/antigravity`). Vous pouvez les redéfinir individuellement :

| Variable | Défaut (Windows) | Défaut (Linux/macOS) | Description |
|----------|------------------|----------------------|-------------|
| `ANTIGRAVITY_DIR` | `%USERPROFILE%\.gemini\antigravity` | `~/.gemini/antigravity` | Répertoire de base de l'installation Google Antigravity. |
| `KNOWLEDGE_DIR` | `%USERPROFILE%\.gemini\antigravity\knowledge\ai-director` | `~/.gemini/antigravity/knowledge/ai-director` | Dossier contenant les documents protocolaires markdown d'AI Development Director. |
| `PRESENCE_DIR` | `%USERPROFILE%\.gemini\antigravity\presence` | `~/.gemini/antigravity/presence` | Dossier surveillé pour les fichiers `.lock` de session active. |
| `BRAIN_DIR` | `%USERPROFILE%\.gemini\antigravity\brain` | `~/.gemini/antigravity/brain` | Dossier contenant les transcriptions d'exécution des sous-agents (`transcript.jsonl`). |
| `AGY_CLI_PATH` | `%LOCALAPPDATA%\agy\bin\agy.exe` | `/usr/local/bin/agy` | Chemin vers l'exécutable CLI Antigravity. |
| `DB_PATH` | `./command_center.sqlite` | `./command_center.sqlite` | Chemin du système de fichiers vers la base de données SQLite locale. |

---

## 2. Paramètres de Contrôle Dynamiques (API d'Exécution)

En complément du `.env`, Antigravity Apex stocke les paramètres opérationnels dynamiques dans la table `settings` de SQLite. Ils peuvent être ajustés depuis l'interface (**Control Center**) ou via l'API REST :

- **Points d'accès** : `GET /api/control/settings` et `POST /api/control/settings`
- **Authentification** : Requiert l'en-tête `COMMAND_CENTER_API_KEY` ou le paramètre de requête correspondant.

### Schéma et Attributs

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

### Explication des Paramètres

1. `maxConcurrentAgents` (entier, 1 à 10) :
   Contrôle le nombre maximum de sous-agents que le superviseur peut lancer simultanément. Recommandé : `3` pour un développement classique ; maximum testé : `6`.
2. `maxRetryAttempts` (entier, 1 à 10) :
   Nombre maximum de tentatives par approche avant déclenchement de l'escalade de Niveau 3 vers le Senior Architect. Par défaut : `2`.
3. `defaultModelTier` (chaîne) :
   Niveau de modèle Gemini par défaut attribué aux nouvelles tâches. Habituellement `gemini-3.8-flash-high`.
4. `escalationPolicy` (`"strict"` | `"relaxed"`) :
   - `"strict"` : Bloque immédiatement les tâches après 2 échecs consécutifs et appelle le synthétiseur de pack de prompts pour Argon.
   - `"relaxed"` : Permet une tentative additionnelle avant d'escalader.
5. `autoQualityGates` (booléen) :
   Si vrai, le système lance automatiquement les contrôles de la Porte Qualité 1 dès la soumission du rapport de sous-agent.
6. `allowedAgents` (tableau de chaînes) :
   Liste blanche stricte des identifiants d'agents autorisés à être exécutés via le superviseur. Empêche l'exécution de rôles non déclarés.

---

## 3. CORS et Liste Blanche Réseau

Le backend impose une vérification rigoureuse des origines CORS via `CONFIG.ALLOWED_ORIGINS` :

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

Toute requête provenant d'une origine non autorisée est rejetée avec une réponse **HTTP 403 Forbidden**. Si vous utilisez le client sur un port ou nom d'hôte personnalisé, ajoutez-le à `CONFIG.ALLOWED_ORIGINS` dans `server/src/config.ts`.

---

## 4. Paramètres de Fonctionnement WebSocket

Le serveur WebSocket (`ws://127.0.0.1:3001/ws`) applique des règles de résilience strictes :

- **Taille Maximale de Charge Utile** : `64 Ko` (`MAX_WS_PAYLOAD = 64 * 1024`). Tout message entrant dépassant cette limite est rejeté avec le code de fermeture `1009 (Message too large)` et rupture immédiate de la connexion.
- **Intervalle de Battement de Cœur (Heartbeat)** : 30 secondes. Les clients doivent répondre aux trames `ping` par une trame `pong` ; les sockets inactives sont déconnectées automatiquement.
- **Authentification** : Nécessite un jeton valide transmis via :
  - Paramètre d'URL : `?token=<API_KEY>`
  - En-tête : `Authorization: Bearer <API_KEY>`
  - En-tête : `x-api-key: <API_KEY>`

---

## 5. Configuration des Filtres du Surveillant de Fichiers

Le surveillant Chokidar filtre les événements avec `createAntigravityPathFilter(brainDir, presenceDir)` :

### Fichiers Autorisés :
- Tout fichier se terminant par `.lock` dans le répertoire `PRESENCE_DIR`.
- Tout fichier nommé `transcript.jsonl` situé dans un sous-dossier `.system_generated/logs/` au sein de `BRAIN_DIR`.

### Cibles Exclues / Ignorées :
- Fichiers temporaires : `.tmp`, `.swp`, `~*`, `.bak`, `~$*`, `.crdownload`.
- Fichiers cachés et dossiers en point (sauf `.system_generated`).
- Dossiers volumineux de compilation et de cache : `node_modules`, `.git`, `dist`, `scratch`, `tempmediaStorage`, `.user_uploaded`.
