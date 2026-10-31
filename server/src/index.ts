import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { CONFIG } from './config.js';
import { initDatabase, db } from './db/database.js';
import { apiRouter } from './routes/api.js';
import { eventBus } from './services/event-bus.js';

const app = express();
const server = http.createServer(app);

// Initialize DB schema & seeds
initDatabase();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow local tools, Vite dev, or requests without origin (like curl)
    if (!origin || CONFIG.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Dev convenience for localhost
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

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  eventBus.registerClient(ws);

  // Send initial handshake
  ws.send(JSON.stringify({
    channel: 'system',
    message: 'Connected to AI Command Center Event Stream',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch {
      // ignore
    }
  });
});

// Start listening
const PORT = CONFIG.PORT;
server.listen(PORT, CONFIG.HOST, () => {
  console.log('====================================================');
  console.log(`[AI COMMAND CENTER] Server running on http://${CONFIG.HOST}:${PORT}`);
  console.log(`[AI COMMAND CENTER] WebSocket stream at ws://${CONFIG.HOST}:${PORT}/ws`);
  console.log(`[AI COMMAND CENTER] Antigravity dir: ${CONFIG.ANTIGRAVITY_DIR}`);
  console.log(`[AI COMMAND CENTER] Knowledge dir:   ${CONFIG.KNOWLEDGE_DIR}`);
  console.log('====================================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[AI COMMAND CENTER] Shutting down...');
  db.close();
  server.close(() => {
    process.exit(0);
  });
});
