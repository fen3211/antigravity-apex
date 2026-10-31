import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import chokidar from 'chokidar';
import { CONFIG, checkPathExists } from '../config.js';
import { eventBus } from './event-bus.js';
import type { AgentInfo, KnowledgeDoc, DirectorStatus } from '../types.js';

const execFileAsync = promisify(execFile);

export class AntigravityBridge {
  private watcher?: any;
  private lastParsedStepIndex: Map<string, number> = new Map();
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
      case 'director': return 'Master Orchestration & Quality Authority';
      case 'researcher': return 'Documentation, Dependencies & Deep Code Inspection';
      case 'frontend-developer': return 'React, Next.js, TypeScript, UI Motion & Ergonomics';
      case 'backend-developer': return 'APIs, Node.js, Python, Databases, Schemas & Security';
      case 'ui-ux-designer': return 'Ergonomics, Liquid Glass Tokens, Visual Hierarchy';
      case 'qa-engineer': return 'Unit/Integration/E2E Test Suites & Regression Verification';
      case 'code-reviewer': return 'Independent Security Audit & Defect Detection';
      case 'senior-architect': return 'Complex System Architecture, Concurrency & L3 Escalation';
      case 'firestore-rules-author': return 'Cloud Firestore Security Rules & Audit';
      default: return 'Specialist Subagent';
    }
  }

  private getDefaultAgents(): AgentInfo[] {
    const list = [
      { id: 'director', name: 'AI Development Director', role: 'ORCHESTRATOR', model: 'gemini-3.8-flash-high', isDirector: true },
      { id: 'researcher', name: 'Researcher', role: 'RESEARCHER', model: 'flash' },
      { id: 'frontend-developer', name: 'Frontend Developer', role: 'FRONTEND', model: 'flash' },
      { id: 'backend-developer', name: 'Backend Developer', role: 'BACKEND', model: 'flash' },
      { id: 'ui-ux-designer', name: 'UI/UX Designer', role: 'DESIGNER', model: 'flash' },
      { id: 'qa-engineer', name: 'QA Engineer', role: 'QA', model: 'flash' },
      { id: 'code-reviewer', name: 'Code Reviewer', role: 'AUDITOR', model: 'flash' },
      { id: 'senior-architect', name: 'Senior Architect', role: 'ARCHITECT', model: 'pro' },
      { id: 'firestore-rules-author', name: 'Firestore Rules Author', role: 'SECURITY', model: 'flash' }
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

    this.watcher = chokidar.watch(watchTargets, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles except those specifically targeted
      persistent: true,
      depth: 4,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this.watcher.on('add', (filePath: string) => this.handleFileChange(filePath, 'add'));
    this.watcher.on('change', (filePath: string) => this.handleFileChange(filePath, 'change'));
    this.watcher.on('unlink', (filePath: string) => this.handleFileChange(filePath, 'unlink'));
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
      this.parseTranscriptFile(filePath);
    }
  }

  // Parse lines in transcript.jsonl incrementally
  private parseTranscriptFile(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      const convId = path.basename(path.dirname(path.dirname(path.dirname(filePath))));

      const lastIndex = this.lastParsedStepIndex.get(filePath) || 0;
      if (lines.length <= lastIndex) return;

      for (let i = lastIndex; i < lines.length; i++) {
        try {
          const entry = JSON.parse(lines[i]);
          this.processTranscriptEntry(entry, convId);
        } catch {
          // ignore partial JSON
        }
      }

      this.lastParsedStepIndex.set(filePath, lines.length);
    } catch (err) {
      console.error('[Bridge] Error reading transcript file:', filePath, err);
    }
  }

  private processTranscriptEntry(entry: any, convId: string) {
    // Check for tool calls like invoke_subagent or run_command
    if (entry.tool_calls && Array.isArray(entry.tool_calls)) {
      for (const call of entry.tool_calls) {
        if (call.name === 'invoke_subagent') {
          const args = call.args || {};
          eventBus.publish({
            type: 'agent.started',
            source: 'LIVE_AGY',
            project_id: convId,
            agent_id: args.TypeName || 'subagent',
            data: {
              role: args.Role,
              typeName: args.TypeName,
              model: args.Model || 'inherit',
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
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      let input = 0;
      let output = 0;
      let cacheRead = 0;

      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.input_tokens) input += obj.input_tokens;
          if (obj.output_tokens) output += obj.output_tokens;
          if (obj.cache_read_tokens) cacheRead += obj.cache_read_tokens;
        } catch {
          // skip
        }
      }
      return { input, output, cacheRead };
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
    const safeFilename = path.basename(filename);
    const targetPath = path.join(CONFIG.KNOWLEDGE_DIR, safeFilename);

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
