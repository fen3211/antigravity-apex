import { escalationManager } from './escalation-manager.js';
import { db } from '../db/database.js';
import { eventBus } from './event-bus.js';
import { antigravityBridge } from './antigravity-bridge.js';
import type { TaskItem, SubagentReport, TaskStatus } from '../types.js';

export class TaskManager {
  public getAllTasks(options: { status?: string; isDemo?: boolean; agentId?: string } = {}): TaskItem[] {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }
    if (options.isDemo !== undefined) {
      query += ' AND is_demo = ?';
      params.push(options.isDemo ? 1 : 0);
    }
    if (options.agentId) {
      query += ' AND assigned_agent = ?';
      params.push(options.agentId);
    }

    query += ' ORDER BY updated_at DESC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => this.mapRowToTask(r));
  }

  public getTaskById(id: string): TaskItem | null {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToTask(row);
  }

  public createTask(input: {
    title: string;
    description?: string;
    priority?: TaskItem['priority'];
    assignedAgent?: string;
    stage?: TaskItem['stage'];
    isDemo?: boolean;
  }): TaskItem {
    const id = 'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const task: TaskItem = {
      id,
      title: input.title,
      description: input.description || '',
      status: 'pending',
      priority: input.priority || 'medium',
      assignedAgent: input.assignedAgent || 'director',
      stage: input.stage || 'Director_Triage',
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      maxRetries: 2,
      isDemo: input.isDemo || false
    };

    const stmt = db.prepare(`
      INSERT INTO tasks (
        id, title, description, status, priority, assigned_agent, stage,
        created_at, updated_at, retry_count, max_retries, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.assignedAgent,
      task.stage,
      task.createdAt,
      task.updatedAt,
      task.retryCount,
      task.maxRetries,
      task.isDemo ? 1 : 0
    );

    eventBus.publish({
      type: 'task.created',
      source: task.isDemo ? 'DEMO' : 'INTERNAL_BRIDGE',
      task_id: task.id,
      agent_id: task.assignedAgent,
      data: {
        title: task.title,
        priority: task.priority,
        stage: task.stage
      }
    });

    return task;
  }

  public updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const existing = this.getTaskById(id);
    if (!existing) return null;

    const updated: TaskItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const stmt = db.prepare(`
      UPDATE tasks SET
        title = ?,
        description = ?,
        status = ?,
        priority = ?,
        assigned_agent = ?,
        stage = ?,
        updated_at = ?,
        report = ?,
        retry_count = ?,
        max_retries = ?,
        result_summary = ?,
        error_log = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.title,
      updated.description,
      updated.status,
      updated.priority,
      updated.assignedAgent,
      updated.stage,
      updated.updatedAt,
      updated.report ? JSON.stringify(updated.report) : null,
      updated.retryCount,
      updated.maxRetries,
      updated.resultSummary || null,
      updated.errorLog || null,
      id
    );

    antigravityBridge.updateAgentStatus(
      updated.assignedAgent,
      updated.status === 'in_progress' ? 'running' : 'idle',
      updated.status === 'in_progress' ? updated.title : undefined
    );

    eventBus.publish({
      type: updated.status === 'completed' ? 'task.completed' : 'task.updated',
      source: updated.isDemo ? 'DEMO' : 'INTERNAL_BRIDGE',
      task_id: updated.id,
      agent_id: updated.assignedAgent,
      data: {
        status: updated.status,
        stage: updated.stage,
        result: updated.resultSummary
      }
    });

    return updated;
  }

  public restartTask(id: string): { task: TaskItem | null; escalated: boolean; message: string } {
    const task = this.getTaskById(id);
    if (!task) return { task: null, escalated: false, message: 'Task not found' };

    const newRetryCount = task.retryCount + 1;

    // Check Escalation Policy: If retries exceed maxRetries (2), escalate!
    if (newRetryCount > task.maxRetries) {
      let nextStage: TaskItem['stage'] = 'Architect_L3';
      let nextAgent = 'senior-architect';

      if (task.stage === 'Architect_L3') {
        nextStage = 'Argon_L4';
        nextAgent = 'director';
      }

      const updated = this.updateTask(id, {
        status: 'escalated',
        stage: nextStage,
        assignedAgent: nextAgent,
        retryCount: newRetryCount,
        errorLog: `Maximum retry limit (${task.maxRetries}) reached. Escalating to ${nextStage}.`
      });

      eventBus.publish({
        type: 'escalation.requested',
        source: 'INTERNAL_BRIDGE',
        task_id: id,
        agent_id: nextAgent,
        data: {
          previousAgent: task.assignedAgent,
          level: nextStage === 'Argon_L4' ? 4 : 3,
          reason: 'Max retries exhausted'
        }
      });

      if (nextStage === 'Argon_L4' && updated) {
        try {
          escalationManager.triggerEscalation({
            task: updated,
            reason: `Maximum retries exhausted in ${task.stage}. Automatic Level 4 Escalation.`,
            involvedAgents: [task.assignedAgent, 'senior-architect', 'director']
          });
        } catch (e) {
          console.error('[TaskManager] Failed to auto-trigger escalation:', e);
        }
      }

      return {
        task: updated,
        escalated: true,
        message: `Task failed ${task.maxRetries} times. Automatically escalated to ${nextStage} (${nextAgent}).`
      };
    }

    const updated = this.updateTask(id, {
      status: 'in_progress',
      retryCount: newRetryCount,
      errorLog: undefined,
      stage: 'Specialist'
    });

    return {
      task: updated,
      escalated: false,
      message: `Task restarted (Attempt ${newRetryCount} of ${task.maxRetries}).`
    };
  }

  public submitSubagentReport(taskId: string, report: SubagentReport): TaskItem | null {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const isSuccess = report.status === 'SUCCESS';
    const newStatus: TaskStatus = isSuccess ? 'verification' : 'failed';
    const nextStage = isSuccess ? 'QualityGate_L1' : task.stage;

    const updated = this.updateTask(taskId, {
      status: newStatus,
      stage: nextStage,
      report,
      resultSummary: report.summary
    });

    eventBus.publish({
      type: isSuccess ? 'quality_gate.passed' : 'quality_gate.failed',
      source: 'INTERNAL_BRIDGE',
      task_id: taskId,
      agent_id: task.assignedAgent,
      data: {
        checks: report.executedChecks,
        results: report.checkResults,
        status: report.status
      }
    });

    return updated;
  }

  private mapRowToTask(r: any): TaskItem {
    return {
      id: r.id,
      title: r.title,
      description: r.description || '',
      status: r.status,
      priority: r.priority,
      assignedAgent: r.assigned_agent,
      stage: r.stage,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      report: r.report ? JSON.parse(r.report) : undefined,
      retryCount: r.retry_count,
      maxRetries: r.max_retries,
      isDemo: Boolean(r.is_demo),
      resultSummary: r.result_summary || undefined,
      errorLog: r.error_log || undefined
    };
  }
}

export const taskManager = new TaskManager();
