import path from 'path';
import os from 'os';
import fs from 'fs';

const homeDir = os.homedir();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  HOST: process.env.HOST || '127.0.0.1',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
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
