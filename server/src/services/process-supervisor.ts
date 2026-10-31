import { spawn, exec, ChildProcess } from 'child_process';
import { CONFIG, checkPathExists } from '../config.js';
import { eventBus } from './event-bus.js';
import { taskManager } from './task-manager.js';
import { controlService } from './control.js';
import type { ProcessState, ManagedProcess } from '../types.js';

export { ProcessState, ManagedProcess };

interface ActiveProcessEntry {
  proc: ChildProcess;
  timer: NodeJS.Timeout;
}

interface TaskExecutionConfig {
  prompt: string;
  agentName: string;
  timeoutMs: number;
}

export class TaskProcessSupervisor {
  private processes: Map<string, ManagedProcess> = new Map();
  private activeProcesses: Map<string, ActiveProcessEntry> = new Map();
  private queue: string[] = [];
  private taskConfigs: Map<string, TaskExecutionConfig> = new Map();

  /**
   * Returns current maximum concurrency limit enforced by Director rules (max 3).
   */
  public getMaxConcurrent(): number {
    try {
      const settings = controlService.getSettings();
      return Math.min(Math.max(settings.maxConcurrentAgents || 3, 1), 3);
    } catch {
      return 3;
    }
  }

  /**
   * Spawns or enqueues a managed agent execution task.
   */
  public async spawnTask(
    taskId: string,
    prompt: string,
    agentName: string = 'director',
    timeoutMs: number = 120000
  ): Promise<ManagedProcess> {
    const existing = this.processes.get(taskId);
    if (existing && (existing.state === 'STARTING' || existing.state === 'RUNNING' || existing.state === 'QUEUED')) {
      return existing;
    }

    const now = new Date().toISOString();
    const managed: ManagedProcess = {
      taskId,
      pid: null,
      agentName,
      prompt,
      state: 'QUEUED',
      queuedAt: now,
      startedAt: null,
      finishedAt: null,
      exitCode: null,
      stdout: '',
      stderr: '',
      error: null
    };

    this.processes.set(taskId, managed);
    this.taskConfigs.set(taskId, { prompt, agentName, timeoutMs });

    if (this.getActiveCount() >= this.getMaxConcurrent()) {
      this.queue.push(taskId);
      eventBus.publish({
        type: 'task.updated',
        source: 'INTERNAL_BRIDGE',
        task_id: taskId,
        agent_id: agentName,
        data: {
          processState: 'QUEUED',
          queuePosition: this.queue.length
        }
      });
      return managed;
    }

    this._startProcess(taskId, prompt, agentName, timeoutMs);
    return managed;
  }

  /**
   * Internal method to launch the child process when concurrency slot is available.
   */
  private _startProcess(
    taskId: string,
    prompt: string,
    agentName: string,
    timeoutMs: number
  ): void {
    const managed = this.processes.get(taskId);
    if (!managed) return;

    managed.state = 'STARTING';
    managed.startedAt = new Date().toISOString();

    // Update status in TaskManager
    const task = taskManager.getTaskById(taskId);
    if (task && task.status !== 'in_progress') {
      taskManager.updateTask(taskId, {
        status: 'in_progress',
        assignedAgent: agentName
      });
    }

    eventBus.publish({
      type: 'task.updated',
      source: 'INTERNAL_BRIDGE',
      task_id: taskId,
      agent_id: agentName,
      data: {
        processState: 'STARTING'
      }
    });

    const isMock = process.env.AGY_MOCK_SPAWN === 'true' || !checkPathExists(CONFIG.AGY_CLI_PATH);
    let child: ChildProcess;

    try {
      if (isMock) {
        // Deterministic simulation harness for unit tests & environments without agy.exe
        const mockScript = `
          const prompt = process.env.__MOCK_PROMPT || '';
          if (prompt.includes('__MOCK_STREAM__')) {
            process.stdout.write('Stream chunk 1\\n');
            setTimeout(() => {
              process.stdout.write('Stream chunk 2\\n');
              setTimeout(() => {
                process.exit(0);
              }, 40);
            }, 40);
          } else if (prompt.includes('__MOCK_FAIL__')) {
            process.stderr.write('Simulated CLI execution failure\\n');
            process.exit(1);
          } else if (prompt.includes('__MOCK_SLEEP_')) {
            const match = prompt.match(/__MOCK_SLEEP_(\\d+)__/);
            const ms = match ? parseInt(match[1], 10) : 5000;
            setTimeout(() => {
              process.stdout.write('Mock sleep completed\\n');
              process.exit(0);
            }, ms);
          } else {
            process.stdout.write('Task completed successfully by ' + (process.env.__MOCK_AGENT || 'agent') + '\\n');
            process.exit(0);
          }
        `;
        child = spawn(process.execPath, ['-e', mockScript], {
          windowsHide: true,
          env: {
            ...process.env,
            __MOCK_PROMPT: prompt,
            __MOCK_AGENT: agentName
          }
        });
      } else {
        const args = ['-p', prompt, '--agent', agentName, '--dangerously-skip-permissions'];
        child = spawn(CONFIG.AGY_CLI_PATH, args, { windowsHide: true });
      }
    } catch (err: any) {
      managed.state = 'FAILED';
      managed.finishedAt = new Date().toISOString();
      managed.error = err.message;
      managed.pid = null;

      if (task) {
        taskManager.updateTask(taskId, {
          status: 'failed',
          errorLog: err.message
        });
      }

      eventBus.publish({
        type: 'task.updated',
        source: 'INTERNAL_BRIDGE',
        task_id: taskId,
        agent_id: agentName,
        data: {
          processState: 'FAILED',
          error: err.message
        }
      });

      this._processNextInQueue();
      return;
    }

    managed.state = 'RUNNING';
    managed.pid = child.pid ?? null;

    eventBus.publish({
      type: 'agent.started',
      source: 'LIVE_AGY',
      task_id: taskId,
      agent_id: agentName,
      data: {
        pid: managed.pid,
        processState: 'RUNNING'
      }
    });

    // Timeout watchdog
    const timeoutTimer = setTimeout(async () => {
      if (managed.state === 'RUNNING' || managed.state === 'STARTING') {
        const currentPid = managed.pid;
        managed.state = 'TIMEOUT';
        managed.finishedAt = new Date().toISOString();
        managed.error = `Process timed out after ${timeoutMs}ms`;
        managed.pid = null;

        this.activeProcesses.delete(taskId);

        const existingTask = taskManager.getTaskById(taskId);
        if (existingTask) {
          taskManager.updateTask(taskId, {
            status: 'failed',
            errorLog: managed.error
          });
        }

        eventBus.publish({
          type: 'task.updated',
          source: 'LIVE_AGY',
          task_id: taskId,
          agent_id: agentName,
          data: {
            streamChunk: `[TIMEOUT] ${managed.error}\n`,
            streamType: 'stderr',
            processState: 'TIMEOUT',
            error: managed.error
          }
        });

        if (currentPid) {
          await this._killProcessTree(currentPid);
        }

        this._processNextInQueue();

      }
    }, timeoutMs);

    if (timeoutTimer.unref) {
      timeoutTimer.unref();
    }

    this.activeProcesses.set(taskId, { proc: child, timer: timeoutTimer });

    child.stdout?.on('data', (data: Buffer | string) => {
      const chunk = data.toString();
      managed.stdout += chunk;
      eventBus.publish({
        type: 'task.updated',
        source: 'LIVE_AGY',
        task_id: taskId,
        agent_id: agentName,
        data: {
          streamChunk: chunk,
          streamType: 'stdout',
          processState: managed.state
        }
      });
    });

    child.stderr?.on('data', (data: Buffer | string) => {
      const chunk = data.toString();
      managed.stderr += chunk;
      eventBus.publish({
        type: 'task.updated',
        source: 'LIVE_AGY',
        task_id: taskId,
        agent_id: agentName,
        data: {
          streamChunk: chunk,
          streamType: 'stderr',
          processState: managed.state
        }
      });
    });

    child.on('error', (err: any) => {
      clearTimeout(timeoutTimer);
      this.activeProcesses.delete(taskId);
      if (managed.state === 'CANCELLED' || managed.state === 'TIMEOUT') return;

      managed.state = 'FAILED';
      managed.finishedAt = new Date().toISOString();
      managed.error = err.message;
      managed.pid = null;

      const existingTask = taskManager.getTaskById(taskId);
      if (existingTask) {
        taskManager.updateTask(taskId, {
          status: 'failed',
          errorLog: err.message
        });
      }

      eventBus.publish({
        type: 'task.updated',
        source: 'LIVE_AGY',
        task_id: taskId,
        agent_id: agentName,
        data: {
          streamChunk: err.message,
          streamType: 'stderr',
          processState: 'FAILED',
          error: err.message
        }
      });

      this._processNextInQueue();
    });

    child.on('close', (code: number | null) => {
      clearTimeout(timeoutTimer);
      this.activeProcesses.delete(taskId);
      if (managed.state === 'CANCELLED' || managed.state === 'TIMEOUT') return;

      managed.exitCode = code;
      managed.finishedAt = new Date().toISOString();
      managed.pid = null;

      if (code === 0) {
        managed.state = 'COMPLETED';
        const existingTask = taskManager.getTaskById(taskId);
        if (existingTask) {
          taskManager.updateTask(taskId, {
            status: 'completed',
            resultSummary: managed.stdout.trim() || 'Task execution completed successfully'
          });
        }

        eventBus.publish({
          type: 'task.completed',
          source: 'LIVE_AGY',
          task_id: taskId,
          agent_id: agentName,
          data: {
            processState: 'COMPLETED',
            exitCode: 0,
            resultSummary: managed.stdout.slice(-1000)
          }
        });
      } else {
        managed.state = 'FAILED';
        const errorMsg = managed.stderr.trim() || managed.error || `Process exited with code ${code}`;
        managed.error = errorMsg;
        const existingTask = taskManager.getTaskById(taskId);
        if (existingTask) {
          taskManager.updateTask(taskId, {
            status: 'failed',
            errorLog: errorMsg
          });
        }

        eventBus.publish({
          type: 'task.updated',
          source: 'LIVE_AGY',
          task_id: taskId,
          agent_id: agentName,
          data: {
            processState: 'FAILED',
            exitCode: code,
            error: errorMsg
          }
        });
      }

      this._processNextInQueue();
    });
  }

  /**
   * Cancels a queued or actively running task by PID and process tree termination.
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    const managed = this.processes.get(taskId);
    if (!managed) return false;

    // 1. If currently in queue
    const queueIdx = this.queue.indexOf(taskId);
    if (queueIdx !== -1) {
      this.queue.splice(queueIdx, 1);
      managed.state = 'CANCELLED';
      managed.finishedAt = new Date().toISOString();
      managed.pid = null;

      const task = taskManager.getTaskById(taskId);
      if (task) {
        taskManager.updateTask(taskId, {
          status: 'failed',
          errorLog: 'Task cancelled while queued'
        });
      }

      eventBus.publish({
        type: 'task.updated',
        source: 'INTERNAL_BRIDGE',
        task_id: taskId,
        agent_id: managed.agentName,
        data: {
          processState: 'CANCELLED'
        }
      });

      return true;
    }

    // 2. If actively running or starting
    const active = this.activeProcesses.get(taskId);
    if (active || managed.state === 'STARTING' || managed.state === 'RUNNING') {
      if (active) {
        clearTimeout(active.timer);
        this.activeProcesses.delete(taskId);
      }

      const currentPid = managed.pid;
      managed.state = 'CANCELLED';
      managed.finishedAt = new Date().toISOString();
      managed.pid = null; // Clean PID

      if (currentPid) {
        await this._killProcessTree(currentPid);
      }

      const task = taskManager.getTaskById(taskId);
      if (task) {
        taskManager.updateTask(taskId, {
          status: 'failed',
          errorLog: 'Task cancelled by user'
        });
      }

      eventBus.publish({
        type: 'task.updated',
        source: 'INTERNAL_BRIDGE',
        task_id: taskId,
        agent_id: managed.agentName,
        data: {
          processState: 'CANCELLED'
        }
      });

      this._processNextInQueue();
      return true;
    }

    return false;
  }

  /**
   * Kills a process tree safely across Windows and POSIX.
   */
  private async _killProcessTree(pid: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2000);
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${pid} /T /F`, () => {
          clearTimeout(timer);
          resolve();
        });
      } else {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          try {
            process.kill(pid, 'SIGKILL');
          } catch {
            // ignore
          }
        }
        clearTimeout(timer);
        resolve();
      }
    });
  }

  /**
   * Automatically dequeues and executes waiting tasks when slots become available.
   */
  private _processNextInQueue(): void {
    while (this.getActiveCount() < this.getMaxConcurrent() && this.queue.length > 0) {
      const nextTaskId = this.queue.shift();
      if (!nextTaskId) break;

      const config = this.taskConfigs.get(nextTaskId);
      if (config) {
        this._startProcess(nextTaskId, config.prompt, config.agentName, config.timeoutMs);
      }
    }
  }

  public getProcess(taskId: string): ManagedProcess | undefined {
    return this.processes.get(taskId);
  }

  public getAllProcesses(): ManagedProcess[] {
    return Array.from(this.processes.values()).sort(
      (a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime()
    );
  }

  public getActiveCount(): number {
    return this.activeProcesses.size;
  }

  /**
   * Helper to wait for a managed process to reach a terminal state.
   */
  public waitForCompletion(taskId: string, timeoutMs: number = 10000): Promise<ManagedProcess> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const proc = this.getProcess(taskId);
        if (!proc) {
          clearInterval(interval);
          return reject(new Error(`Process ${taskId} not found`));
        }
        if (['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(proc.state)) {
          clearInterval(interval);
          return resolve(proc);
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          return reject(new Error(`Timed out waiting for process ${taskId} to complete`));
        }
      }, 20);
      if (interval.unref) interval.unref();
    });
  }

  /**
   * Clean shutdown of all running tasks, timers, and queues.
   */
  public shutdown(): void {
    // Clear queued
    for (const taskId of this.queue) {
      const managed = this.processes.get(taskId);
      if (managed) {
        managed.state = 'CANCELLED';
        managed.finishedAt = new Date().toISOString();
        managed.pid = null;
      }
    }
    this.queue = [];

    // Clear active processes and timers
    for (const [taskId, active] of this.activeProcesses.entries()) {
      clearTimeout(active.timer);
      const managed = this.processes.get(taskId);
      if (managed) {
        const currentPid = managed.pid;
        managed.state = 'CANCELLED';
        managed.finishedAt = new Date().toISOString();
        managed.pid = null;
        if (currentPid) {
          this._killProcessTree(currentPid).catch(() => {});
        }
      }
    }
    this.activeProcesses.clear();
  }
}

export const processSupervisor = new TaskProcessSupervisor();
