# Guide d'Installation et de Configuration

[English](INSTALLATION.md) • [Русский](INSTALLATION.ru.md) • [Español](INSTALLATION.es.md) • [Français](INSTALLATION.fr.md) • [Português](INSTALLATION.pt.md)

Ce guide fournit des instructions détaillées étape par étape pour installer et configurer **Antigravity Apex** sur les environnements **Windows**, **macOS** et **Linux**, incluant les lanceurs en 1 clic, les commandes en une ligne et les installations manuelles.

---

## ⚡ Installation Rapide en 1 Clic

### Installation en 1 Clic sous Windows
1. Téléchargez ou clonez ce dépôt.
2. Double-cliquez sur [`setup.cmd`](../setup.cmd) (ou [`setup.bat`](../setup.bat)) à la racine du projet.
3. Le script installe automatiquement toutes les dépendances, déploie la configuration des 17 agents dans `~/.gemini/config/plugins/ai-director`, lance `doctor.js`, démarre le serveur et ouvre votre navigateur à l'adresse `http://127.0.0.1:5173/`.

### Installation en 1 Clic sous Linux / macOS
```bash
chmod +x setup.sh && ./setup.sh
```

### Commande Distante en Une Ligne (Sans clonage préalable)
- **Windows (PowerShell)** :
  ```powershell
  irm https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.ps1 | iex
  ```
- **Linux & macOS (Bash)** :
  ```bash
  curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash
  ```

---

## 1. Prérequis et Configuration Système

### Configuration Minimale Requise
- **Node.js** : `v18.0.0` ou version supérieure (testé sur Node.js v20.x LTS et v24.x).
- **npm** : `v9.0.0` ou supérieur.
- **Mémoire RAM** : 2 Go minimum (4 Go recommandés pour l'exécution simultanée des sous-agents).
- **Espace Disque** : 200 Mo d'espace libre pour les dépendances et la base de données locale SQLite.
- **Système d'Exploitation** :
  - Windows 10/11 (64-bit)
  - macOS 12+ (Apple Silicon ou Intel)
  - Ubuntu 22.04+ / Debian 11+ / Fedora 38+ / Arch Linux

### Environnement Antigravity (Optionnel mais Recommandé)
Pour le suivi en direct des sessions et de la télémétrie :
- Google Antigravity installé sur le système local.
- Répertoire de travail standard situé dans `~/.gemini/antigravity/` (sous Windows : `%USERPROFILE%\.gemini\antigravity`).
- Binaire CLI Antigravity `agy.exe` (sous Windows situé habituellement dans `%LOCALAPPDATA%\agy\bin\agy.exe`).

> [!NOTE]
> Antigravity Apex fonctionne parfaitement même sans Antigravity en cours d'exécution. En son absence, le tableau de bord opère avec le suivi des tâches hors ligne, la persistance locale en base de données et une télémétrie simulée.

---

## 2. Installation Manuelle Étape par Étape

### Étape 1 : Cloner le Dépôt
```bash
git clone https://github.com/fen3211/antigravity-apex.git
cd antigravity-apex
```

### Étape 2 : Installer les Dépendances du Backend
```bash
npm install
```

### Étape 3 : Installer les Dépendances du Client Frontend
```bash
npm --prefix client install
```

### Étape 4 : Configurer les Variables d'Environnement
Copiez le modèle `.env.example` vers `.env` :

**Windows (PowerShell) :**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux :**
```bash
cp .env.example .env
```

Lors du premier démarrage, si `COMMAND_CENTER_API_KEY` est laissé vide, le serveur génère automatiquement un jeton cryptographique sécurisé de 32 octets et l'enregistre dans `.env`.

### Étape 5 : Déployer les Agents et Compétences Antigravity
Déployez l'ensemble des 17 agents, règles et compétences dans votre environnement Antigravity :

**Windows (PowerShell) :**
```powershell
.\scripts\install.ps1 -Force
```

**macOS / Linux :**
```bash
./scripts/install.sh --force
```

---

## 3. Initialisation de la Base de Données

La base de données SQLite (`command_center.sqlite`) est initialisée automatiquement au démarrage du serveur.

Caractéristiques majeures de la base de données :
- **Moteur** : `better-sqlite3` avec liaisons natives C++.
- **Mode Journal** : **WAL (Write-Ahead Logging)** activé pour permettre des lectures concurrentes sans verrouillage et des écritures atomiques hautement performantes.
- **Pragmas** : `busy_timeout = 5000` pour éviter les blocages de base lors des pics d'ingestion.
- **Tables** : `tasks`, `events`, `settings`, `model_usage`, `session_token_usage`, `log_parse_state`, `legal_assessments`, `escalations`.

Aucun script manuel de migration SQL n'est nécessaire.

---

## 4. Diagnostic Système (`npm run doctor`)

Exécutez la vérification diagnostique complète à tout moment :

```bash
npm run doctor
```

Vérifie :
- Les versions de Node.js et npm
- La disponibilité de Git et l'état de la branche
- Le mode WAL de SQLite et l'intégrité du schéma
- La présence des 17 définitions d'agents
- Les règles d'orchestration et compétences (`director-orchestration`, `argon-escalation`)
- Les dossiers Antigravity (`brain`, `presence`, `knowledge`)

---

## 5. Vérification et Tests

Vérifiez que votre installation satisfait à toutes les exigences opérationnelles en lançant la suite de tests :

```bash
npm test
```

Exécute les 8 suites de tests spécialisées :
1. `tests/api.test.ts` : Sécurité de l'API REST, CORS, authentification et protection contre l'injection CLI.
2. `tests/ingestion.test.ts` : Lecteur de flux incrémental, découpage en blocs de 64 Ko et rotation de fichiers.
3. `tests/analytics.test.ts` : Métriques de jetons LIVE vs ESTIMATED et calcul des coûts.
4. `tests/websocket-resilience.test.ts` : Authentification WebSocket, limites de charge utile et battements de cœur ping-pong.
5. `tests/process-supervisor.test.ts` : Démarrage des sous-agents, délais avec terminaison d'arbre et contrôle de concurrence.
6. `tests/legal-compliance.test.ts` : Moteur d'audit légal Porte 2b sur 16 scénarios réglementaires.
7. `tests/backend-audit.test.ts` : Découverte multiplateforme, sécurité contre le path traversal et diagnostic doctor.
8. `tests/intelligent-argon-escalation.test.ts` : Escalade Niveau 4 Argon, pack de prompts en 18 points et délai de temporisation anti-spam.

---

## 6. Modes de Lancement

### Mode A : Mode Développement (Rechargement à Chaud)
```bash
npm run dev
```

### Mode B : Lancement Rapide en 1 Clic sous Windows
Double-cliquez sur [`start.cmd`](../start.cmd).

### Mode C : Compilation et Exécution en Production
```bash
npm run server:build
npm --prefix client run build
npm start
```
