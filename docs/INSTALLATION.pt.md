# Guia de Instalação e Configuração

[English](INSTALLATION.md) • [Русский](INSTALLATION.ru.md) • [Español](INSTALLATION.es.md) • [Français](INSTALLATION.fr.md) • [Português](INSTALLATION.pt.md)

Este guia fornece instruções detalhadas passo a passo para instalar e configurar o **Antigravity Apex** em ambientes **Windows**, **macOS** e **Linux**, incluindo inicializadores em 1 clique, comandos remotos de linha única e procedimentos manuais.

---

## ⚡ Instalação Rápida em 1 Clique

### Instalação em 1 Clique no Windows
1. Baixe ou clone este repositório.
2. Dê um duplo clique em [`setup.cmd`](../setup.cmd) (ou [`setup.bat`](../setup.bat)) na raiz do projeto.
3. O script instala automaticamente todas as dependências, implanta a configuração dos 17 agentes em `~/.gemini/config/plugins/ai-director`, executa o `doctor.js`, inicia o servidor e abre seu navegador em `http://127.0.0.1:5173/`.

### Instalação em 1 Clique no Linux / macOS
```bash
chmod +x setup.sh && ./setup.sh
```

### Comando Remoto em Linha Única (Sem necessidade de clonar antes)
- **Windows (PowerShell)**:
  ```powershell
  irm https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.ps1 | iex
  ```
- **Linux e macOS (Bash)**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash
  ```

---

## 1. Requisitos do Sistema e Pré-requisitos

### Requisitos Mínimos
- **Node.js**: `v18.0.0` ou superior (testado nas versões Node.js v20.x LTS e v24.x).
- **npm**: `v9.0.0` ou superior.
- **Memória RAM**: Mínimo de 2 GB (recomendado 4 GB para execução concorrente de subagentes).
- **Espaço em Disco**: 200 MB de espaço livre para dependências e o banco de dados SQLite local.
- **Sistema Operacional**:
  - Windows 10/11 (64-bit)
  - macOS 12+ (Apple Silicon ou Intel)
  - Ubuntu 22.04+ / Debian 11+ / Fedora 38+ / Arch Linux

### Ambiente Antigravity (Opcional, mas Recomendado)
Para acompanhamento em tempo real de sessões e telemetria:
- Google Antigravity instalado no sistema local.
- Diretório de trabalho padrão localizado em `~/.gemini/antigravity/` (no Windows: `%USERPROFILE%\.gemini\antigravity`).
- Binário CLI do Antigravity `agy.exe` (no Windows normalmente em `%LOCALAPPDATA%\agy\bin\agy.exe`).

> [!NOTE]
> O Antigravity Apex funciona perfeitamente mesmo sem o Antigravity em execução. Na ausência do Antigravity, o painel opera com gerenciamento de tarefas offline, armazenamento local no banco de dados e telemetria simulada.

---

## 2. Instalação Manual Passo a Passo

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/fen3211/antigravity-apex.git
cd antigravity-apex
```

### Passo 2: Instalar Dependências do Backend
```bash
npm install
```

### Passo 3: Instalar Dependências do Cliente Frontend
```bash
npm --prefix client install
```

### Passo 4: Configurar Variáveis de Ambiente
Copie o modelo `.env.example` para `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

Na primeira inicialização, se a variável `COMMAND_CENTER_API_KEY` for deixada em branco, o servidor gerará automaticamente um token criptográfico seguro de 32 bytes e o salvará no `.env`.

### Passo 5: Implantar Agentes e Habilidades do Antigravity
Implante a suíte completa de 17 agentes, regras e habilidades no seu ambiente Antigravity:

**Windows (PowerShell):**
```powershell
.\scripts\install.ps1 -Force
```

**macOS / Linux:**
```bash
./scripts/install.sh --force
```

---

## 3. Inicialização do Banco de Dados

O banco de dados SQLite (`command_center.sqlite`) é inicializado de forma automática quando o servidor é iniciado.

Características essenciais do banco de dados:
- **Motor**: `better-sqlite3` com bindings nativos.
- **Modo de Diário**: **WAL (Write-Ahead Logging)** ativado para leitura concorrente sem bloqueios e desempenho de escrita atômica.
- **Pragmas**: `busy_timeout = 5000` para prevenir travamentos sob rajadas rápidas de ingestão de dados.
- **Tabelas**: `tasks`, `events`, `settings`, `model_usage`, `session_token_usage`, `log_parse_state`, `legal_assessments`, `escalations`.

Nenhum script manual de migração SQL é necessário.

---

## 4. Diagnóstico do Sistema (`npm run doctor`)

Execute a verificação diagnóstica completa a qualquer momento:

```bash
npm run doctor
```

Validações realizadas:
- Versões de execução do Node.js e npm
- Disponibilidade do Git e estado da branch
- Modo WAL do SQLite e integridade do esquema
- Presença de todas as 17 definições de agentes
- Regras de orquestração e habilidades (`director-orchestration`, `argon-escalation`)
- Diretórios do Antigravity (`brain`, `presence`, `knowledge`)

---

## 5. Verificação e Testes

Verifique se a sua instalação cumpre com todos os requisitos operacionais executando a suíte de testes:

```bash
npm test
```

Executa todas as 8 suítes especializadas:
1. `tests/api.test.ts`: Segurança da API REST, CORS, autenticação e proteção contra injeção CLI.
2. `tests/ingestion.test.ts`: Leitor de streaming incremental, chunking de 64 KB e rotação de arquivos.
3. `tests/analytics.test.ts`: Métricas de tokens LIVE vs ESTIMATED e contabilização de custos.
4. `tests/websocket-resilience.test.ts`: Autenticação WebSocket, limites de payload e pulso ping-pong.
5. `tests/process-supervisor.test.ts`: Criação de processos de subagentes, timeouts com finalização de árvore e controle de concorrência.
6. `tests/legal-compliance.test.ts`: Motor de auditoria jurídica do Portão 2b abrangendo 16 cenários legais.
7. `tests/backend-audit.test.ts`: Descoberta multiplataforma, segurança contra path traversal e verificação do doctor.
8. `tests/intelligent-argon-escalation.test.ts`: Escalonamento de Nível 4 para Argon, pacote de prompts de 18 pontos e intervalo antispam.

---

## 6. Modos de Inicialização

### Modo A: Modo de Desenvolvimento (Hot-Reload)
```bash
npm run dev
```

### Modo B: Inicialização Rápida em 1 Clique no Windows
Dê um duplo clique em [`start.cmd`](../start.cmd).

### Modo C: Compilação e Execução em Produção
```bash
npm run server:build
npm --prefix client run build
npm start
```
