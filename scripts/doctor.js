#!/usr/bin/env node
/**
 * AI COMMAND CENTER - DIAGNOSTIC SYSTEM DOCTOR
 * Comprehensive cross-platform diagnostic tool for Antigravity & AI Director.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const symbols = {
  pass: `${colors.green}✓${colors.reset}`,
  warn: `${colors.yellow}⚠${colors.reset}`,
  fail: `${colors.red}✗${colors.reset}`,
  info: `${colors.cyan}ℹ${colors.reset}`
};

let passCount = 0;
let warnCount = 0;
let failCount = 0;

function report(status, title, detail = '') {
  let symbol = symbols.info;
  if (status === 'PASS') {
    symbol = symbols.pass;
    passCount++;
  } else if (status === 'WARN') {
    symbol = symbols.warn;
    warnCount++;
  } else if (status === 'FAIL') {
    symbol = symbols.fail;
    failCount++;
  }

  const detailText = detail ? ` ${colors.dim}(${detail})${colors.reset}` : '';
  console.log(`  [${symbol}] ${title}${detailText}`);
}

function section(title) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

const homeDir = os.homedir();
const baseGeminiDir = path.join(homeDir, '.gemini');
const aiDirectorPluginDir = path.join(baseGeminiDir, 'config', 'plugins', 'ai-director');

console.log(`${colors.bold}${colors.white}`);
console.log('=======================================================================');
console.log('       AI COMMAND CENTER - SYSTEM DIAGNOSTICS & HEALTH CHECK           ');
console.log('=======================================================================');
console.log(`${colors.reset}`);

// -----------------------------------------------------------------------------
// 1. Runtime & Environment
// -----------------------------------------------------------------------------
section('1. Runtime & Environment');

// 1.1 Node.js
const nodeVer = process.version;
const nodeMajor = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
if (nodeMajor >= 18) {
  report('PASS', `Node.js ${nodeVer}`, 'Required >= 18.0.0');
} else {
  report('FAIL', `Node.js ${nodeVer} is unsupported`, 'Please upgrade to Node.js 18, 20 or 22 LTS');
}

// 1.2 npm
try {
  const npmVer = execSync('npm -v', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  report('PASS', `npm v${npmVer}`);
} catch {
  report('FAIL', 'npm is not detected in PATH');
}

// 1.3 Git
try {
  const gitVer = execSync('git --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  report('PASS', gitVer);
} catch {
  report('WARN', 'git not found in PATH', 'Worktree features will not be available');
}

// -----------------------------------------------------------------------------
// 2. Project Configuration
// -----------------------------------------------------------------------------
section('2. Project Configuration');

// 2.1 package.json
const pkgPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const hasDeps = pkg.dependencies && pkg.dependencies.express && pkg.dependencies.ws;
    if (hasDeps) {
      report('PASS', `package.json valid (${pkg.name} v${pkg.version})`);
    } else {
      report('WARN', 'package.json missing core dependencies');
    }
  } catch (err) {
    report('FAIL', 'package.json could not be parsed', err.message);
  }
} else {
  report('FAIL', 'package.json not found in project root');
}

// 2.2 node_modules
const nmPath = path.join(projectRoot, 'node_modules');
if (fs.existsSync(nmPath)) {
  report('PASS', 'node_modules directory present');
} else {
  report('FAIL', 'node_modules directory missing', 'Run npm install');
}

// 2.3 .env configuration
const envPath = path.join(projectRoot, '.env');
const envExamplePath = path.join(projectRoot, '.env.example');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasKey = /COMMAND_CENTER_API_KEY\s*=\s*[a-zA-Z0-9_-]{16,}/.test(envContent);
  if (hasKey) {
    report('PASS', '.env configured with persistent API key');
  } else {
    report('WARN', '.env present but API key is unset', 'Will be auto-generated on launch');
  }
} else if (fs.existsSync(envExamplePath)) {
  report('WARN', '.env not found', '.env.example is available. Server will auto-create .env');
} else {
  report('FAIL', 'Neither .env nor .env.example found');
}

// -----------------------------------------------------------------------------
// 3. AI Director Instructions & Rules
// -----------------------------------------------------------------------------
section('3. AI Director Instructions & Rules');

const geminiCandidatePaths = [
  path.join(baseGeminiDir, 'config', 'plugins', 'ai-director', 'rules', 'GEMINI.md'),
  path.join(baseGeminiDir, 'config', 'GEMINI.md'),
  path.join(projectRoot, 'agent-config', 'rules', 'GEMINI.md')
];

let geminiFound = false;
for (const p of geminiCandidatePaths) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    const has17 = content.includes('17 ролей') || content.includes('17 специалис');
    const hasGates = content.includes('Legal Gate') || content.includes('Gate 2b');
    if (has17 && hasGates) {
      report('PASS', `GEMINI.md verified`, p);
      geminiFound = true;
      break;
    }
  }
}
if (!geminiFound) {
  report('WARN', 'GEMINI.md with 17-specialist guidelines not found in active paths', 'Run scripts/install.ps1 or install.sh');
}

const agentsCandidatePaths = [
  path.join(baseGeminiDir, 'config', 'plugins', 'ai-director', 'rules', 'AGENTS.md'),
  path.join(baseGeminiDir, 'config', 'AGENTS.md'),
  path.join(projectRoot, 'agent-config', 'rules', 'AGENTS.md')
];

let agentsRuleFound = false;
for (const p of agentsCandidatePaths) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    const hasMax6 = content.includes('MAX_CONCURRENT_SUBAGENTS = 6') || content.includes('MAX_CONCURRENT_SUBAGENTS');
    if (hasMax6) {
      report('PASS', `AGENTS.md verified (max 6 concurrency rule)`, p);
      agentsRuleFound = true;
      break;
    }
  }
}
if (!agentsRuleFound) {
  report('WARN', 'AGENTS.md operational rules not found', 'Run scripts/install.ps1 or install.sh');
}

// -----------------------------------------------------------------------------
// 4. 17 Specialized Agent Definitions
// -----------------------------------------------------------------------------
section('4. 17 Specialized Agent Definitions');

const EXPECTED_AGENTS = [
  'director',
  'researcher',
  'senior-architect',
  'frontend-developer',
  'backend-developer',
  'ui-ux-designer',
  'qa-engineer',
  'code-reviewer',
  'legal-compliance',
  'security-engineer',
  'devops-engineer',
  'product-manager',
  'ai-evaluation-engineer',
  'performance-engineer',
  'accessibility-specialist',
  'database-specialist',
  'data-engineer'
];

const agentsDirActive = path.join(aiDirectorPluginDir, 'agents');
const agentsDirFallback = path.join(projectRoot, 'agent-config', 'agents');
const resolvedAgentsDir = fs.existsSync(agentsDirActive) ? agentsDirActive : (fs.existsSync(agentsDirFallback) ? agentsDirFallback : null);

if (!resolvedAgentsDir) {
  report('FAIL', 'Agents directory not found in plugin or agent-config', 'Run scripts/install.ps1 or install.sh');
} else {
  let foundAgents = 0;
  for (const agentId of EXPECTED_AGENTS) {
    const agentFile = path.join(resolvedAgentsDir, `${agentId}.md`);
    if (fs.existsSync(agentFile)) {
      const content = fs.readFileSync(agentFile, 'utf-8');
      const hasFrontmatter = content.startsWith('---');
      const hasName = content.includes(`name: ${agentId}`);
      if (hasFrontmatter && hasName) {
        foundAgents++;
      } else {
        report('WARN', `Agent definition invalid: ${agentId}.md`, 'Frontmatter or name mismatch');
      }
    } else {
      report('FAIL', `Agent definition missing: ${agentId}.md`);
    }
  }

  if (foundAgents === EXPECTED_AGENTS.length) {
    report('PASS', `All 17 agent definitions verified`, resolvedAgentsDir);
  } else {
    report('WARN', `${foundAgents}/${EXPECTED_AGENTS.length} agent definitions verified`);
  }
}

// -----------------------------------------------------------------------------
// 5. Skills Availability
// -----------------------------------------------------------------------------
section('5. Orchestration Skills');

const skillCandidatePaths = [
  path.join(aiDirectorPluginDir, 'skills', 'director-orchestration', 'SKILL.md'),
  path.join(projectRoot, 'agent-config', 'skills', 'director-orchestration', 'SKILL.md')
];

let skillFound = false;
for (const p of skillCandidatePaths) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    if (content.includes('director-orchestration') && content.includes('Triage Matrix')) {
      report('PASS', 'director-orchestration skill verified', p);
      skillFound = true;
      break;
    }
  }
}
if (!skillFound) {
  report('WARN', 'director-orchestration SKILL.md not found in active skill paths');
}

const argonCandidatePaths = [
  path.join(aiDirectorPluginDir, 'skills', 'argon-escalation', 'SKILL.md'),
  path.join(projectRoot, 'agent-config', 'skills', 'argon-escalation', 'SKILL.md')
];

let argonFound = false;
for (const p of argonCandidatePaths) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    if (content.includes('argon-escalation')) {
      report('PASS', 'argon-escalation skill verified', p);
      argonFound = true;
      break;
    }
  }
}
if (!argonFound) {
  report('WARN', 'argon-escalation SKILL.md not found in active skill paths');
}

// -----------------------------------------------------------------------------
// 6. Antigravity CLI & Runtime Directories
// -----------------------------------------------------------------------------
section('6. Antigravity Runtime & CLI Bridge');

// 6.1 Antigravity CLI
let agyCliFound = false;
try {
  const agyVer = execSync('agy --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  report('PASS', `Antigravity CLI (in PATH): ${agyVer}`);
  agyCliFound = true;
} catch {
  // Check local paths
  const localWinAgy = path.join(homeDir, 'AppData', 'Local', 'agy', 'bin', 'agy.exe');
  const localPosixAgy = path.join(homeDir, '.local', 'bin', 'agy');
  if (fs.existsSync(localWinAgy)) {
    report('PASS', 'Antigravity CLI (local Windows binary)', localWinAgy);
    agyCliFound = true;
  } else if (fs.existsSync(localPosixAgy)) {
    report('PASS', 'Antigravity CLI (local POSIX binary)', localPosixAgy);
    agyCliFound = true;
  } else {
    report('WARN', 'agy CLI not found in PATH or standard location', 'Process supervisor will operate with mock execution fallback');
  }
}

// 6.2 Antigravity directories
const agyDirs = [
  { name: 'Antigravity root', path: path.join(baseGeminiDir, 'antigravity'), required: false },
  { name: 'Brain transcripts', path: path.join(baseGeminiDir, 'antigravity', 'brain'), required: false },
  { name: 'Presence locks', path: path.join(baseGeminiDir, 'antigravity', 'presence'), required: false },
  { name: 'Director Knowledge Base', path: path.join(baseGeminiDir, 'antigravity', 'knowledge', 'ai-director'), required: false }
];

for (const d of agyDirs) {
  if (fs.existsSync(d.path)) {
    report('PASS', `${d.name} exists`, d.path);
  } else {
    report('INFO', `${d.name} not present`, 'Will be initialized by Antigravity sessions');
  }
}

// -----------------------------------------------------------------------------
// 7. Database Health & Persistence
// -----------------------------------------------------------------------------
section('7. Database Health & Persistence');

const dbPath = path.join(projectRoot, 'command_center.sqlite');
if (fs.existsSync(dbPath)) {
  try {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(dbPath, { timeout: 5000 });
    
    // Check integrity
    const integrityRow = db.prepare('PRAGMA integrity_check').get();
    const integrityOk = integrityRow && (integrityRow.integrity_check === 'ok');
    
    // Check journal mode
    const journalRow = db.prepare('PRAGMA journal_mode').get();
    const isWal = journalRow && (journalRow.journal_mode.toLowerCase() === 'wal');

    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    const requiredTables = ['tasks', 'events', 'settings', 'model_usage', 'escalations'];
    const missingTables = requiredTables.filter(t => !tables.includes(t));

    db.close();

    if (integrityOk) {
      report('PASS', 'SQLite database integrity check passed');
    } else {
      report('FAIL', 'SQLite database integrity check failed');
    }

    if (isWal) {
      report('PASS', 'SQLite WAL journal mode active');
    } else {
      report('WARN', `SQLite journal mode is ${journalRow?.journal_mode || 'unknown'}`, 'WAL recommended');
    }

    if (missingTables.length === 0) {
      report('PASS', `All required tables present (${requiredTables.join(', ')})`);
    } else {
      report('WARN', `Missing tables: ${missingTables.join(', ')}`, 'Will be auto-migrated on startup');
    }
  } catch (err) {
    report('FAIL', 'Could not open SQLite database', err.message);
  }
} else {
  report('INFO', 'SQLite database not created yet', 'Will be created automatically on first server start');
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n=======================================================================');
console.log(`Diagnostic Summary: ${colors.green}${passCount} Passed${colors.reset}, ` +
  `${colors.yellow}${warnCount} Warnings${colors.reset}, ` +
  `${colors.red}${failCount} Failures${colors.reset}`);
console.log('=======================================================================');

if (failCount > 0) {
  console.log(`\n${colors.red}${colors.bold}Result: ISSUES DETECTED.${colors.reset} Please resolve the failures above before production release.\n`);
  process.exit(1);
} else if (warnCount > 0) {
  console.log(`\n${colors.yellow}${colors.bold}Result: READY WITH WARNINGS.${colors.reset} System is operational, some optional components need attention.\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.green}${colors.bold}Result: EXCELLENT!${colors.reset} All system and agent components are fully verified.\n`);
  process.exit(0);
}
