# Journal des Modifications (Changelog)

[English](CHANGELOG.md) • [Русский](CHANGELOG.ru.md) • [Español](CHANGELOG.es.md) • [Français](CHANGELOG.fr.md) • [Português](CHANGELOG.pt.md) • [简体中文](CHANGELOG.zh.md) • [日本語](CHANGELOG.ja.md) • [Deutsch](CHANGELOG.de.md)

Toutes les modifications notables apportées à **Antigravity Apex** sont consignées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-01

### Publication Initiale Open Source

Première version de niveau production d'**Antigravity Apex**, le centre de commande de mission et superviseur de télémétrie multi-agents pour Google Antigravity et le framework **AI Development Director**.

### Ajouts

#### 1. Orchestration Multi-Agents et Pool Canonique de 17 Rôles Spécialisés
- Prise en charge intégrale de 17 rôles experts :
  - **Rôles Fondamentaux** : `director` (Gemini 3.8 Flash High), `researcher` (Flash), `frontend-developer` (Flash), `backend-developer` (Flash), `ui-ux-designer` (Flash), `qa-engineer` (Flash), `code-reviewer` (Flash), `senior-architect` (Niveau Pro), `legal-compliance` (Flash).
  - **Spécialistes de Domaine** : `security-engineer` (Flash/Pro), `devops-engineer` (Flash/Pro), `product-manager` (Flash), `ai-evaluation-engineer` (Flash/Pro), `performance-engineer` (Flash/Pro), `accessibility-specialist` (Flash), `database-specialist` (Flash/Pro), `data-engineer` (Flash/Pro).
- Contrôle dynamique de la concurrence : jusqu'à 6 sous-agents parallèles simultanés (`MAX_CONCURRENT_SUBAGENTS = 6`), valeur par défaut de 3 et plafond de 2 modèles Pro simultanés.
- Vidage automatique de file avec suivi des statuts `QUEUED`, `STARTING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED` et `TIMEOUT`.

#### 2. Moteur d'Escalade Intelligente vers Gemini 4 Argon (Niveau 4)
- Implémentation complète du protocole d'escalade Argon :
  - Détection autonome de 2 échecs consécutifs par approche.
  - Escalade automatique vers le **Niveau 3 : Senior Architect (Pro Tier)**.
  - En cas d'impasse architecturale persistante : génération d'un **Argon Prompt Pack** structuré en 18 points avec assainissement des chemins et masquage des secrets.
  - Période de refroidissement anti-spam par signature SHA-256 (5 minutes).
  - Point de terminaison de résolution en boucle fermée (`POST /api/escalations/:id/response`) réacheminant les solutions validées vers les spécialistes Flash.

#### 3. Portes de Qualité Multi-Niveaux et Rapports en 9 Points
- **Gate 1 (Auto-contrôle L1)** : Tests unitaires locaux, linters et validation des rapports stricts en 9 points.
- **Gate 2 (Vérification Indépendante L2)** : Audit automatisé par `qa-engineer` et `code-reviewer`.
- **Gate 2b (Porte Juridique et Conformité)** :
  - Audit automatisé pour les juridictions russe (`RU` : 152-FZ, 156-FZ, 243-FZ IA) et européenne (`EU_NL` : RGPD, Règlement européen sur l'IA).
  - Invariant non-bloquant : neutralise uniquement la sous-opération risquée tout en maintenant l'avancement des tâches sécurisées.

#### 4. Ingestion Incrémentielle de Journaux sans Lecture Répétée du Disque
- Moteur `JsonlStreamReader` pour la lecture fluide des transcriptions Antigravity (`transcript.jsonl`) par blocs de 64 Ko avec préservation de l'UTF-8 multioctet.
- Détection immédiate de rotation, troncature ou remplacement de fichiers par suivi des inodes et horodatages.
- Identifiants d'événements déterministes par hachage SHA-256 pour éliminer les doublons dans SQLite.

#### 5. Télémétrie en Temps Réel et Passerelle Antigravity
- Surveillance des verrous de présence actifs (`~/.gemini/antigravity/presence/*.lock`).
- Distinction stricte entre tokens confirmés **LIVE** et valeurs projetées **ESTIMATED**.
- Explorateur de mémoire interactif (`Memory Explorer`) pour la consultation et l'édition des documents de la base de connaissances.

#### 6. Système de Design Refero / Vercel avec Thèmes Clair et Sombre
- Interface sobre et lisible avec thème Clair (Paper White `#FAFAFA`) et Sombre (Obsidian Black `#0A0A0A`).
- Zéro clignotement au chargement (Zero FOUT) via script d'en-tête inline.
- Ratios de contraste accessibles (WCAG 2.1 AA) et tiroir de navigation mobile.

#### 7. Écosystème d'Installation en 1 Clic
- **Installateur autonome pour Windows** : [`Antigravity-Apex-Setup.exe`](https://github.com/fen3211/antigravity-apex/releases/latest/download/Antigravity-Apex-Setup.exe) (v1.0.0) — installation native automatique sans console ni Git.
- **Lanceurs de bureau** : [`setup.cmd`](setup.cmd) / [`setup.bat`](setup.bat) (Windows) et [`setup.sh`](setup.sh) (Linux/macOS).
- **Lanceurs rapides quotidiens** : [`start.cmd`](start.cmd) / [`start.bat`](start.bat) et [`start.sh`](start.sh).
- **Scripts de déploiement des 17 spécialistes** : [`scripts/install.ps1`](scripts/install.ps1) et [`scripts/install.sh`](scripts/install.sh).
- **Outil de diagnostic Doctor** : [`scripts/doctor.js`](scripts/doctor.js) (`npm run doctor`) avec 19 vérifications automatiques.
- **Installateurs distants en ligne de commande** : [`scripts/get.ps1`](scripts/get.ps1) et [`scripts/get.sh`](scripts/get.sh).
- **Synchronisation depuis l'interface web** : bouton `⚡ 1-Click Setup` dans la barre supérieure.
- **Environnement cloud en 1 clic** : [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) pour GitHub Codespaces.

#### 8. Internationalisation Multilingue (8 Langues)
- Prise en charge native de 8 langues dans le tableau de bord et la documentation technique :
  - 🇬🇧 English (Principal / Par défaut)
  - 🇷🇺 Russe
  - 🇪🇸 Espagnol
  - 🇫🇷 Français
  - 🇵🇹 Portugais
  - 🇨🇳 Chinois Simplifié
  - 🇯🇵 Japonais
  - 🇩🇪 Allemand
- Menu déroulant de sélection de langue dans l'en-tête (`Header`) avec drapeaux emojis.
- Sélecteur de langue interactif dans les Paramètres (`ControlCenter`) synchronisé avec `localStorage`.
- Documentation technique intégrale disponible dans les 8 langues.
