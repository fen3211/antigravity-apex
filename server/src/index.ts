import express from 'express';
import http from 'http';
import cors from 'cors';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';
import { CONFIG } from './config.js';
import { initDatabase, db } from './db/database.js';
import { apiRouter } from './routes/api.js';
import { eventBus } from './services/event-bus.js';
import { analyticsService } from './services/analytics.js';

const app = express();
const server = http.createServer(app);

// Initialize DB schema & seeds
initDatabase();

// 1. CORS Hardening
app.use(cors({
  origin: (origin, callback) => {
    // Allow local tools, Vite dev, or requests without origin (like curl)
    if (!origin || CONFIG.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: Origin not allowed'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'AI COMMAND CENTER',
    director: 'ONLINE',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRouter);

// Express Error Handling Middleware (CORS error -> 403 Forbidden)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.message && err.message.includes('Blocked by CORS policy')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('[Server Error]', err);
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

// WebSocket Server
const MAX_WS_PAYLOAD = 64 * 1024; // 64KB

const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: MAX_WS_PAYLOAD
});

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;

  // Origin check
  if (origin && !CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`[WS] Connection rejected: unauthorized origin "${origin}"`);
    ws.close(1008, 'Unauthorized: Origin not allowed');
    return;
  }

  // Token extraction
  let token: string | null = null;
  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    token = url.searchParams.get('token');
  } catch {
    // ignore parse error
  }

  if (!token && req.headers.authorization) {
    if (req.headers.authorization.toLowerCase().startsWith('bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    } else {
      token = req.headers.authorization.trim();
    }
  }

  if (!token && req.headers['x-api-key']) {
    token = String(req.headers['x-api-key']).trim();
  }

  // Safe timing comparison for token
  let isTokenValid = false;
  if (token && CONFIG.API_KEY) {
    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(CONFIG.API_KEY);
    if (tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      isTokenValid = true;
    }
  }

  if (!isTokenValid) {
    console.warn('[WS] Connection rejected: unauthorized token');
    ws.close(1008, 'Unauthorized');
    return;
  }

  eventBus.registerClient(ws);

  // Send initial handshake
  ws.send(JSON.stringify({
    channel: 'system',
    message: 'Connected to Antigravity Apex Event Stream',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    // Check message byte length
    const byteLength = Buffer.isBuffer(message)
      ? message.length
      : Array.isArray(message)
      ? message.reduce((acc, b) => acc + b.length, 0)
      : Buffer.byteLength(message.toString());

    if (byteLength > MAX_WS_PAYLOAD) {
      console.warn(`[WS] Message payload exceeded 64KB limit (${byteLength} bytes). Closing connection.`);
      eventBus.unregisterClient(ws);
      try {
        ws.close(1009, 'Message too large');
        ws.terminate();
      } catch {}
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'ping') {
        (ws as any).isAlive = true;
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      } else if (data.type === 'pong') {
        (ws as any).isAlive = true;
      }
    } catch {
      // ignore
    }
  });

  ws.on('error', (err) => {
    console.warn('[WS] Socket error:', err.message);
    eventBus.unregisterClient(ws);
    try {
      ws.terminate();
    } catch {}
  });

  ws.on('close', () => {
    eventBus.unregisterClient(ws);
  });
});

import { fileURLToPath } from 'url';
import path from 'path';

export function stopHeartbeat(): void {
  eventBus.stopHeartbeat();
}

export { app, server, wss };

// Start listening only when executed as main module (not when imported in tests)
const isMainModule = process.argv[1] && (() => {
  try {
    return fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
  } catch {
    return false;
  }
})();

if (isMainModule) {
  const PORT = CONFIG.PORT;
  server.listen(PORT, CONFIG.HOST, () => {
    console.log('====================================================');
    console.log(`[AI COMMAND CENTER] Server running on http://${CONFIG.HOST}:${PORT}`);
    console.log(`[AI COMMAND CENTER] WebSocket stream at ws://${CONFIG.HOST}:${PORT}/ws`);
    console.log(`[AI COMMAND CENTER] Antigravity dir: ${CONFIG.ANTIGRAVITY_DIR}`);
    console.log(`[AI COMMAND CENTER] Knowledge dir:   ${CONFIG.KNOWLEDGE_DIR}`);
    console.log('====================================================');

    // Asynchronously scan historical sessions in the background without blocking event loop
    analyticsService.syncHistoricalSessionsBackground(CONFIG.BRAIN_DIR).then(res => {
      if (res.enqueued > 0) {
        console.log(`[Analytics] Enqueued ${res.enqueued} historical transcripts for background ingestion.`);
      }
    }).catch(err => {
      console.warn('[Analytics] Historical background sync error:', err.message);
    });
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[AI COMMAND CENTER] Shutting down...');
  stopHeartbeat();
  db.close();
  server.close(() => {
    process.exit(0);
  });
});
