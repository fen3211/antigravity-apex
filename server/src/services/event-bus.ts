import { WebSocket } from 'ws';
import { db } from '../db/database.js';
import type { EventPayload, EventType, EventSource } from '../types.js';

interface HeartbeatWebSocket extends WebSocket {
  isAlive?: boolean;
}

export class EventBus {
  private clients: Set<HeartbeatWebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private inProcessListeners: Set<(event: EventPayload) => void> = new Set();

  constructor() {
    this.startHeartbeat(30000);
  }

  public registerClient(ws: WebSocket): void {
    const client = ws as HeartbeatWebSocket;
    client.isAlive = true;
    this.clients.add(client);

    const onPong = () => {
      client.isAlive = true;
    };

    const onCloseOrError = () => {
      this.unregisterClient(client);
    };

    client.on('pong', onPong);
    client.on('close', onCloseOrError);
    client.on('error', onCloseOrError);
  }

  public unregisterClient(ws: WebSocket): void {
    this.clients.delete(ws as HeartbeatWebSocket);
  }

  public startHeartbeat(intervalMs = 30000): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat();
    }, intervalMs);
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public checkHeartbeat(): void {
    for (const client of Array.from(this.clients)) {
      if (client.isAlive === false) {
        this.clients.delete(client);
        try {
          client.terminate();
        } catch {
          // ignore termination error
        }
        continue;
      }

      client.isAlive = false;
      try {
        client.ping();
      } catch (err) {
        this.clients.delete(client);
        try {
          client.terminate();
        } catch {
          // ignore
        }
      }
    }
  }

  public getClientsCount(): number {
    return this.clients.size;
  }

  public getClients(): Set<WebSocket> {
    return this.clients as Set<WebSocket>;
  }

  public broadcast(event: { type: string; payload?: any }): void {
    const eventType = (event.type as EventType) || 'SYSTEM_NOTIFICATION';
    this.publish({
      type: eventType,
      source: 'SYSTEM',
      data: event.payload || {}
    });
  }

  public publish(event: {
    type: EventType;
    source: EventSource;
    project_id?: string;
    task_id?: string;
    agent_id?: string;
    data?: Record<string, any>;
  }): EventPayload {
    const fullEvent: EventPayload = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      project_id: event.project_id || 'antigravity-apex',
      task_id: event.task_id,
      agent_id: event.agent_id,
      type: event.type,
      source: event.source,
      data: event.data || {}
    };

    // Save to SQLite
    let persisted = false;
    try {
      const stmt = db.prepare(`
        INSERT INTO events (id, timestamp, project_id, task_id, agent_id, type, source, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        fullEvent.id,
        fullEvent.timestamp,
        fullEvent.project_id,
        fullEvent.task_id || null,
        fullEvent.agent_id || null,
        fullEvent.type,
        fullEvent.source,
        JSON.stringify(fullEvent.data)
      );
      persisted = true;
    } catch (err) {
      console.error('[EventBus] Error persisting event to DB:', err);
    }

    // Broadcast to WebSocket clients strictly if successfully persisted
    if (persisted) {
      this.broadcastRawEvent(fullEvent);
    }

    // Notify in-process listeners
    if (this.inProcessListeners) {
      for (const listener of this.inProcessListeners) {
        try {
          listener(fullEvent);
        } catch (err) {
          console.error('[EventBus] Error in in-process listener:', err);
        }
      }
    }

    return fullEvent;
  }

  public broadcastRawEvent(event: EventPayload): void {
    const payload = JSON.stringify({
      channel: 'events',
      event
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (e) {
          console.error('[EventBus] Error sending to WS client:', e);
        }
      }
    }
  }


  public subscribe(cb: (event: EventPayload) => void): () => void {
    this.inProcessListeners.add(cb);
    return () => {
      this.inProcessListeners.delete(cb);
    };
  }

  public getRecentEvents(options: {
    limit?: number;
    type?: string;
    agent_id?: string;
    task_id?: string;
  } = {}): EventPayload[] {
    const limit = Math.min(options.limit || 50, 200);
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];

    if (options.type) {
      query += ' AND type LIKE ?';
      params.push(`%${options.type}%`);
    }
    if (options.agent_id) {
      query += ' AND agent_id = ?';
      params.push(options.agent_id);
    }
    if (options.task_id) {
      query += ' AND task_id = ?';
      params.push(options.task_id);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    try {
      const rows = db.prepare(query).all(...params) as any[];
      return rows.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        project_id: r.project_id,
        task_id: r.task_id || undefined,
        agent_id: r.agent_id || undefined,
        type: r.type,
        source: r.source,
        data: JSON.parse(r.data || '{}')
      }));
    } catch (err) {
      console.error('[EventBus] Error fetching recent events:', err);
      return [];
    }
  }
}

export const eventBus = new EventBus();
