# Premiers Pas avec Antigravity Apex

[English](GETTING_STARTED.md) • [Русский](GETTING_STARTED.ru.md) • [Español](GETTING_STARTED.es.md) • [Français](GETTING_STARTED.fr.md) • [Português](GETTING_STARTED.pt.md)

Bienvenue sur **Antigravity Apex**, le tableau de bord de contrôle de mission pour **Google Antigravity** et le cadre d'orchestration multi-agents **AI Development Director**.

Ce guide vous accompagne lors de vos 5 premières minutes avec Antigravity Apex, depuis le lancement de l'environnement local jusqu'au suivi des sous-agents autonomes, l'examen des rapports en 9 points et l'analyse de la télémétrie en temps réel.

---

## 1. Qu'est-ce qu'Antigravity Apex ?

Google Antigravity permet à des agents IA autonomes de concevoir des logiciels au sein d'espaces de travail isolés. Cependant, à mesure que les agents se multiplient sur le frontend, le backend, la sécurité, les tests et la conformité légale, les développeurs ont besoin d'une visibilité et d'un contrôle centralisés.

Antigravity Apex fournit :
- **Visibilité en Temps Réel** : Suivre les sessions actives des agents, les sous-agents en cours d'exécution et la consommation de jetons en direct au fil des interactions.
- **Contrôle Dynamique de Concurrence** : Réguler sans risque les sous-agents simultanés (jusqu'à 6 agents en parallèle) afin d'éviter la saturation de la mémoire et les limites de débit des API.
- **Portes Qualité Multi-Niveaux** : Appliquer des vérifications rigoureuses (Porte 1 tests unitaires, Porte 2 revue indépendante, Porte 2b conformité légale) avant toute validation de tâche.
- **Escalade L4 vers Argon en Circuit Fermé** : Détecter automatiquement les échecs consécutifs (limite de 2 tentatives) et escalader vers Gemini Pro ou Gemini 4 Argon avec des packs de reproduction minimaux et isolés.

---

## 2. Démarrage Rapide en 5 Minutes

### Étape 1 : Démarrer les Services
Ouvrez votre terminal et rendez-vous dans le répertoire du projet :

```bash
cd d:\Projects\antigravity-apex
npm run dev
```

Alternativement, sous Windows, double-cliquez sur [`start.cmd`](../start.cmd) ou lancez `setup.cmd` pour une installation en 1 clic.

Le terminal affiche :
```text
[ANTIGRAVITY APEX] Server running on http://127.0.0.1:3001
[ANTIGRAVITY APEX] WebSocket stream at ws://127.0.0.1:3001/ws
[ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
[ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
VITE v8.3.5 ready in 250 ms
➜  Local:   http://localhost:5173/
```

### Étape 2 : Ouvrir le Tableau de Bord
Ouvrez votre navigateur web et accédez à :
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

L'interface affiche le tableau de bord inspiré de **Refero Vercel** (prenant en charge les thèmes Paper Light et Obsidian Dark), avec l'indicateur d'état affichant **ONLINE**.

---

## 3. Visite des Sections du Tableau de Bord

Antigravity Apex organise la télémétrie multi-agents complexe en 8 vues dédiées :

### 1. Vue d'Ensemble (Mission Control)
Le centre de pilotage global :
- **État du Director** : Version du modèle (`Gemini 3.8 Flash High`), sessions actives et verrous de fichiers en cours.
- **Métriques Clés (KPI)** : Sous-agents actifs, tâches terminées, taux de réussite global et volume total de jetons consommés.
- **Télémétrie Récente** : Fil d'événements en direct annonçant les lancements d'agents, les achèvements et les résultats des portes qualité.
- **1-Click Setup** : Bouton d'action immédiate pour déployer et synchroniser les 17 agents avec Antigravity.

### 2. Gestion des Agents (Agent Management)
La grille des 17 spécialistes canoniques :
- Consultez l'état (`idle`, `running`, `blocked`, `escalated`) de tous les spécialistes.
- Inspectez les consignes système et définitions de domaine directement depuis `~/.gemini/config/plugins/ai-director/agents/*.md`.
- Suivez les taux de réussite par agent et l'historique de leurs exécutions.
- Déclenchez la synchronisation Antigravity en 1 clic.

### 3. Flux en Direct (Live Workflow)
Un graphe visuel interactif illustrant le cycle de vie des tâches :
- Progression à travers les étapes : `Director_Triage` → `Solo` / `Specialist` → `QualityGate_L1` → `Independent_L2` → `LegalGate` → `Architect_L3` → `Argon_L4` → `Approved`.
- Animations pulsées mettant en évidence les tâches actives à chaque étape.

### 4. Analytique des Modèles (Model Analytics)
Suivi de la consommation de jetons et des performances :
- Répartition par modèle Gemini : **Gemini 3.8 Flash**, **Gemini Pro (Senior Architect)** et **Gemini 4 Argon**.
- Séparation stricte entre les jetons vérifiés **LIVE** issus des transcriptions réelles et les projections estimées **ESTIMATED**.
- Suivi des coûts et compteurs de jetons en entrée, sortie et lecture de cache.

### 5. Gestionnaire de Tâches (Task Manager)
Le tableau opérationnel des tâches :
- Filtrez les tâches par statut, priorité et agent assigné.
- Consultez les détails d'exécution, le compteur de retentatives et les journaux d'erreurs.
- Examinez le **Rapport de Sous-Agent en 9 Points** soumis rigoureusement par les spécialistes à l'achèvement d'une tâche.

### 6. Mémoire du Director (Director Memory)
Explorateur et éditeur en ligne de la base de connaissances globale d'AI Director :
- Modifiez directement sur place les protocoles fondamentaux : `DIRECTOR_PROTOCOL.md`, `AGENT_REGISTRY.md`, `QUALITY_GATES.md`, `FAILURE_LOG.md`.
- Les mises à jour sont écrites directement dans `~/.gemini/antigravity/knowledge/ai-director/` sans latence.

### 7. Centre d'Escalade (Escalation Center - Gemini 4 Argon)
Poste de commande pour l'escalade de Niveau 4 :
- Détection autonome des blocages récurrents, impasses diagnostiques et contradictions entre agents.
- Sélecteur de sensibilité (`conservative`, `balanced`, `aggressive`).
- Synthèse de packs de prompts assainis en 18 points avec copie en 1 clic dans le presse-papiers.
- Traitement et résolution des verdicts en circuit fermé.

### 8. Flux d'Événements Unifié (Unified Event Stream)
Inspecteur d'événements JSON à haute cadence :
- Flux en temps réel de tous les événements système (`agent.*`, `task.*`, `legal_gate.*`, `escalation.*`).
- Recherche et filtrage par type d'événement, identifiant d'agent et identifiant de tâche.
- Copie en 1 clic de la charge utile JSON pour faciliter le débogage.

---

## 4. Prochaines Étapes

Maintenant que votre centre de commande est opérationnel :
- Consultez [**AGENTS.fr.md**](AGENTS.fr.md) pour obtenir la description détaillée des 17 rôles de spécialistes.
- Lisez [**ORCHESTRATION.md**](ORCHESTRATION.md) pour découvrir les règles de répartition des tâches, les quotas de concurrence et les politiques de portes qualité.
- Lancez `npm run doctor` pour valider le diagnostic complet de votre environnement.
