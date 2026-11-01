# Perguntas Frequentes (FAQ)

[English](FAQ.md) • [Русский](FAQ.ru.md) • [Español](FAQ.es.md) • [Français](FAQ.fr.md) • [Português](FAQ.pt.md)

Este documento esclarece as principais questões técnicas, arquiteturais e operacionais sobre o **Antigravity Apex**.

---

## 1. Visão Geral e Arquitetura

### O que é o Antigravity Apex?
O Antigravity Apex é um painel de controle e supervisor operacional local em tempo real para os ambientes de trabalho multiagente do **Google Antigravity** e o framework **AI Development Director**. Ele oferece governança e visibilidade unificada de subagentes autônomos, sessões em execução, consumo de tokens e critérios de qualidade multinível.

### O Antigravity Apex substitui a CLI ou a IDE do Antigravity?
Não. O Antigravity Apex atua de forma complementar como uma camada de supervisão e telemetria. Enquanto o Antigravity comanda a execução autônoma de ferramentas e tarefas, o Antigravity Apex monitora os registros de eventos, controla a concorrência, valida portões de qualidade e gerencia o escalonamento para o Gemini 4 Argon.

### Posso rodar o Antigravity Apex sem ter o Antigravity instalado?
Sim. O Antigravity Apex é totalmente desacoplado. Caso o Antigravity não esteja presente ou ativo, o painel funciona perfeitamente com gestão offline de tarefas, edição da base de conhecimento e telemetria simulada.

### Quais plataformas são suportadas?
O Antigravity Apex é totalmente homologado e compatível com:
- **Windows 10/11** (64-bit)
- **macOS** 12+ (Apple Silicon e Intel)
- **Linux** (Ubuntu 22.04+, Debian 11+, Fedora, Arch)

---

## 2. Concorrência e Desempenho

### Quantos subagentes podem rodar em paralelo?
O sistema suporta até **6 subagentes simultâneos** (`MAX_CONCURRENT_SUBAGENTS = 6`). Por padrão, a execução é throttled para **3 agentes ativos** para assegurar a responsividade do computador e respeitar os limites de requisições de API. Além disso, modelos Pro-tier possuem um teto máximo de **2 instâncias simultâneas**.

### O que é o mecanismo de ingestão "Zero-Disk-Read"?
Sistemas tradicionais de monitoramento de logs releem todo o arquivo desde a linha 0 a cada alteração. Em sessões longas no Antigravity, os arquivos de transcrição atingem dezenas de megabytes, causando picos de CPU e excesso de operações em disco.

O motor `JsonlStreamReader` do Antigravity Apex registra o deslocamento exato em bytes (`last_offset`) no SQLite. Ao notar uma nova gravação, ele lê unicamente os novos blocos de 64 KB a partir daquela posição, preservando caracteres multibyte UTF-8 e eliminando releituras desnecessárias.

### O painel afeta a performance dos meus builds e testes locais?
O impacto é desprezível. O backend roda sobre o event loop eficiente do Node.js com `better-sqlite3` em modo WAL, mantendo o uso de CPU abaixo de 1% e consumindo cerca de 60 MB de memória RAM em repouso.

---

## 3. Roteamento de Modelos e Economia de Tokens

### Quais modelos de IA são suportados?
O sistema distribui tarefas entre os modelos da família Google Gemini:
- **Gemini 3.8 Flash High**: Orquestração do Director, triagem de tarefas e arbitragem de qualidade.
- **Gemini Flash (Medium/Low)**: Desenvolvimento ágil e de baixo custo (frontend, backend, QA, revisão de código, pesquisa).
- **Gemini Pro**: Refatorações arquiteturais complexas e depuração de concorrência (Arquiteto Sênior Nível 3).
- **Gemini 4 Argon**: Raciocínio avançado em circuito fechado para impasses conceituais críticos de Nível 4.

### Qual é a diferença entre métricas LIVE e ESTIMATED de tokens?
- **LIVE**: Tokens extraídos diretamente das transcrições autenticadas do Antigravity (`transcript.jsonl`). Correspondem aos valores exatos de prompt, completion e leitura de cache consumidos.
- **ESTIMATED**: Projeções calculadas com base em médias históricas para tarefas criadas fora de uma sessão em execução.

### Por que o Gemini 4 Argon é operado em "Circuito Fechado"?
O Gemini 4 Argon é um modelo de capacidade máxima reservado a bloqueios técnicos críticos. Para prevenir custos excessivos e alterações imprevistas no código:
1. Ele nunca é acionado em erros rotineiros (exige 2 falhas consecutivas prévias).
2. Ele recebe um **Pacote de Prompts de 18 Pontos** isolado, contendo somente o trecho mínimo reprodutivo (20 a 50 linhas) e traces de erro higienizados.
3. O operador humano efetua a troca manual para o modelo Argon.
4. O Argon gera um diagnóstico arquitetural e um plano de ação, que são reencaminhados para especialistas Flash executarem a codificação.

---

## 4. Portões de Qualidade e Governança Legal

### Quais são os 9 pontos exigidos no Relatório do Subagente?
Todo especialista técnico deve fornecer um relatório estruturado para que a tarefa seja validada no Portão de Qualidade 1:
1. `taskName`
2. `status` (`SUCCESS`, `FAILURE` ou `BLOCKED`)
3. `summary`
4. `modifiedFiles`
5. `executedChecks`
6. `checkResults`
7. `issuesAndRisks`
8. `pendingItems`
9. `nextSteps`

Relatórios que alegam aprovação sem trazer o resultado concreto dos testes executados são rejeitados de imediato.

### O que é o Portão de Qualidade 2b (Portão Legal)?
O Portão 2b realiza a auditoria prévia de funcionalidades para conformidade regulatória na **Federação Russa** (`RU`) e na **União Europeia** (`EU_NL`):
- Legislação russa: 152-FZ (dados pessoais), 156-FZ (consentimento isolado), 23-FZ (localização de bancos de dados), 149-FZ (disseminação de informação), 243-FZ (regulação de IA), Parte IV do Código Civil (propriedade intelectual), 38-FZ/479-FZ (publicidade), Lei 2300-1 / 69-FZ (proibição de dark patterns), 54-FZ (cupom fiscal eletrônico).
- Legislação europeia: GDPR (Regulamento 2016/679), EU AI Act (Regulamento 2024/1689), Diretiva ePrivacy.

### O Portão Legal substitui um advogado humano?
Não. O Portão 2b é um mecanismo automatizado de verificação técnica desenvolvido para identificar riscos antecipadamente no fluxo de desenvolvimento. Para cenários de risco elevado (`RED` ou transferências internacionais complexas), o parecer aconselha expressamente o suporte de assessoria jurídica especializada.

### O que significa o "Invariante Não Bloqueante" em caso de status RED?
Ao constatar um apontamento `BLOCKED_RED`, o portão suspende **exclusivamente a subtarefa em inconformidade** (ex.: tráfego de dados pessoais não localizados). Atividades paralelas seguras (estilização de interface, acessibilidade, testes de unidade) continuam sem qualquer atraso.

---

## 5. Customização e Extensões

### É possível adicionar novos papéis ao grupo de 17 especialistas?
Sim. Para cadastrar um especialista customizado:
1. Crie um arquivo markdown de especificação: `~/.gemini/config/plugins/ai-director/agents/<role-id>.md`.
2. Adicione o identificador do agente em `allowedAgents` pelo **Control Center** do painel ou pela rota `POST /api/control/settings`.
3. O agente passará a figurar na grade **Agent Management** e estará disponível para despacho.

### Como posso hospedar o Antigravity Apex em um servidor remoto?
Configure `HOST=0.0.0.0` no arquivo `.env` e declare os domínios aceitos em `ALLOWED_ORIGINS`. Envie a chave `COMMAND_CENTER_API_KEY` nos cabeçalhos das requisições (`Authorization: Bearer <token>`).
