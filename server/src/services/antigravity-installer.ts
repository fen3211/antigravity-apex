/**
 * ANTIGRAVITY APEX - PROGRAMMATIC ANTIGRAVITY INSTALLER
 * Cross-platform 1-click sync service for deploying 17 specialized agents,
 * orchestration rules, and skills into Antigravity with automated backup.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { CONFIG } from '../config.js';
import { eventBus } from './event-bus.js';

export interface InstallResult {
  success: boolean;
  backupPath: string | null;
  agentsInstalled: string[];
  rulesInstalled: string[];
  skillsInstalled: string[];
  targetDir: string;
  timestamp: string;
  error?: string;
}

/**
 * Copy directory recursively
 */
function copyDirSync(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Creates timestamped backup of existing ai-director plugin directory
 */
function createBackup(pluginDir: string): string | null {
  if (!fs.existsSync(pluginDir)) {
    return null;
  }

  const backupsDir = path.resolve(process.cwd(), 'backups');
  fs.mkdirSync(backupsDir, { recursive: true });

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const backupFolder = path.join(backupsDir, `backup_ai_director_${timestamp}`);

  copyDirSync(pluginDir, backupFolder);
  return backupFolder;
}

/**
 * Deploys the complete 17-agent configuration into Antigravity
 */
export async function syncAntigravityConfiguration(): Promise<InstallResult> {
  const timestamp = new Date().toISOString();
  const projectRoot = process.cwd();
  const agentConfigDir = path.resolve(projectRoot, 'agent-config');

  if (!fs.existsSync(agentConfigDir)) {
    return {
      success: false,
      backupPath: null,
      agentsInstalled: [],
      rulesInstalled: [],
      skillsInstalled: [],
      targetDir: CONFIG.AI_DIRECTOR_PLUGIN_DIR,
      timestamp,
      error: `Source agent-config directory not found at ${agentConfigDir}`
    };
  }

  eventBus.broadcast({
    type: 'SYSTEM_INSTALL_STEP',
    payload: { step: 1, message: 'Creating automated backup of existing configuration...' }
  });

  // 1. Create backup if plugin dir exists
  let backupPath: string | null = null;
  try {
    backupPath = createBackup(CONFIG.AI_DIRECTOR_PLUGIN_DIR);
  } catch (err: any) {
    console.warn('[Installer] Warning during backup creation:', err.message);
  }

  eventBus.broadcast({
    type: 'SYSTEM_INSTALL_STEP',
    payload: { step: 2, message: 'Deploying 17 specialist agent definitions...', backupPath }
  });

  // 2. Target Directories
  const homeDir = os.homedir();
  const targetPluginDir = CONFIG.AI_DIRECTOR_PLUGIN_DIR;
  const targetAgentsDir = CONFIG.AI_DIRECTOR_AGENTS_DIR;
  const targetRulesDir = CONFIG.AI_DIRECTOR_RULES_DIR;
  const targetSkillsDir = CONFIG.AI_DIRECTOR_SKILLS_DIR;
  const targetGlobalSkillsDir = path.join(homeDir, '.gemini', 'config', 'skills');
  const targetGlobalTemplatesDir = path.join(homeDir, '.gemini', 'config', 'templates');

  fs.mkdirSync(targetAgentsDir, { recursive: true });
  fs.mkdirSync(targetRulesDir, { recursive: true });
  fs.mkdirSync(targetSkillsDir, { recursive: true });
  fs.mkdirSync(targetGlobalSkillsDir, { recursive: true });
  fs.mkdirSync(targetGlobalTemplatesDir, { recursive: true });

  const agentsInstalled: string[] = [];
  const rulesInstalled: string[] = [];
  const skillsInstalled: string[] = [];

  try {
    // 3. Deploy Agents (all 17 .md files)
    const srcAgentsDir = path.join(agentConfigDir, 'agents');
    if (fs.existsSync(srcAgentsDir)) {
      const files = fs.readdirSync(srcAgentsDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        fs.copyFileSync(path.join(srcAgentsDir, file), path.join(targetAgentsDir, file));
        agentsInstalled.push(file);
      }
    }

    eventBus.broadcast({
      type: 'SYSTEM_INSTALL_STEP',
      payload: { step: 3, message: 'Installing orchestration rules & GEMINI.md...', count: agentsInstalled.length }
    });

    // 4. Deploy Rules
    const srcRulesDir = path.join(agentConfigDir, 'rules');
    if (fs.existsSync(srcRulesDir)) {
      const files = fs.readdirSync(srcRulesDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        fs.copyFileSync(path.join(srcRulesDir, file), path.join(targetRulesDir, file));
        rulesInstalled.push(file);
      }
    }

    eventBus.broadcast({
      type: 'SYSTEM_INSTALL_STEP',
      payload: { step: 4, message: 'Synchronizing Argon & Director skills...' }
    });

    // 5. Deploy Skills (to plugin skills & global skills)
    const srcSkillsDir = path.join(agentConfigDir, 'skills');
    if (fs.existsSync(srcSkillsDir)) {
      const skillDirs = fs.readdirSync(srcSkillsDir, { withFileTypes: true }).filter(d => d.isDirectory());
      for (const dir of skillDirs) {
        copyDirSync(path.join(srcSkillsDir, dir.name), path.join(targetSkillsDir, dir.name));
        copyDirSync(path.join(srcSkillsDir, dir.name), path.join(targetGlobalSkillsDir, dir.name));
        skillsInstalled.push(dir.name);
      }
    }

    // 6. Deploy Templates
    const srcTemplatesDir = path.join(agentConfigDir, 'templates');
    if (fs.existsSync(srcTemplatesDir)) {
      copyDirSync(srcTemplatesDir, targetGlobalTemplatesDir);
    }

    eventBus.broadcast({
      type: 'SYSTEM_INSTALL_COMPLETED',
      payload: {
        success: true,
        agentsCount: agentsInstalled.length,
        rulesCount: rulesInstalled.length,
        skillsCount: skillsInstalled.length,
        backupPath
      }
    });

    return {
      success: true,
      backupPath,
      agentsInstalled,
      rulesInstalled,
      skillsInstalled,
      targetDir: targetPluginDir,
      timestamp
    };
  } catch (err: any) {
    eventBus.broadcast({
      type: 'SYSTEM_INSTALL_FAILED',
      payload: { error: err.message }
    });

    return {
      success: false,
      backupPath,
      agentsInstalled,
      rulesInstalled,
      skillsInstalled,
      targetDir: targetPluginDir,
      timestamp,
      error: err.message
    };
  }
}
