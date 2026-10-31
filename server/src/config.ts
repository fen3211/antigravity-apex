import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const homeDir = os.homedir();

function getOrInitApiKey(): string {
  if (process.env.COMMAND_CENTER_API_KEY && process.env.COMMAND_CENTER_API_KEY.trim().length > 0) {
    return process.env.COMMAND_CENTER_API_KEY.trim();
  }

  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^COMMAND_CENTER_API_KEY\s*=\s*(.+)$/m);
      if (match && match[1] && match[1].trim().length > 0) {
        const token = match[1].trim().replace(/^['"]|['"]$/g, '');
        process.env.COMMAND_CENTER_API_KEY = token;
        return token;
      }
    } catch (err) {
      console.warn('[Config] Error reading .env file:', err);
    }
  }

  // Generate 32-byte hex token (64 hex characters)
  const generatedToken = crypto.randomBytes(32).toString('hex');
  process.env.COMMAND_CENTER_API_KEY = generatedToken;

  try {
    const entry = `COMMAND_CENTER_API_KEY=${generatedToken}\n`;
    if (fs.existsSync(envPath)) {
      const existing = fs.readFileSync(envPath, 'utf-8');
      const separator = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
      fs.writeFileSync(envPath, existing + separator + entry, 'utf-8');
    } else {
      fs.writeFileSync(envPath, entry, 'utf-8');
    }
    console.log('[Config] Initialized new persistent COMMAND_CENTER_API_KEY in .env');
  } catch (err) {
    console.warn('[Config] Failed to persist COMMAND_CENTER_API_KEY to .env:', err);
  }

  return generatedToken;
}

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  HOST: process.env.HOST || '127.0.0.1',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  API_KEY: getOrInitApiKey(),
  
  // Antigravity paths
  ANTIGRAVITY_DIR: path.join(homeDir, '.gemini', 'antigravity'),
  KNOWLEDGE_DIR: path.join(homeDir, '.gemini', 'antigravity', 'knowledge', 'ai-director'),
  PRESENCE_DIR: path.join(homeDir, '.gemini', 'antigravity', 'presence'),
  BRAIN_DIR: path.join(homeDir, '.gemini', 'antigravity', 'brain'),
  CONVERSATIONS_DIR: path.join(homeDir, '.gemini', 'antigravity', 'conversations'),
  
  // AI Director Plugin paths
  AI_DIRECTOR_PLUGIN_DIR: path.join(homeDir, '.gemini', 'config', 'plugins', 'ai-director'),
  AI_DIRECTOR_AGENTS_DIR: path.join(homeDir, '.gemini', 'config', 'plugins', 'ai-director', 'agents'),
  AI_DIRECTOR_RULES_DIR: path.join(homeDir, '.gemini', 'config', 'plugins', 'ai-director', 'rules'),
  AI_DIRECTOR_SKILLS_DIR: path.join(homeDir, '.gemini', 'config', 'plugins', 'ai-director', 'skills'),
  
  // CLI
  AGY_CLI_PATH: path.join(homeDir, 'AppData', 'Local', 'agy', 'bin', 'agy.exe'),
  
  // DB
  DB_PATH: path.join(process.cwd(), 'command_center.sqlite'),

  // CORS
  ALLOWED_ORIGINS: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ]
};

// Helper to check if a path exists safely
export function checkPathExists(targetPath: string): boolean {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}
