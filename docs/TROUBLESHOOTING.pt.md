# Guia de Solução de Problemas e Diagnóstico

[English](TROUBLESHOOTING.md) • [Русский](TROUBLESHOOTING.ru.md) • [Español](TROUBLESHOOTING.es.md) • [Français](TROUBLESHOOTING.fr.md) • [Português](TROUBLESHOOTING.pt.md)

Este guia fornece orientações de diagnóstico e soluções práticas para os problemas mais comuns encontrados ao utilizar o **Antigravity Apex**.

---

## 1. Queda de Conexão WebSocket e Estado "DISCONNECTED"

### Sintomas
- O indicador de status no cabeçalho exibe **DISCONNECTED** ou **RECONNECTING**.
- O Fluxo Unificado de Eventos para de ser atualizado em tempo real.

### Passos de Diagnóstico
1. Abra as Ferramentas de Desenvolvedor do navegador (F12) e examine o **Console** e a aba **Rede** (filtro WS).
2. Verifique o código de fechamento do WebSocket:
   - `1008 (Policy Violation)`: Falha de autenticação (token inválido) ou origem não autorizada.
   - `1009 (Message too large)`: Uma mensagem enviada ultrapassou o limite de 64 KB.
   - `1006 (Abnormal Closure)`: O processo do servidor foi encerrado ou a conexão caiu.

### Soluções
- **Incompatibilidade de Token**: Obtenha um novo token acessando diretamente pelo navegador a URL `http://127.0.0.1:3001/api/auth/token`. O cliente salvará e reutilizará a chave automaticamente.
- **Incompatibilidade de Origem CORS**: Se estiver acessando de outro IP ou domínio (ex.: `http://192.168.1.50:5173`), adicione a origem em `CONFIG.ALLOWED_ORIGINS` no arquivo `server/src/config.ts`.
- **Reiniciar o Servidor**: Se o backend foi finalizado inesperadamente, confira o terminal para analisar o log de erro e reinicie com `npm run dev` ou `start.cmd`.

---

## 2. Sessões ou Transcrições do Antigravity Não Detectadas

### Sintomas
- A aba **Overview** exibe `0 Active Locks` e `0 Live Transcripts`, mesmo com o Antigravity ativo em outro terminal.

### Passos de Diagnóstico
1. Confira os caminhos base do Antigravity exibidos durante a inicialização do servidor:
   ```text
   [ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
   [ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
   ```
2. Verifique se os arquivos realmente existem no disco:
   - Travas: `~/.gemini/antigravity/presence/`
   - Transcrições: `~/.gemini/antigravity/brain/**/.system_generated/logs/transcript.jsonl`

### Soluções
- **Sobrescrita de Caminhos**: Se sua instalação do Antigravity estiver em um caminho personalizado, configure as variáveis explicitamente no `.env`:
   ```env
   ANTIGRAVITY_DIR=D:\CaminhoCustomizado\.gemini\antigravity
   BRAIN_DIR=D:\CaminhoCustomizado\.gemini\antigravity\brain
   PRESENCE_DIR=D:\CaminhoCustomizado\.gemini\antigravity\presence
   KNOWLEDGE_DIR=D:\CaminhoCustomizado\.gemini\antigravity\knowledge\ai-director
   ```
- **Permissões de Arquivo**: Assegure-se de que o usuário executando o Node.js possui permissão de leitura sobre a pasta `.gemini`.

---

## 3. Subagente Travado ou Tempo Limite Esgotado (Timeout)

### Sintomas
- Uma tarefa permanece indefinidamente no estado `in_progress`.
- O terminal indica que o subagente iniciado pelo supervisor parou de gerar logs.

### Passos de Diagnóstico
1. Acesse a aba **Task Manager** no painel de controle.
2. Selecione a tarefa travada e consulte os detalhes da execução e o PID do processo.

### Soluções
- **Cancelar pelo Painel**: Clique no botão **Cancel Task** no painel lateral de detalhes da tarefa. O supervisor enviará um comando de interrupção.
- **Finalização em Árvore de Processos**: Se o processo não finalizar normalmente, o supervisor aciona o encerramento da árvore completa. No Windows, você pode forçar o fechamento via PowerShell:
   ```powershell
   taskkill /PID <PID> /T /F
   ```
- **Ajustar Timeout**: Para tarefas extensas de compilação ou testes E2E, eleve o parâmetro de timeout ao disparar a rota `/tasks/:id/execute`:
   ```json
   {
     "timeoutMs": 300000
   }
   ```

---

## 4. Travamentos no Banco de Dados SQLite (`SQLITE_BUSY: database is locked`)

### Sintomas
- Chamadas para a API REST retornam erro HTTP 500 informando `SQLITE_BUSY: database is locked`.

### Passos de Diagnóstico
1. Cheque se algum aplicativo externo (como DB Browser for SQLite) está com o arquivo `command_center.sqlite` aberto em modo exclusivo.
2. Confirme a presença dos arquivos de diário WAL: `command_center.sqlite-wal` e `command_center.sqlite-shm`.

### Soluções
- **Fechar Ferramentas Externas**: Encerre qualquer ferramenta visual que esteja segurando travas de leitura ou escrita exclusivas.
- **Configuração WAL**: O Antigravity Apex adota o modo WAL com `busy_timeout = 5000` por padrão. Se tiver alterado o arquivo `database.ts`, certifique-se de manter o timeout em ao menos 5000 ms.
- **Recriação do Banco**: Caso o banco tenha sofrido corrupção irreversível, delete `command_center.sqlite`, `command_center.sqlite-wal` e `command_center.sqlite-shm`. O servidor recriará tabelas limpas no próximo arranque.

---

## 5. O Portão Legal Retorna `BLOCKED_RED`

### Sintomas
- Uma tarefa é reprovada no Portão de Qualidade 2b com o status `BLOCKED_RED`.

### Passos de Diagnóstico
1. Inspecione o objeto `LegalAssessment` atrelado à tarefa ou consulte `GET /api/events?type=legal_gate.blocked`.
2. Avalie detalhadamente os campos `identifiedRisks` e `mechanismOfNonCompliance`.

### Motivos Comuns e Correções
- **Licença Copyleft Viral**: Uma biblioteca sob licença AGPL-3.0 ou GPL-3.0 foi adicionada a uma base proprietária distribuída na nuvem. Substitua-a por uma opção sob licença MIT, Apache-2.0 ou BSD.
- **Localização de Dados na Federação Russa (23-FZ)**: Banco de dados com dados pessoais de cidadãos russos mantido fora da Rússia sem gravação primária local. Implante a gravação primária em servidores na Rússia antes de replicar.
- **Caixas Pré-marcadas (69-FZ)**: Formulário de compra ou aceite com checkbox pré-marcado. Remova a marcação padrão para atender à vedação legal a dark patterns (em vigor desde 01.09.2025).
- **Invariante Não Bloqueante**: Quando ocorre `BLOCKED_RED`, apenas a subtarefa não conforme é interrompida. O desenvolvimento de interfaces ou testes automatizados paralelos segue normalmente.

---

## 6. Rejeição de Execução via CLI (`Agent not allowed` / `Command failed`)

### Sintomas
- Ao acionar uma tarefa pelo Control Center, ocorre o erro `error: Agent "<name>" is not allowed` ou `Invalid CLI arguments`.

### Passos de Diagnóstico
1. Verifique a lista de agentes autorizados: `GET /api/control/settings`.
2. Analise o prompt em busca de metacaracteres de shell proibidos: `&`, `|`, `;`, `$`, `>`, `<`, `` ` ``.

### Soluções
- Certifique-se de que o ID do agente está presente em `settings.allowedAgents`. Você pode incluir novos papéis pela aba de configurações do **Control Center**.
- Remova operadores de encadeamento de shell do texto do prompt. Envie instruções limpas e diretas para o `agy.exe`.
