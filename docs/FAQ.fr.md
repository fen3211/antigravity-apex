# Foire Aux Questions (FAQ)

[English](FAQ.md) • [Русский](FAQ.ru.md) • [Español](FAQ.es.md) • [Français](FAQ.fr.md) • [Português](FAQ.pt.md)

Ce document répond aux questions techniques, architecturales et opérationnelles les plus fréquentes concernant **Antigravity Apex**.

---

## 1. Généralités et Architecture

### Qu'est-ce qu'Antigravity Apex ?
Antigravity Apex est un tableau de bord local en temps réel et superviseur opérationnel conçu pour les espaces de travail multi-agents **Google Antigravity** et le cadre d'orchestration **AI Development Director**. Il centralise la visibilité sur les sous-agents autonomes, les sessions en cours, les dépenses de jetons et la gouvernance de la qualité.

### Antigravity Apex remplace-t-il l'IDE ou la CLI Antigravity ?
Non. Antigravity Apex opère conjointement avec Antigravity comme couche de supervision opérationnelle. Tandis qu'Antigravity pilote l'exécution autonome des outils et du code, Antigravity Apex surveille les transcriptions d'événements, régule la concurrence, vérifie les portes qualité et encadre l'escalade vers Gemini 4 Argon.

### Puis-je faire tourner Antigravity Apex sans qu'Antigravity soit installé ?
Oui. Antigravity Apex est entièrement découplé. Sans Antigravity installé ou actif, le tableau de bord fonctionne avec un suivi de tâches hors ligne, la gestion des documents de mémoire et une télémétrie simulée.

### Quelles plateformes sont prises en charge ?
Antigravity Apex est intégralement testé et pris en charge sous :
- **Windows 10/11** (64-bit)
- **macOS** 12+ (Intel et Apple Silicon)
- **Linux** (Ubuntu 22.04+, Debian 11+, Fedora, Arch)

---

## 2. Concurrence et Performances

### Combien de sous-agents peuvent s'exécuter en parallèle ?
Le système prend en charge jusqu'à **6 sous-agents simultanés** (`MAX_CONCURRENT_SUBAGENTS = 6`). Par défaut, la concurrence est restreinte à **3 agents actifs** afin de maintenir la fluidité de la machine hôte et de respecter les quotas d'API. De plus, les modèles Pro-tier plus onéreux sont plafonnés à **2 instances simultanées** maximum.

### Qu'est-ce que le moteur d'ingestion "Zero-Disk-Read" ?
Les surveillants de logs classiques relisent l'intégralité des fichiers de journal depuis la ligne 0 à chaque modification. Lors de longues sessions Antigravity, les journaux atteignent plusieurs dizaines de mégaoctets, causant des pics de CPU et d'accès disque.

Le moteur `JsonlStreamReader` d'Antigravity Apex mémorise l'octet exact d'arrêt (`last_offset`) dans SQLite. Dès qu'un fichier est modifié, il ne lit que les nouveaux blocs de 64 Ko appendus à partir de cet offset, préservant les frontières multi-octets UTF-8 et supprimant les entrées/sorties disque inutiles.

### Le tableau de bord ralentit-il les compilations locales ?
L'impact est quasiment nul. Le backend fonctionne sur la boucle d'événements légère de Node.js avec `better-sqlite3` en mode WAL, consommant moins de 1 % de CPU et environ 60 Mo de RAM au repos.

---

## 3. Routage des Modèles et Économie des Jetons

### Quels modèles d'IA sont pris en charge ?
Le système répartit les tâches au sein de la gamme Google Gemini :
- **Gemini 3.8 Flash High** : Orchestration du Director, triage des tâches et arbitrage qualité.
- **Gemini Flash (Medium/Low)** : Développement standard rapide et économique (frontend, backend, QA, revue, recherche).
- **Gemini Pro** : Refactorisation architecturale complexe et analyse de concurrence (Architecte Senior Niveau 3).
- **Gemini 4 Argon** : Raisonnement de pointe en circuit fermé pour les blocages conceptuels critiques de Niveau 4.

### Quelle différence entre les métriques de jetons LIVE et ESTIMATED ?
- **LIVE** : Jetons extraits directement des transcriptions réelles et certifiées d'Antigravity (`transcript.jsonl`). Ils reflètent la consommation effective en entrée, sortie et lecture de cache.
- **ESTIMATED** : Projections statistiques basées sur des moyennes observées pour les tâches initiées hors session live.

### Pourquoi maintenir Gemini 4 Argon en "Circuit Fermé" ?
Gemini 4 Argon est un modèle d'exception réservé aux impasses d'ingénierie majeures. Afin d'éviter une dérive des coûts et des modifications accidentelles :
1. Il n'est jamais sollicité pour des erreurs ordinaires (exige 2 échecs préalables).
2. Il reçoit un **Pack de Prompts en 18 Points** isolé contenant uniquement l'extrait de reproduction minimal (20 à 50 lignes) et les traces assainies.
3. L'opérateur humain bascule manuellement sur Argon.
4. Argon formule un diagnostic architectural et une stratégie de correction, qui sont ensuite réinjectés auprès des spécialistes Flash pour le codage.

---

## 4. Portes Qualité et Conformité Légale

### Quels sont les 9 points obligatoires du Rapport de Sous-Agent ?
Chaque spécialiste technique doit soumettre un rapport structuré pour valider la Porte Qualité 1 :
1. `taskName`
2. `status` (`SUCCESS`, `FAILURE` ou `BLOCKED`)
3. `summary`
4. `modifiedFiles`
5. `executedChecks`
6. `checkResults`
7. `issuesAndRisks`
8. `pendingItems`
9. `nextSteps`

Tout rapport affirmant que « tous les tests sont passés » sans fournir les résultats réels du lanceur de tests est immédiatement refusé.

### Qu'est-ce que la Porte Qualité 2b (Porte Légale) ?
La Porte 2b audite les fonctionnalités en amont de leur mise en œuvre pour garantir leur conformité légale en **Fédération de Russie** (`RU`) et dans l'**Union Européenne** (`EU_NL`) :
- Lois russes : 152-FZ (données personnelles), 156-FZ (consentement séparé), 23-FZ (localisation des bases), 149-FZ (diffusion d'informations), 243-FZ (loi IA), Partie IV du Code Civil (propriété intellectuelle), 38-FZ/479-FZ (publicité), Loi 2300-1 / 69-FZ (interdiction des dark patterns), 54-FZ (caisses enregistreuses en ligne).
- Textes européens : RGPD (Règlement 2016/679), AI Act européen (Règlement 2024/1689), Directive ePrivacy.

### La Porte Légale se substitue-t-elle à un juriste humain ?
Non. La Porte 2b constitue un outil technique d'analyse automatisé conçu pour intercepter les non-conformités au plus tôt. Pour les opérations à risque élevé (`RED` ou transferts transfrontaliers complexes), le rapport recommande formellement la consultation d'un avocat spécialisé.

### Qu'est-ce que l'"Invariant Non Bloquant" en cas de statut RED ?
Lorsqu'une non-conformité déclenche un statut `BLOCKED_RED`, seule **la sous-tâche incriminée est interrompue** (ex. transmission directe de données non localisées). Le travail de développement parallèle sain (maquettes UI, intégration CSS, tests unitaires) se poursuit normalement.

---

## 5. Personnalisation et Extension

### Peut-on ajouter de nouveaux rôles d'agents aux 17 spécialistes ?
Oui. Pour enregistrer un nouveau spécialiste :
1. Créez un fichier de spécification markdown : `~/.gemini/config/plugins/ai-director/agents/<role-id>.md`.
2. Ajoutez l'identifiant du rôle dans `allowedAgents` depuis le **Control Center** ou via `POST /api/control/settings`.
3. Le rôle s'affiche immédiatement dans la grille **Agent Management** et devient disponible pour l'attribution de tâches.

### Comment déployer Antigravity Apex sur un serveur distant ?
Renseignez `HOST=0.0.0.0` dans le fichier `.env` et déclarez les domaines Web autorisés dans `ALLOWED_ORIGINS`. Transmettez le jeton `COMMAND_CENTER_API_KEY` dans les en-têtes HTTP (`Authorization: Bearer <token>`).
