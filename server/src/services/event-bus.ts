import { WebSocket } from 'ws';
import { db } from '../db/database.js';
import type { EventPayload, EventType, EventSource } from '../types.js';

class EventBus {
  private clients: Set<WebSocket> = new Set();

  public registerClient(ws: WebSocket) {
    this.clients.add(ws);
    ws.on('close', () => {
      this.clients.delete(ws);
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
      project_id: event.project_id || 'ai-command-center',
      task_id: event.task_id,
      agent_id: event.agent_id,
      type: event.type,
      source: event.source,
      data: event.data || {}
    };

    // Save to SQLite
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
    } catch (err) {
      console.error('[EventBus] Error persisting event to DB:', err);
    }

    // Broadcast to WebSocket clients
    const payload = JSON.stringify({
      channel: 'events',
      event: fullEvent
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

    return fullEvent;
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
