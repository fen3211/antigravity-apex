import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import chokidar from 'chokidar';
import { CONFIG, checkPathExists } from '../config.js';
import { db } from '../db/database.js';
import { eventBus } from './event-bus.js';
import { ingestionQueue } from './ingestion-queue.js';
import type { AgentInfo, KnowledgeDoc, DirectorStatus } from '../types.js';

const execFileAsync = promisify(execFile);

// Path filter predicate for Antigravity live watcher
export function createAntigravityPathFilter(brainDir: string, presenceDir: string) {
  const normBrain = path.resolve(brainDir).replace(/\\/g, '/').toLowerCase();
  const normPresence = path.resolve(presenceDir).replace(/\\/g, '/').toLowerCase();

  return function isAllowedPath(filePath: string, stats?: fs.Stats): boolean {
    const norm = path.resolve(filePath).replace(/\\/g, '/');
    const normLower = norm.toLowerCase();
    const basename = path.basename(norm);

    // 1. Temporary files, editor swap files, backup files, and junk
    if (
      basename.endsWith('.tmp') ||
      basename.endsWith('.swp') ||
      basename.endsWith('~') ||
      basename.endsWith('.bak') ||
      basename.startsWith('~$') ||
      basename.endsWith('.crdownload')
    ) {
      return false;
    }

    // 2. Hidden dotfiles, except .system_generated directories and .lock files
    if (basename.startsWith('.') && !basename.startsWith('.system_generated') && !basename.endsWith('.lock')) {
      if (!normLower.includes('/.system_generated/')) {
        return false;
      }
    }

    // 3. For directories: allow descent into brain and presence subdirectories
    const isDir = stats ? stats.isDirectory() : (!path.extname(norm) && !basename.includes('.'));
    if (isDir) {
      if (!normLower.startsWith(normBrain) && !normLower.startsWith(normPresence)) {
        return false;
      }
      if (
        basename === 'node_modules' ||
        basename === '.git' ||
        basename === 'dist' ||
        basename === 'tempmediaStorage' ||
        basename === 'scratch' ||
        basename === '.user_uploaded'
      ) {
        return false;
      }
      return true;
    }

    // 4. Presence lock files
    if (basename.endsWith('.lock') && normLower.startsWith(normPresence)) {
      return true;
    }

    // 5. Transcript jsonl files strictly within brain directory
    if (basename === 'transcript.jsonl' && normLower.startsWith(normBrain) && normLower.includes('/.system_generated/logs/')) {
      return true;
    }

    return false;
  };
}

export class AntigravityBridge {
  private watcher?: any;
  private isAgyCliAvailable: boolean = false;
  private knownAgents: Map<string, AgentInfo> = new Map();

  constructor() {
    this.isAgyCliAvailable = checkPathExists(CONFIG.AGY_CLI_PATH);
    this.loadAgentSpecs();
    this.initWatcher();
  }

  // Load agent specifications from the global ai-director plugin directory
  public loadAgentSpecs(): AgentInfo[] {
    const agentsDir = CONFIG.AI_DIRECTOR_AGENTS_DIR;
    if (!checkPathExists(agentsDir)) {
      console.warn(`[Bridge] Agents directory not found at: ${agentsDir}`);
      return this.getDefaultAgents();
    }

    try {
      const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const id = file.replace('.md', '');
        const filePath = path.join(agentsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract description, role, model
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const name = nameMatch ? nameMatch[1].trim() : id;
        
        let model = 'flash';
        if (id === 'director') model = 'gemini-3.8-flash-high';
        else if (id === 'senior-architect') model = 'pro';

        const agentInfo: AgentInfo = {
          id,
          name,
          role: id.replace('-', ' ').toUpperCase(),
          domain: this.getAgentDomain(id),
          model,
          status: 'idle',
          promptContent: content,
          successRate: id === 'senior-architect' ? 95 : 98,
          runCount: id === 'director' ? 42 : 15,
          enabled: true,
          isDirector: id === 'director'
        };

        this.knownAgents.set(id, agentInfo);
      }
    } catch (err) {
      console.error('[Bridge] Failed reading agent markdown specs:', err);
    }

    if (this.knownAgents.size === 0) {
      return this.getDefaultAgents();
    }

    return Array.from(this.knownAgents.values());
  }

  private getAgentDomain(id: string): string {
    switch (id) {
      case 'director': return 'Главный оркестратор и арбитр качества';
      case 'researcher': return 'Исследование документации, зависимостей и архитектуры кода';
      case 'frontend-developer': return 'React, Next.js, TypeScript, UI-кинематика и эргономика';
      case 'backend-developer': return 'API, Node.js, Python, базы данных, схемы и безопасность';
      case 'ui-ux-designer': return 'Эргономика, дизайн-системы Liquid Glass, визуальная иерархия';
      case 'qa-engineer': return 'Автоматизированные тесты (Unit/Интеграция/E2E), регрессии';
      case 'code-reviewer': return 'Независимый аудит безопасности diff-ов и поиск дефектов';
      case 'senior-architect': return 'Сложная архитектура, concurrency-гонки и эскалация L3';
      case 'firestore-rules-author': return 'Правила безопасности Cloud Firestore и аудит';
      case 'legal-compliance': return 'Legal Advisor (РФ/ЕС, 152-ФЗ, 243-ФЗ, GDPR) & Technical Writer (README, API docs, регламенты)';
      case 'security-engineer': return 'Application Security, OWASP Top 10, DevSecOps, аудит секретов и защита от инъекций';
      case 'devops-engineer': return 'CI/CD, GitHub Actions, Docker, SRE, мониторинг, бекапы и отказоустойчивость';
      case 'product-manager': return 'Анализ потребностей, формулирование требований, User Stories, Acceptance Criteria и MVP';
      case 'ai-evaluation-engineer': return 'Оценка качества AI, эвалы промптов, надежность агентов, бенчмаркинг и затраты';
      case 'performance-engineer': return 'Оптимизация Core Web Vitals (LCP/CLS/INP), утечки памяти, профилирование и тюнинг SQL';
      case 'accessibility-specialist': return 'Веб-доступность (WCAG 2.1/2.2 AA/AAA), семантический HTML, ARIA, клавиатурная навигация';
      case 'database-specialist': return 'Архитектура БД, нормализация, миграции, оптимизация SQL, транзакции и блокировки';
      case 'data-engineer': return 'ETL/ELT пайплайны, потоковая обработка, парсинг JSON/JSONL/CSV и качество данных';
      default: return 'Профильный субагент';
    }
  }

  private getDefaultAgents(): AgentInfo[] {
    const list = [
      { id: 'director', name: 'AI Development Director', role: 'ОРКЕСТРАТОР', model: 'gemini-3.8-flash-high', isDirector: true },
      { id: 'researcher', name: 'Researcher', role: 'ИССЛЕДОВАТЕЛЬ', model: 'flash' },
      { id: 'frontend-developer', name: 'Frontend Developer', role: 'ФРОНТЕНД', model: 'flash' },
      { id: 'backend-developer', name: 'Backend Developer', role: 'БЭКЕНД', model: 'flash' },
      { id: 'ui-ux-designer', name: 'UI/UX Designer', role: 'ДИЗАЙНЕР', model: 'flash' },
      { id: 'qa-engineer', name: 'QA Engineer', role: 'ТЕСТИРОВЩИК', model: 'flash' },
      { id: 'code-reviewer', name: 'Code Reviewer', role: 'РЕВЬЮЕР', model: 'flash' },
      { id: 'senior-architect', name: 'Senior Architect', role: 'АРХИТЕКТОР', model: 'pro' },
      { id: 'legal-compliance', name: 'Legal Advisor & Tech Writer', role: 'ЮРИСТ И ДОКУМЕНТАЦИЯ', model: 'flash' },
      { id: 'security-engineer', name: 'Security Engineer', role: 'БЕЗОПАСНОСТЬ', model: 'flash' },
      { id: 'devops-engineer', name: 'DevOps / SRE Engineer', role: 'DEVOPS / ИНФРА', model: 'flash' },
      { id: 'product-manager', name: 'Product Manager', role: 'ПРОДУКТ', model: 'flash' },
      { id: 'ai-evaluation-engineer', name: 'AI Evaluation Engineer', role: 'AI ЭВАЛУАТОР', model: 'flash' },
      { id: 'performance-engineer', name: 'Performance Engineer', role: 'ОПТИМИЗАЦИЯ', model: 'flash' },
      { id: 'accessibility-specialist', name: 'Accessibility Specialist', role: 'A11Y ДОСТУПНОСТЬ', model: 'flash' },
      { id: 'database-specialist', name: 'Database Specialist', role: 'БАЗЫ ДАННЫХ', model: 'flash' },
      { id: 'data-engineer', name: 'Data Engineer', role: 'DATA ПАЙПЛАЙНЫ', model: 'flash' }
    ];

    return list.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      domain: this.getAgentDomain(a.id),
      model: a.model,
      status: 'idle',
      successRate: 98,
      runCount: 10,
      enabled: true,
      isDirector: a.isDirector || false
    }));
  }

  // File watcher for Antigravity live events
  private initWatcher() {
    const watchTargets: string[] = [];

    if (checkPathExists(CONFIG.PRESENCE_DIR)) {
      watchTargets.push(CONFIG.PRESENCE_DIR);
    }
    if (checkPathExists(CONFIG.BRAIN_DIR)) {
      watchTargets.push(CONFIG.BRAIN_DIR);
    }

    if (watchTargets.length === 0) {
      console.warn('[Bridge] No active Antigravity directories found to watch.');
      return;
    }

    const filter = createAntigravityPathFilter(CONFIG.BRAIN_DIR, CONFIG.PRESENCE_DIR);

    this.watcher = chokidar.watch(watchTargets, {
      ignored: (targetPath: string, stats?: fs.Stats) => !filter(targetPath, stats),
      persistent: true,
      depth: 6,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this.watcher.on('add', (filePath: string) => this.handleFileChange(filePath, 'add'));
    this.watcher.on('change', (filePath: string) => this.handleFileChange(filePath, 'change'));
    this.watcher.on('unlink', (filePath: string) => this.handleFileChange(filePath, 'unlink'));
  }

  public async closeWatcher(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
  }

  private handleFileChange(filePath: string, action: 'add' | 'change' | 'unlink') {
    // 1. Presence lock files
    if (filePath.endsWith('.lock') && filePath.includes('presence')) {
      const convId = path.basename(filePath, '.lock');
      eventBus.publish({
        type: action === 'unlink' ? 'agent.completed' : 'agent.started',
        source: 'LIVE_AGY',
        project_id: convId,
        agent_id: 'director',
        data: {
          session: convId,
          action,
          lockFile: filePath,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // 2. Transcript JSONL files
    if (filePath.endsWith('transcript.jsonl')) {
      if (action === 'unlink') {
        try {
          db.prepare('UPDATE log_parse_state SET status = ? WHERE file_path = ?').run('UNLINKED', filePath);
        } catch {
          // ignore
        }
      } else {
        ingestionQueue.enqueue(filePath);
      }
    }
  }

  // Parse lines in transcript.jsonl incrementally via IngestionQueue
  public async parseTranscriptFile(filePath: string): Promise<void> {
    await ingestionQueue.processFile(filePath);
  }

  public processTranscriptEntry(entry: any, convId: string) {
    // Check for tool calls like invoke_subagent or run_command
    if (entry.tool_calls && Array.isArray(entry.tool_calls)) {
      for (const call of entry.tool_calls) {
        if (call.name === 'invoke_subagent') {
          const args = call.args || {};
          const rawTypeName = typeof args.TypeName === 'string' ? args.TypeName : '';
          const typeName = rawTypeName.replace(/^"|"$/g, '').trim() || 'subagent';
          const rawRole = typeof args.Role === 'string' ? args.Role.replace(/^"|"$/g, '').trim() : undefined;
          const rawModel = typeof args.Model === 'string' ? args.Model.replace(/^"|"$/g, '').trim() : 'inherit';

          eventBus.publish({
            type: 'agent.started',
            source: 'LIVE_AGY',
            project_id: convId,
            agent_id: typeName,
            data: {
              role: rawRole || typeName,
              typeName,
              model: rawModel,
              promptSnippet: typeof args.Prompt === 'string' ? args.Prompt.slice(0, 150) : '',
              tokens: {
                input: entry.input_tokens || 0,
                output: entry.output_tokens || 0
              }
            }
          });
        }
      }
    }

    // Check errors and completion
    if (entry.status === 'ERROR') {
      eventBus.publish({
        type: 'agent.failed',
        source: 'LIVE_AGY',
        project_id: convId,
        data: {
          stepIndex: entry.step_index,
          error: entry.content ? entry.content.slice(0, 200) : 'Step execution error'
        }
      });
    }
  }

  // Status computation
  public getDirectorStatus(): DirectorStatus {
    const presenceDir = CONFIG.PRESENCE_DIR;
    const activeSessions: DirectorStatus['activeSessions'] = [];

    if (checkPathExists(presenceDir)) {
      try {
        const lockFiles = fs.readdirSync(presenceDir).filter(f => f.endsWith('.lock'));
        const now = Date.now();

        for (const f of lockFiles) {
          const convId = f.replace('.lock', '');
          const stat = fs.statSync(path.join(presenceDir, f));
          const diffMinutes = (now - stat.mtimeMs) / (1000 * 60);
          const isLive = diffMinutes < 15;

          // Try reading token stats from brain if present
          let tokenUsage = undefined;
          const transcriptPath = path.join(CONFIG.BRAIN_DIR, convId, '.system_generated', 'logs', 'transcript.jsonl');
          if (checkPathExists(transcriptPath)) {
            tokenUsage = this.getTokensFromTranscript(transcriptPath);
          }

          activeSessions.push({
            conversationId: convId,
            lastSeen: stat.mtime.toISOString(),
            isLive,
            tokenUsage
          });
        }
      } catch (err) {
        console.error('[Bridge] Error inspecting presence locks:', err);
      }
    }

    const liveSessions = activeSessions.filter(s => s.isLive);

    return {
      state: liveSessions.length > 0 ? 'ACTIVE' : 'ONLINE',
      model: 'Gemini 3.8 Flash High',
      activeSubagentsCount: liveSessions.length > 0 ? 1 : 0,
      maxSubagents: 3,
      activeSessions,
      agyCliAvailable: this.isAgyCliAvailable,
      knowledgeBaseConnected: checkPathExists(CONFIG.KNOWLEDGE_DIR),
      activeLocksCount: activeSessions.length,
      liveTranscriptsCount: liveSessions.length
    };
  }

  private getTokensFromTranscript(filePath: string): { input: number; output: number; cacheRead: number } {
    try {
      const convId = path.basename(path.dirname(path.dirname(path.dirname(filePath))));
      const row = db.prepare(`
        SELECT 
          COALESCE(SUM(CAST(json_extract(data, '$.tokens.input') AS INTEGER)), 0) as input,
          COALESCE(SUM(CAST(json_extract(data, '$.tokens.output') AS INTEGER)), 0) as output
        FROM events 
        WHERE project_id = ?
      `).get(convId) as any;
      if (row && (row.input > 0 || row.output > 0)) {
        return { input: row.input, output: row.output, cacheRead: 0 };
      }
      return { input: 0, output: 0, cacheRead: 0 };
    } catch {
      return { input: 0, output: 0, cacheRead: 0 };
    }
  }

  // Knowledge base management
  public getKnowledgeDocs(): KnowledgeDoc[] {
    const kDir = CONFIG.KNOWLEDGE_DIR;
    if (!checkPathExists(kDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(kDir).filter(f => f.endsWith('.md'));
      return files.map(file => {
        const fullPath = path.join(kDir, file);
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const firstLine = content.split('\n')[0] || file;
        const title = firstLine.replace(/^#+\s*/, '').trim();

        return {
          filename: file,
          path: fullPath,
          title: title || file,
          content,
          lastModified: stat.mtime.toISOString(),
          size: stat.size
        };
      });
    } catch (err) {
      console.error('[Bridge] Error reading knowledge docs:', err);
      return [];
    }
  }

  public saveKnowledgeDoc(filename: string, content: string): boolean {
    if (filename.includes('..')) {
      console.warn('[Bridge] Path traversal rejected (".."):', filename);
      return false;
    }

    const safeFilename = path.basename(filename);
    const resolvedKnowledgeDir = path.resolve(CONFIG.KNOWLEDGE_DIR);
    const targetPath = path.resolve(CONFIG.KNOWLEDGE_DIR, safeFilename);

    if (!targetPath.startsWith(resolvedKnowledgeDir)) {
      console.warn('[Bridge] Path traversal rejected (outside knowledge dir):', targetPath);
      return false;
    }

    // Ensure directory exists
    if (!fs.existsSync(CONFIG.KNOWLEDGE_DIR)) {
      fs.mkdirSync(CONFIG.KNOWLEDGE_DIR, { recursive: true });
    }

    try {
      fs.writeFileSync(targetPath, content, 'utf-8');
      eventBus.publish({
        type: 'task.updated',
        source: 'LIVE_AGY',
        data: {
          file: safeFilename,
          action: 'knowledge_doc_updated',
          timestamp: new Date().toISOString()
        }
      });
      return true;
    } catch (err) {
      console.error('[Bridge] Failed to write knowledge doc:', err);
      return false;
    }
  }

  // Safe agy CLI invocation
  public async runAgyCommand(args: string[], timeoutMs: number = 10000): Promise<{ stdout: string; stderr: string; success: boolean }> {
    if (!this.isAgyCliAvailable) {
      return {
        stdout: '',
        stderr: 'agy.exe is not installed or not found at: ' + CONFIG.AGY_CLI_PATH,
        success: false
      };
    }

    try {
      const { stdout, stderr } = await execFileAsync(CONFIG.AGY_CLI_PATH, args, {
        timeout: timeoutMs,
        windowsHide: true
      });
      return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
    } catch (err: any) {
      return {
        stdout: err.stdout ? err.stdout.trim() : '',
        stderr: err.stderr ? err.stderr.trim() : err.message,
        success: false
      };
    }
  }

  public getKnownAgents(): AgentInfo[] {
    return Array.from(this.knownAgents.values());
  }

  public updateAgentStatus(agentId: string, status: AgentInfo['status'], currentTask?: string) {
    const agent = this.knownAgents.get(agentId);
    if (agent) {
      agent.status = status;
      if (currentTask !== undefined) agent.currentTask = currentTask;
    }
  }
}

export const antigravityBridge = new AntigravityBridge();
