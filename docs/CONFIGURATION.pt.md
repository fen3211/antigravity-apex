[English](CONFIGURATION.md) • [Русский](CONFIGURATION.ru.md) • [Español](CONFIGURATION.es.md) • [Français](CONFIGURATION.fr.md) • [Português](CONFIGURATION.pt.md)

# Referência de Configuração

Este documento oferece uma referência detalhada de todas as opções de configuração estáticas e em tempo de execução do **Antigravity Apex**.

---

## 1. Variáveis de Ambiente (`.env`)

O Antigravity Apex carrega as configurações do arquivo `.env` usando a biblioteca `dotenv`. Todos os parâmetros possuem valores padrão seguros e adequados para ambientes de produção.

### Rede e Runtime do Servidor

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `PORT` | `number` | `3001` | Porta HTTP e WebSocket na qual o servidor backend Express escuta conexões. |
| `HOST` | `string` | `127.0.0.1` | Endereço de interface de rede para binding. Padrão em loopback para maior segurança local. |
| `NODE_ENV` | `string` | `development` | Defina como `production` em compilações finais para ativar cache estrito e silenciar logs detalhados. |

### Segurança e Autenticação

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `COMMAND_CENTER_API_KEY` | `string` | *(Gerado automaticamente)* | Token hexadecimal criptográfico de 32 bytes (64 caracteres hex) obrigatório para requisições de mutação REST e conexões WebSocket. Se estiver em branco, o servidor gera um token seguro na inicialização e o salva em `.env`. |

### Caminhos do Sistema de Arquivos do Antigravity

Por padrão, os caminhos são resolvidos relativamente à pasta base do usuário (`~/.gemini/antigravity`). Você pode redefini-los individualmente:

| Variável | Padrão (Windows) | Padrão (Linux/macOS) | Descrição |
|----------|------------------|----------------------|-----------|
| `ANTIGRAVITY_DIR` | `%USERPROFILE%\.gemini\antigravity` | `~/.gemini/antigravity` | Diretório principal da instalação do Google Antigravity. |
| `KNOWLEDGE_DIR` | `%USERPROFILE%\.gemini\antigravity\knowledge\ai-director` | `~/.gemini/antigravity/knowledge/ai-director` | Diretório contendo os arquivos de protocolo em markdown do AI Development Director. |
| `PRESENCE_DIR` | `%USERPROFILE%\.gemini\antigravity\presence` | `~/.gemini/antigravity/presence` | Diretório monitorado para verificação de travas `.lock` de sessões ativas. |
| `BRAIN_DIR` | `%USERPROFILE%\.gemini\antigravity\brain` | `~/.gemini/antigravity/brain` | Diretório que abriga as transcrições das execuções de subagentes (`transcript.jsonl`). |
| `AGY_CLI_PATH` | `%LOCALAPPDATA%\agy\bin\agy.exe` | `/usr/local/bin/agy` | Caminho do executável da CLI do Antigravity. |
| `DB_PATH` | `./command_center.sqlite` | `./command_center.sqlite` | Caminho do sistema de arquivos para o banco de dados SQLite local. |

---

## 2. Configurações Dinâmicas de Controle (API de Runtime)

Além do `.env`, o Antigravity Apex armazena configurações operacionais dinâmicas na tabela `settings` do SQLite. Elas podem ser modificadas no painel (**Control Center**) ou via API REST:

- **Endpoints**: `GET /api/control/settings` e `POST /api/control/settings`
- **Autenticação**: Requer o cabeçalho `COMMAND_CENTER_API_KEY` ou parâmetro de consulta com o token.

### Esquema e Atributos

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

### Explicação dos Parâmetros

1. `maxConcurrentAgents` (inteiro, 1–10):
   Controla o número máximo de processos de subagentes que o supervisor pode executar simultaneamente. Recomendado: `3` para uso regular; máximo testado: `6`.
2. `maxRetryAttempts` (inteiro, 1–10):
   Limite de tentativas por abordagem antes do escalonamento automático de Nível 3 para o Senior Architect. Padrão: `2`.
3. `defaultModelTier` (string):
   O nível de modelo Gemini padrão atribuído a novas tarefas. Geralmente `gemini-3.8-flash-high`.
4. `escalationPolicy` (`"strict"` | `"relaxed"`):
   - `"strict"`: Bloqueia a tarefa imediatamente após 2 falhas consecutivas e aciona o gerador de prompt pack para o Argon.
   - `"relaxed"`: Concede uma tentativa adicional antes do escalonamento.
5. `autoQualityGates` (booleano):
   Se verdadeiro, o sistema executa automaticamente os testes do Portão de Qualidade 1 assim que o relatório do subagente é enviado.
6. `allowedAgents` (array de strings):
   Lista branca restrita de identificadores de agentes autorizados a serem executados pelo supervisor. Impede o disparo de agentes não homologados.

---

## 3. CORS e Lista Branca de Rede

O backend aplica uma checagem rigorosa de origens CORS através de `CONFIG.ALLOWED_ORIGINS`:

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

Requisições oriundas de origens não autorizadas são rejeitadas com erro **HTTP 403 Forbidden**. Caso você acesse o frontend por meio de uma porta ou host personalizado, inclua-o em `CONFIG.ALLOWED_ORIGINS` no arquivo `server/src/config.ts`.

---

## 4. Parâmetros Operacionais de WebSocket

O servidor WebSocket (`ws://127.0.0.1:3001/ws`) opera sob diretrizes estritas de estabilidade:

- **Tamanho Máximo de Carga**: `64 KB` (`MAX_WS_PAYLOAD = 64 * 1024`). Qualquer pacote recebido que ultrapasse esse teto é rejeitado com o código de encerramento `1009 (Message too large)` e desconexão imediata.
- **Intervalo de Heartbeat**: 30 segundos. Os clientes devem responder a pacotes `ping` com um pacote `pong`; conexões inativas são expurgadas automaticamente.
- **Autenticação**: Exige um token válido fornecido através de:
  - Parâmetro de consulta: `?token=<API_KEY>`
  - Cabeçalho: `Authorization: Bearer <API_KEY>`
  - Cabeçalho: `x-api-key: <API_KEY>`

---

## 5. Configuração de Filtros do Observador de Arquivos

O observador de sistema de arquivos Chokidar filtra alterações com a função `createAntigravityPathFilter(brainDir, presenceDir)`:

### Arquivos Permitidos:
- Qualquer arquivo terminado em `.lock` no diretório `PRESENCE_DIR`.
- Qualquer arquivo com nome `transcript.jsonl` contido em um subdiretório `.system_generated/logs/` dentro de `BRAIN_DIR`.

### Alvos Excluídos / Ignorados:
- Arquivos temporários: `.tmp`, `.swp`, `~*`, `.bak`, `~$*`, `.crdownload`.
- Arquivos e diretórios ocultos iniciados por ponto (exceto `.system_generated`).
- Diretórios pesados de compilação e cache: `node_modules`, `.git`, `dist`, `scratch`, `tempmediaStorage`, `.user_uploaded`.
