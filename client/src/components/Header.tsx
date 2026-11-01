import React from 'react';
import { 
  Terminal, 
  Database, 
  Wifi, 
  WifiOff, 
  Plus, 
  Layers,
  Menu,
  X,
  Cpu,
  Sun,
  Moon
} from 'lucide-react';
import type { DirectorStatus, ConnectionStatus } from '../types.js';
import { useTheme, type Theme } from '../hooks/useTheme.js';

interface HeaderProps {
  status: DirectorStatus | null;
  onOpenNewTask: () => void;
  connectionStatus?: ConnectionStatus;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  status, 
  onOpenNewTask, 
  connectionStatus = 'DISCONNECTED',
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  theme: controlledTheme,
  onToggleTheme: controlledToggleTheme
}) => {
  // Автономная поддержка темы, если пропсы не переданы напрямую
  const localThemeHook = useTheme();
  const theme = controlledTheme ?? localThemeHook.theme;
  const toggleTheme = controlledToggleTheme ?? localThemeHook.toggleTheme;

  const isLive = status?.state === 'ACTIVE' || status?.state === 'ONLINE';
  const liveSessions = status?.activeSessions.filter(s => s.isLive).length || 0;
  const currentTokens = status?.activeSessions[0]?.tokenUsage;

  const stateLabel = status?.state === 'ACTIVE' 
    ? 'ACTIVE' 
    : status?.state === 'ONLINE' 
    ? 'ONLINE' 
    : status?.state === 'ESCALATED' 
    ? 'ESCALATED' 
    : 'CONNECTING...';

  return (
    <header className="sticky top-0 z-40 w-full bg-pure border-b border-hairline px-3.5 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3 sm:gap-4 max-w-[1920px] mx-auto">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Mobile Drawer Toggle (min 44x44 touch target) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-hairline text-charcoal hover:text-obsidian hover:bg-surface-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-obsidian"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-obsidian" />
            ) : (
              <Menu className="w-5 h-5 text-charcoal" />
            )}
          </button>

          {/* Logo & Product Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-obsidian text-pure font-mono font-bold text-xs shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-obsidian font-sans truncate">
                  AI COMMAND CENTER
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle text-slate border border-hairline shrink-0 hidden xs:inline-block">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-stone hidden sm:flex items-center gap-1.5 truncate">
                <span>Antigravity Orchestration</span>
                <span className="text-ash">•</span>
                <span className="font-mono text-charcoal">Director Protocol 3.8</span>
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-hairline hidden md:block" />

          {/* Director Status Tag */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border border-hairline bg-surface-subtle shrink-0">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLive ? 'bg-terminal-green' : 'bg-warning-text'}`} />
            <span className="text-xs font-mono font-medium text-obsidian">
              DIRECTOR: <span className={isLive ? 'text-terminal-green' : 'text-warning-text'}>{stateLabel}</span>
            </span>
            <span className="text-[11px] font-mono text-slate border-l border-hairline pl-2 hidden xl:inline">
              {status?.model || 'Gemini 3.8 Flash High'}
            </span>
          </div>
        </div>

        {/* Real-time Subsystem, Theme Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Sessions Counter */}
          <div className="hidden lg:flex items-center gap-3 text-xs bg-pure border border-hairline rounded-md px-2.5 py-1">
            <div className="flex items-center gap-1.5 text-charcoal">
              <Layers className="w-3.5 h-3.5 text-stone" />
              <span>Sessions:</span>
              <span className="font-mono font-medium text-obsidian">{liveSessions} active</span>
              <span className="text-slate font-mono text-[11px]">({status?.activeLocksCount || 0} locks)</span>
            </div>

            {currentTokens && (
              <div className="hidden xl:flex items-center gap-2 border-l border-hairline pl-2.5 font-mono text-[11px] text-stone">
                <span>In: <strong className="text-obsidian font-medium">{(currentTokens.input / 1000).toFixed(1)}k</strong></span>
                <span className="text-ash">•</span>
                <span>Out: <strong className="text-obsidian font-medium">{(currentTokens.output / 1000).toFixed(1)}k</strong></span>
              </div>
            )}
          </div>

          {/* Subsystem Indicators */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono">
            <div 
              className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
                status?.agyCliAvailable 
                  ? 'bg-terminal-bg border-terminal-border text-terminal-green' 
                  : 'bg-danger-bg border-danger-border text-danger-text'
              }`}
              title="Antigravity CLI (agy.exe)"
            >
              <Terminal className="w-3 h-3" />
              <span>CLI agy</span>
            </div>

            <div 
              className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
                status?.knowledgeBaseConnected 
                  ? 'bg-terminal-bg border-terminal-border text-terminal-green' 
                  : 'bg-warning-bg border-warning-border text-warning-text'
              }`}
              title="Global Antigravity Knowledge Base"
            >
              <Database className="w-3 h-3" />
              <span>Memory</span>
            </div>

            {/* WebSocket Stream Indicator */}
            {connectionStatus === 'CONNECTED' ? (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-terminal-bg border-terminal-border text-terminal-green"
                title="WebSocket real-time event stream: CONNECTED"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
                <Wifi className="w-3 h-3 text-terminal-green" />
                <span>WS Online</span>
              </div>
            ) : (connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING') ? (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-warning-bg border-warning-border text-warning-text"
                title="WebSocket stream reconnecting..."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-warning-text animate-pulse" />
                <Wifi className="w-3 h-3 text-warning-text" />
                <span>WS Reconnect</span>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-danger-bg border-danger-border text-danger-text"
                title={`WebSocket stream disconnected (${connectionStatus})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-danger-text" />
                <WifiOff className="w-3 h-3 text-danger-text" />
                <span>WS Offline</span>
              </div>
            )}
          </div>

          {/* Mobile WS Indicator */}
          <div className="md:hidden flex items-center pr-1">
            {connectionStatus === 'CONNECTED' ? (
              <span className="w-2 h-2 rounded-full bg-terminal-green" title="WS Online" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-danger-text animate-pulse" title="WS Offline" />
            )}
          </div>

          {/* Theme Toggle Button (Sun / Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
            title={theme === 'dark' ? "Светлая тема" : "Тёмная тема"}
            className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-md border border-hairline bg-surface-subtle text-charcoal hover:text-obsidian hover:bg-surface-hover transition-colors focus-ring shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-warning-text transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-stone transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Action Button: New Task */}
          <button
            type="button"
            onClick={onOpenNewTask}
            className="refero-btn-primary shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New Task</span>
            <span className="xs:hidden">Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
