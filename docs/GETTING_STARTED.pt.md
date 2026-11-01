# Primeiros Passos com o Antigravity Apex

[English](GETTING_STARTED.md) • [Русский](GETTING_STARTED.ru.md) • [Español](GETTING_STARTED.es.md) • [Français](GETTING_STARTED.fr.md) • [Português](GETTING_STARTED.pt.md)

Boas-vindas ao **Antigravity Apex**, o painel de controle de missão para o **Google Antigravity** e o framework de orquestração multiagente **AI Development Director**.

Este guia orientará você pelos seus primeiros 5 minutos com o Antigravity Apex: desde a inicialização do ambiente local até o monitoramento de subagentes autônomos, revisão de relatórios de 9 pontos e inspeção de telemetria em tempo real.

---

## 1. O que é o Antigravity Apex?

O Google Antigravity permite que agentes autônomos de IA desenvolvam software em ambientes de trabalho isolados. No entanto, à medida que os agentes proliferam em tarefas de frontend, backend, segurança, testes e conformidade legal, os desenvolvedores precisam de visibilidade e governança centralizadas.

O Antigravity Apex oferece:
- **Visibilidade em Tempo Real**: Acompanhe sessões ativas de agentes, subagentes em execução e consumo de tokens ao vivo conforme acontecem.
- **Controle Dinâmico de Concorrência**: Limite com segurança a execução de subagentes paralelos (até 6 trabalhadores simultâneos) para evitar exaustão de memória e limites de taxa de API.
- **Portões de Qualidade Multinível**: Imponha verificações rigorosas (Portão 1 testes unitários, Portão 2 revisão independente, Portão 2b conformidade legal) antes da aprovação de qualquer tarefa.
- **Escalonamento L4 para Argon em Circuito Fechado**: Detecte falhas repetidas automaticamente (limite de 2 tentativas) e escale para o Gemini Pro ou Gemini 4 Argon com pacotes de reprodução mínimos e isolados.

---

## 2. Inicialização Rápida em 5 Minutos

### Passo 1: Iniciar os Serviços
Abra o terminal e navegue até a pasta do projeto:

```bash
cd d:\Projects\antigravity-apex
npm run dev
```

Como alternativa no Windows, dê um duplo clique em [`start.cmd`](../start.cmd) ou execute `setup.cmd` para uma instalação em 1 clique.

O terminal exibirá:
```text
[ANTIGRAVITY APEX] Server running on http://127.0.0.1:3001
[ANTIGRAVITY APEX] WebSocket stream at ws://127.0.0.1:3001/ws
[ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
[ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
VITE v8.3.5 ready in 250 ms
➜  Local:   http://localhost:5173/
```

### Passo 2: Acessar o Painel
Abra seu navegador de preferência e acesse:
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

A interface exibirá o painel no estilo **Refero Vercel** (com suporte aos temas Paper Light e Obsidian Dark), com a pílula de conexão indicando **ONLINE**.

---

## 3. Conhecendo as Seções do Painel

O Antigravity Apex estrutura a complexa telemetria multiagente em 8 visões especializadas:

### 1. Visão Geral (Overview / Controle de Missão)
O cockpit operacional de alto nível:
- **Status do Director**: Versão do modelo (`Gemini 3.8 Flash High`), sessões ativas e travas de arquivos ativas.
- **Métricas KPI**: Subagentes ativos, tarefas concluídas, taxa global de sucesso e consumo acumulado de tokens.
- **Telemetria Recente**: Transmissão de eventos em tempo real com inicializações de agentes, conclusões e resultados de portões de qualidade.
- **1-Click Setup**: Botão direto para implantar e sincronizar todos os 17 agentes com o Antigravity.

### 2. Gerenciamento de Agentes (Agent Management)
A grade do grupo de 17 especialistas:
- Monitore o estado (`idle`, `running`, `blocked`, `escalated`) de todos os especialistas.
- Inspecione as diretrizes de sistema e atribuições de domínio diretamente em `~/.gemini/config/plugins/ai-director/agents/*.md`.
- Acompanhe taxas de sucesso individuais e o histórico de execuções.
- Acione a sincronização com o Antigravity em 1 clique.

### 3. Fluxo de Trabalho em Tempo Real (Live Workflow)
Um grafo interativo que demonstra o ciclo de vida das tarefas:
- Evolução pelas etapas: `Director_Triage` → `Solo` / `Specialist` → `QualityGate_L1` → `Independent_L2` → `LegalGate` → `Architect_L3` → `Argon_L4` → `Approved`.
- Animações pulsantes destacando tarefas ativas em cada nó.

### 4. Análise de Modelos (Model Analytics)
Monitoramento de consumo de tokens e métricas de desempenho:
- Detalhamento por modelos Gemini: **Gemini 3.8 Flash**, **Gemini Pro (Senior Architect)** e **Gemini 4 Argon**.
- Separação rigorosa entre tokens reais e verificados **LIVE** de transcrições e métricas estimadas **ESTIMATED**.
- Acompanhamento de custos e contadores de tokens de entrada, saída e leitura de cache.

### 5. Gerenciador de Tarefas (Task Manager)
O quadro operacional de tarefas:
- Filtre tarefas por status, prioridade e agente atribuído.
- Inspecione dados detalhados de execução, contagem de retentativas e logs de erros.
- Verifique o rigoroso **Relatório de Subagente de 9 Pontos** entregue pelos especialistas ao concluírem tarefas.

### 6. Memória do Director (Director Memory)
Navegador e editor em tempo real da base de conhecimento global do AI Director:
- Edite diretamente documentos de protocolo como `DIRECTOR_PROTOCOL.md`, `AGENT_REGISTRY.md`, `QUALITY_GATES.md` e `FAILURE_LOG.md`.
- As atualizações são salvas instantaneamente em `~/.gemini/antigravity/knowledge/ai-director/`.

### 7. Centro de Escalonamento (Escalation Center - Gemini 4 Argon)
Cabine de comando para escalonamento de Nível 4:
- Identificação autônoma de falhas repetidas, impasses de diagnóstico e divergências entre agentes.
- Seletor de sensibilidade (`conservative`, `balanced`, `aggressive`).
- Geração de pacotes de prompts sanitizados de 18 pontos com cópia em um clique.
- Fluxo de trabalho de resolução e análise de vereditos em circuito fechado.

### 8. Fluxo Unificado de Eventos (Unified Event Stream)
Visualizador de eventos JSON de alta frequência:
- Transmissão em tempo real de todos os eventos do sistema (`agent.*`, `task.*`, `legal_gate.*`, `escalation.*`).
- Pesquisa e filtragem por tipo de evento, identificador do agente e ID da tarefa.
- Cópia simplificada da carga JSON em um clique para suporte e depuração.

---

## 4. Próximos Passos

Com o seu centro de controle já em execução:
- Consulte [**AGENTS.pt.md**](AGENTS.pt.md) para ver a descrição detalhada dos 17 papéis especialistas.
- Leia [**ORCHESTRATION.md**](ORCHESTRATION.md) para compreender as regras de despacho, controle de concorrência e portões de qualidade.
- Execute `npm run doctor` para conferir a saúde e os diagnósticos do ambiente.
