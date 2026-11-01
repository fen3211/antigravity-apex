# Registro de Alterações (Changelog)

[English](CHANGELOG.md) • [Русский](CHANGELOG.ru.md) • [Español](CHANGELOG.es.md) • [Français](CHANGELOG.fr.md) • [Português](CHANGELOG.pt.md) • [简体中文](CHANGELOG.zh.md) • [日本語](CHANGELOG.ja.md) • [Deutsch](CHANGELOG.de.md)

Todas as alterações notáveis no **Antigravity Apex** estão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-01

### Lançamento Inicial de Código Aberto (Open Source)

Versão inicial de nível de produção do **Antigravity Apex**, o painel de controle de missão e supervisão de telemetria multiagente para Google Antigravity e o framework **AI Development Director**.

### Adicionado

#### 1. Orquestração Multiagente e Pool Canônico de 17 Funções Especialistas
- Suporte integral para 17 funções especializadas:
  - **Funções Centrais**: `director` (Gemini 3.8 Flash High), `researcher` (Flash), `frontend-developer` (Flash), `backend-developer` (Flash), `ui-ux-designer` (Flash), `qa-engineer` (Flash), `code-reviewer` (Flash), `senior-architect` (Nível Pro), `legal-compliance` (Flash).
  - **Especialistas de Domínio**: `security-engineer` (Flash/Pro), `devops-engineer` (Flash/Pro), `product-manager` (Flash), `ai-evaluation-engineer` (Flash/Pro), `performance-engineer` (Flash/Pro), `accessibility-specialist` (Flash), `database-specialist` (Flash/Pro), `data-engineer` (Flash/Pro).
- Controle de simultaneidade dinâmico: configurável até 6 subagentes paralelos (`MAX_CONCURRENT_SUBAGENTS = 6`), simultaneidade padrão de 3 e limite de 2 modelos Pro simultâneos.
- Esvaziamento automático de fila com rastreamento dos estados `QUEUED`, `STARTING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED` e `TIMEOUT`.

#### 2. Motor de Escalação Inteligente para Gemini 4 Argon (Nível 4)
- Implementação completa do protocolo de escalação Argon:
  - Detecção autônoma de 2 tentativas consecutivas com falha por abordagem.
  - Escalação automática para o **Nível 3: Senior Architect (Pro Tier)**.
  - Em caso de impasse arquitetônico persistente: geração de um **Argon Prompt Pack** de 18 pontos higienizado sem vazamentos de credenciais ou caminhos privados.
  - Memória de rejeição e resfriamento anti-spam por assinatura SHA-256 (5 minutos).
  - Ponto de extremidade de resolução em circuito fechado (`POST /api/escalations/:id/response`) que repassa as soluções validadas aos especialistas Flash.

#### 3. Portões de Qualidade Multinível e Relatórios em 9 Pontos
- **Gate 1 (Autoverificação L1)**: Testes unitários locais, linters e validação de relatórios estritos de 9 pontos.
- **Gate 2 (Verificação Independente L2)**: Auditoria automatizada por `qa-engineer` e `code-reviewer`.
- **Gate 2b (Portão Jurídico e de Conformidade)**:
  - Avaliação automatizada para jurisdições russa (`RU`: 152-FZ, 156-FZ, 243-FZ IA) e europeia (`EU_NL`: RGPD, Lei de IA da UE).
  - Invariante não-bloqueante: neutraliza apenas a suboperação arriscada permitindo que tarefas seguras continuem.

#### 4. Ingestão Incremental de Logs sem Sobrecarga de Disco
- Mecanismo `JsonlStreamReader` para leitura de transcrições ao vivo (`transcript.jsonl`) em buffers de 64 KB com proteção UTF-8 multibyte.
- Detecção imediata de rotação, truncamento ou substituição de arquivos por rastreamento de inodes e carimbos de data/hora.
- IDs de eventos determinísticos via SHA-256 para evitar duplicatas no SQLite.

#### 5. Telemetria em Tempo Real e Ponte Antigravity
- Monitor de bloqueios de presença ativos (`~/.gemini/antigravity/presence/*.lock`).
- Separação estrita entre tokens confirmados **LIVE** e valores projetados **ESTIMATED**.
- Explorador de Memória interativo (`Memory Explorer`) para visualização e edição de documentos da base de conhecimento.

#### 6. Sistema de Design Refero / Vercel com Temas Claro e Escuro
- Interface limpa com tema Claro (Paper White `#FAFAFA`) e Escuro (Obsidian Black `#0A0A0A`).
- Zero oscilação no carregamento (Zero FOUT) via script de cabeçalho inline.
- Relações de contraste acessíveis (WCAG 2.1 AA) e gaveta lateral responsiva para dispositivos móveis.

#### 7. Ecossistema de Instalação em 1 Clique
- **Instalador executável para Windows**: [`Antigravity-Apex-Setup.exe`](https://github.com/fen3211/antigravity-apex/releases/latest/download/Antigravity-Apex-Setup.exe) (v1.0.0) — instalação nativa automática sem console e sem Git.
- **Iniciadores de desktop**: [`setup.cmd`](setup.cmd) / [`setup.bat`](setup.bat) para Windows e [`setup.sh`](setup.sh) para Linux/macOS.
- **Iniciadores diários rápidos**: [`start.cmd`](start.cmd) / [`start.bat`](start.bat) e [`start.sh`](start.sh).
- **Scripts de implantação dos 17 especialistas**: [`scripts/install.ps1`](scripts/install.ps1) e [`scripts/install.sh`](scripts/install.sh).
- **Diagnóstico do sistema Doctor**: [`scripts/doctor.js`](scripts/doctor.js) (`npm run doctor`) com 19 verificações automáticas.
- **Instaladores remotos de linha única**: [`scripts/get.ps1`](scripts/get.ps1) e [`scripts/get.sh`](scripts/get.sh).
- **Sincronização na interface web**: botão `⚡ 1-Click Setup` na barra superior.
- **Ambiente em nuvem em 1 clique**: [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) para GitHub Codespaces.

#### 8. Internacionalização Multilíngue (8 Idiomas)
- Suporte nativo para 8 idiomas no painel web e na documentação técnica:
  - 🇬🇧 English (Principal / Padrão)
  - 🇷🇺 Russo
  - 🇪🇸 Espanhol
  - 🇫🇷 Francês
  - 🇵🇹 Português
  - 🇨🇳 Chinês Simplificado
  - 🇯🇵 Japonês
  - 🇩🇪 Alemão
- Menu suspenso de seleção de idioma no cabeçalho (`Header`) com bandeiras de emojis.
- Seletor de idioma interativo nas Configurações (`ControlCenter`) sincronizado com o `localStorage`.
- Documentação técnica completa disponível nos 8 idiomas.
