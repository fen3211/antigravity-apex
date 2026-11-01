import { db } from '../db/database.js';
import { antigravityBridge } from './antigravity-bridge.js';
import { eventBus } from './event-bus.js';
import { taskManager } from './task-manager.js';
import type { ControlSettings, TaskItem } from '../types.js';


export class ControlService {
  public getSettings(): ControlSettings {
    const defaultSettings: ControlSettings = {
      maxConcurrentAgents: 6,
      maxRetryAttempts: 2,
      defaultModelTier: 'gemini-3.8-flash-high',
      escalationPolicy: 'strict',
      autoQualityGates: true,
      allowedAgents: [
        'director',
        'researcher',
        'frontend-developer',
        'backend-developer',
        'ui-ux-designer',
        'qa-engineer',
        'code-reviewer',
        'senior-architect',
        'legal-compliance',
        'security-engineer',
        'devops-engineer',
        'product-manager',
        'ai-evaluation-engineer',
        'performance-engineer',
        'accessibility-specialist',
        'database-specialist',
        'data-engineer'
      ]
    };

    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('control_settings') as { value: string } | undefined;
    if (row && row.value) {
      try {
        return { ...defaultSettings, ...JSON.parse(row.value) };
      } catch {
        // fallback
      }
    }

    return defaultSettings;
  }

  public updateSettings(settings: Partial<ControlSettings>): ControlSettings {
    const current = this.getSettings();
    const updated: ControlSettings = {
      ...current,
      ...settings,
      // Enforce strict Director boundaries:
      maxConcurrentAgents: Math.min(Math.max(settings.maxConcurrentAgents ?? current.maxConcurrentAgents, 1), 6),
      maxRetryAttempts: Math.min(Math.max(settings.maxRetryAttempts ?? current.maxRetryAttempts, 1), 2)
    };

    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
      'control_settings',
      JSON.stringify(updated)
    );

    eventBus.publish({
      type: 'task.updated',
      source: 'INTERNAL_BRIDGE',
      data: {
        action: 'settings_updated',
        settings: updated
      }
    });

    return updated;
  }

  // Generate official Level 4 Argon Escalation Prompt Pack
  public generateArgonEscalationPack(params: {
    taskId?: string;
    issueTitle: string;
    rootCauseHypothesis: string;
    failedAttempt1: string;
    failedAttempt2: string;
    isolatedContextSnippet: string;
    targetQuestion: string;
  }): { promptPack: string; filename: string } {
    const timestamp = new Date().toISOString();
    const pack = `# LEVEL 4 ESCALATION TO GEMINI 4 ARGON
Generated: ${timestamp}
Task ID: ${params.taskId || 'MANUAL-ESCALATION'}
Issue: ${params.issueTitle}

## 1. Problem Statement & Symptoms
${params.issueTitle}

## 2. Exhausted Technical Approaches
- **Approach 1 (Failed)**: ${params.failedAttempt1}
- **Approach 2 (Failed)**: ${params.failedAttempt2}

## 3. Working Hypothesis & Senior Architect Diagnosis
${params.rootCauseHypothesis}

## 4. Minimal Isolated Reproduction Context (20-50 lines)
\`\`\`typescript
${params.isolatedContextSnippet}
\`\`\`

## 5. Explicit Directive for Gemini 4 Argon
${params.targetQuestion}

> [!IMPORTANT]
> Rules of Engagement:
> 1. Switch the model selector manually to **Gemini 4 Argon (High)**.
> 2. Submit this prompt pack.
> 3. Receive the architectural diagnosis and strategy.
> 4. Switch the model back to **Gemini 3.8 Flash High** for code implementation and validation.
`;

    eventBus.publish({
      type: 'escalation.requested',
      source: 'INTERNAL_BRIDGE',
      task_id: params.taskId,
      agent_id: 'director',
      data: {
        level: 4,
        targetModel: 'gemini-4-argon-high',
        issue: params.issueTitle
      }
    });

    return {
      promptPack: pack,
      filename: `argon-escalation-${Date.now()}.md`
    };
  }

  // Safe run task through agy CLI print mode
  public async executeTaskPrompt(prompt: string, agentName: string = 'director'): Promise<{
    success: boolean;
    output: string;
    error?: string;
  }> {
    // Sanitize prompt: basic safety check
    if (!prompt || prompt.trim().length === 0) {
      return { success: false, output: '', error: 'Prompt cannot be empty' };
    }

    const args = ['-p', prompt.trim(), '--agent', agentName, '--dangerously-skip-permissions'];
    const result = await antigravityBridge.runAgyCommand(args, 60000);

    if (result.success) {
      return {
        success: true,
        output: result.stdout || result.stderr
      };
    } else {
      return {
        success: false,
        output: result.stdout,
        error: result.stderr || 'Execution failed or timed out'
      };
    }
  }

  /**
   * Closed-loop de-escalation: routes an escalated task from Argon_L4 back to Specialist tier
   * with the synthesized architectural verdict and directive.
   */
  public resolveArgonVerdict(params: {
    taskId: string;
    verdict: string;
    targetSpecialist: string;
  }): TaskItem {
    const task = taskManager.getTaskById(params.taskId);
    if (!task) {
      throw new Error(`Task ${params.taskId} not found`);
    }

    const updatedSummary = task.resultSummary
      ? `${task.resultSummary}\n\n[Argon L4 Verdict]: ${params.verdict}`
      : `[Argon L4 Verdict]: ${params.verdict}`;

    const updatedDescription = task.description
      ? `${task.description}\n\n[Argon Resolution Directive]: ${params.verdict}`
      : `[Argon Resolution Directive]: ${params.verdict}`;

    const updated = taskManager.updateTask(params.taskId, {
      stage: 'Specialist',
      assignedAgent: params.targetSpecialist,
      status: 'in_progress',
      description: updatedDescription,
      resultSummary: updatedSummary,
      errorLog: undefined
    });

    if (!updated) {
      throw new Error(`Failed to update task ${params.taskId}`);
    }

    eventBus.publish({
      type: 'escalation.resolved',
      source: 'INTERNAL_BRIDGE',
      task_id: task.id,
      agent_id: params.targetSpecialist,
      data: {
        previousStage: task.stage,
        resolvedStage: 'Specialist',
        verdict: params.verdict,
        assignedAgent: params.targetSpecialist
      }
    });

    return updated;
  }
}

export const controlService = new ControlService();

