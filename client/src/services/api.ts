import type {
  DirectorStatus,
  AgentInfo,
  TaskItem,
  EventPayload,
  ModelMetrics,
  KnowledgeDoc,
  ControlSettings,
  SubagentReport,
  ManagedProcess,
  DataProvenance,
  EscalationItem,
  EscalationStatus,
  EscalationPriority,
  SensitivitySetting,
  EscalationStats
} from '../types.js';


const API_BASE = 'http://localhost:3001/api';
const WS_BASE = 'ws://localhost:3001/ws';

let cachedAuthToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

/**
 * Retrieves the current authentication token, auto-fetching from /api/auth/token if needed.
 */
export async function getAuthToken(): Promise<string | null> {
  if (cachedAuthToken) return cachedAuthToken;
  if (!tokenPromise) {
    tokenPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/token`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.token === 'string') {
            cachedAuthToken = data.token;
            return cachedAuthToken;
          }
        }
      } catch (err) {
        console.warn('[API] Failed to auto-fetch auth token:', err);
      } finally {
        if (!cachedAuthToken) {
          tokenPromise = null;
        }
      }
      return null;
    })();
  }
  return tokenPromise;
}

export function setAuthToken(token: string | null) {
  cachedAuthToken = token;
  tokenPromise = null;
}

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {})
  };

  if (endpoint !== '/auth/token' && !headers['Authorization'] && !headers['authorization']) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Status
  getStatus: () => fetchJson<DirectorStatus>('/status'),

  // Agents
  getAgents: () => fetchJson<AgentInfo[]>('/agents'),
  getAgent: (id: string) => fetchJson<AgentInfo>(`/agents/${id}`),
  updateAgentStatus: (id: string, status: string, currentTask?: string) =>
    fetchJson<{ success: boolean }>(`/agents/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, currentTask })
    }),

  // Tasks
  getTasks: (params?: { status?: string; isDemo?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.isDemo !== undefined) query.set('isDemo', String(params.isDemo));
    return fetchJson<TaskItem[]>(`/tasks?${query.toString()}`);
  },
  createTask: (data: Partial<TaskItem>) =>
    fetchJson<TaskItem>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTask: (id: string, updates: Partial<TaskItem>) =>
    fetchJson<TaskItem>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  restartTask: (id: string) =>
    fetchJson<{ task: TaskItem; escalated: boolean; message: string }>(`/tasks/${id}/restart`, {
      method: 'POST'
    }),
  submitReport: (id: string, report: SubagentReport) =>
    fetchJson<TaskItem>(`/tasks/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ report })
    }),
  executeTask: (id: string, prompt?: string, agentName?: string, timeoutMs?: number) =>
    fetchJson<{ success: boolean; process: ManagedProcess }>(`/tasks/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ prompt, agentName, timeoutMs })
    }),
  cancelTask: (id: string) =>
    fetchJson<{ success: boolean; taskId: string }>(`/tasks/${id}/cancel`, {
      method: 'POST'
    }),
  getTaskProcessStatus: (id: string) =>
    fetchJson<ManagedProcess>(`/tasks/${id}/process-status`),
  getAllProcesses: () =>
    fetchJson<ManagedProcess[]>('/processes'),

  // Events
  getEvents: (params?: { limit?: number; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.type) query.set('type', params.type);
    return fetchJson<EventPayload[]>(`/events?${query.toString()}`);
  },
  publishEvent: (event: Partial<EventPayload>) =>
    fetchJson<EventPayload>('/events', {
      method: 'POST',
      body: JSON.stringify(event)
    }),

  // Analytics
  getAnalytics: () =>
    fetchJson<{
      tiers: ModelMetrics[];
      totalTokens: { input: number; output: number; cacheRead: number; provenance?: DataProvenance };
      totalRuns: number;
      overallSuccessRate: number;
      escalationRate: number;
      verifiedRealSessionsCount: number;
      provenance?: DataProvenance;
    }>('/analytics'),

  // Knowledge Base
  getKnowledgeDocs: () => fetchJson<KnowledgeDoc[]>('/knowledge'),
  getKnowledgeDoc: (filename: string) => fetchJson<KnowledgeDoc>(`/knowledge/${filename}`),
  saveKnowledgeDoc: (filename: string, content: string) =>
    fetchJson<{ success: boolean; filename: string }>(`/knowledge/${filename}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),

  // Control Center
  getSettings: () => fetchJson<ControlSettings>('/control/settings'),
  updateSettings: (settings: Partial<ControlSettings>) =>
    fetchJson<ControlSettings>('/control/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    }),
  generateArgonPack: (data: {
    taskId?: string;
    issueTitle: string;
    rootCauseHypothesis: string;
    failedAttempt1: string;
    failedAttempt2: string;
    isolatedContextSnippet: string;
    targetQuestion: string;
  }) =>
    fetchJson<{ promptPack: string; filename: string }>('/control/escalate-argon', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  submitArgonVerdict: (data: { taskId: string; verdict: string; targetSpecialist: string }) =>
    fetchJson<{ success: boolean; task: TaskItem }>('/control/argon-verdict', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  runPrompt: (prompt: string, agentName: string, confirm: boolean) =>
    fetchJson<{ success: boolean; output: string; error?: string }>('/control/run-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, agentName, confirm })
    }),


  // CLI Tools
  getModels: () => fetchJson<{ id: string; name: string }[]>('/models'),
  getPlugins: () => fetchJson<{ raw: string; success: boolean }>('/plugins'),

  // Intelligent Argon Escalations
  getEscalations: (params?: { status?: EscalationStatus; priority?: EscalationPriority; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return fetchJson<EscalationItem[]>(qs ? `/escalations?${qs}` : '/escalations');
  },
  getEscalationStats: () => fetchJson<EscalationStats>('/escalations/stats'),
  getEscalationSettings: () => fetchJson<{ sensitivity: SensitivitySetting }>('/escalations/settings'),
  updateEscalationSettings: (sensitivity: SensitivitySetting) =>
    fetchJson<{ success: boolean; sensitivity: SensitivitySetting }>('/escalations/settings', {
      method: 'PUT',
      body: JSON.stringify({ sensitivity })
    }),
  getEscalation: (id: string) => fetchJson<EscalationItem>(`/escalations/${id}`),
  evaluateTaskForEscalation: (data: { taskId: string; errorLogs?: string[]; reports?: any[]; codeSnippet?: string }) =>
    fetchJson<any>('/escalations/evaluate-task', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  triggerEscalation: (data: { taskId: string; reason?: string; priority?: EscalationPriority; involvedAgents?: string[]; evidence?: any; force?: boolean }) =>
    fetchJson<{ escalation: EscalationItem; isNew: boolean; deduped: boolean }>('/escalations/trigger', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  copyEscalationPrompt: (id: string) =>
    fetchJson<EscalationItem>(`/escalations/${id}/copy`, { method: 'POST' }),
  sendEscalationToArgon: (id: string) =>
    fetchJson<EscalationItem>(`/escalations/${id}/send`, { method: 'POST' }),
  submitArgonResponse: (id: string, responseText: string) =>
    fetchJson<{ escalation: EscalationItem; directorAnalysis: string }>(`/escalations/${id}/response`, {
      method: 'POST',
      body: JSON.stringify({ responseText })
    }),
  resolveEscalation: (id: string, note?: string) =>
    fetchJson<EscalationItem>(`/escalations/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note })
    }),
  rejectEscalation: (id: string, reason?: string) =>
    fetchJson<EscalationItem>(`/escalations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  regenerateEscalationPrompt: (id: string) =>
    fetchJson<EscalationItem>(`/escalations/${id}/regenerate`, { method: 'POST' }),
};

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' | 'ERROR';

export function calculateBackoffDelay(attempt: number, randomValue = Math.random()): number {
  const base = Math.min(1000 * Math.pow(1.5, attempt), 15000);
  const jitter = randomValue * 500;
  return base + jitter;
}

export interface EventStreamClientOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
}

// WebSocket Event Subscription Manager
export class EventStreamClient {
  private ws: any = null;
  private listeners: Set<(event: EventPayload) => void> = new Set();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private status: ConnectionStatus = 'DISCONNECTED';
  private reconnectAttempt = 0;
  private reconnectTimer: any = null;
  private isManualDisconnect = false;
  private isConnecting = false;
  private customUrl?: string;
  private customToken?: string;

  constructor(options?: EventStreamClientOptions) {
    this.customUrl = options?.url;
    this.customToken = options?.token;
    if (options?.autoConnect !== false) {
      this.connect();
    }
  }

  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach(cb => {
      try {
        cb(newStatus);
      } catch (err) {
        console.error('[EventStreamClient] Error in status listener:', err);
      }
    });
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(cb);
    try {
      cb(this.status);
    } catch (err) {
      console.error('[EventStreamClient] Error in initial status listener call:', err);
    }
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  public async connect(): Promise<void> {
    this.isManualDisconnect = false;

    if (this.status === 'CONNECTED' || this.isConnecting) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isConnecting = true;
    this.setStatus(this.reconnectAttempt > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      const token = this.customToken !== undefined ? this.customToken : await getAuthToken();
      if (this.isManualDisconnect) {
        this.isConnecting = false;
        return;
      }

      const baseUrl = this.customUrl || WS_BASE;
      const wsUrl = token ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : baseUrl;
      const WS = typeof WebSocket !== 'undefined' ? WebSocket : (globalThis as any).WebSocket;
      if (!WS) {
        throw new Error('WebSocket runtime is unavailable');
      }

      const ws = new WS(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        if (this.ws !== ws) return;
        this.isConnecting = false;
        this.reconnectAttempt = 0;
        this.setStatus('CONNECTED');
      };

      ws.onmessage = (msg: any) => {
        try {
          const raw = typeof msg.data === 'string' ? msg.data : msg.data.toString();
          const data = JSON.parse(raw);
          if (data.channel === 'events' && data.event) {
            this.listeners.forEach(cb => cb(data.event));
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.ws = null;
        this.isConnecting = false;
        if (this.isManualDisconnect) {
          this.setStatus('DISCONNECTED');
          return;
        }
        this.scheduleReconnect();
      };

      ws.onerror = () => {
        if (this.ws !== ws) return;
        this.isConnecting = false;
        this.setStatus('ERROR');
        try {
          ws.close();
        } catch {
          // ignore
        }
      };
    } catch (err) {
      console.error('[WS] Connection failed to initialize:', err);
      this.isConnecting = false;
      this.setStatus('ERROR');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isManualDisconnect) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isConnecting = false;
    this.setStatus('RECONNECTING');

    const delay = calculateBackoffDelay(this.reconnectAttempt);
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  public disconnect(): void {
    this.isManualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isConnecting = false;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public subscribe(cb: (event: EventPayload) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const eventStream = new EventStreamClient();
