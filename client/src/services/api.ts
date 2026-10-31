import type {
  DirectorStatus,
  AgentInfo,
  TaskItem,
  EventPayload,
  ModelMetrics,
  KnowledgeDoc,
  ControlSettings,
  SubagentReport
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
      totalTokens: { input: number; output: number; cacheRead: number };
      totalRuns: number;
      overallSuccessRate: number;
      escalationRate: number;
      verifiedRealSessionsCount: number;
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
  runPrompt: (prompt: string, agentName: string, confirm: boolean) =>
    fetchJson<{ success: boolean; output: string; error?: string }>('/control/run-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, agentName, confirm })
    }),

  // CLI Tools
  getModels: () => fetchJson<{ id: string; name: string }[]>('/models'),
  getPlugins: () => fetchJson<{ raw: string; success: boolean }>('/plugins')
};

// WebSocket Event Subscription Manager
export class EventStreamClient {
  private ws: WebSocket | null = null;
  private listeners: Set<(event: EventPayload) => void> = new Set();
  private isReconnecting = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      const token = await getAuthToken();
      const wsUrl = token ? `${WS_BASE}?token=${encodeURIComponent(token)}` : WS_BASE;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isReconnecting = false;
      };

      this.ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.channel === 'events' && data.event) {
            this.listeners.forEach(cb => cb(data.event));
          }
        } catch {
          // ignore
        }
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public subscribe(cb: (event: EventPayload) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const eventStream = new EventStreamClient();
