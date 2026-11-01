import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Database, 
  Wifi, 
  WifiOff, 
  Plus, 
  Layers,
  Menu,
  X,
  Zap,
  Sun,
  Moon,
  ChevronDown,
  Check
} from 'lucide-react';
import type { DirectorStatus, ConnectionStatus } from '../types.js';
import { useTheme, type Theme } from '../hooks/useTheme.js';
import { useLanguage } from '../i18n/LanguageContext.js';

interface HeaderProps {
  status: DirectorStatus | null;
  onOpenNewTask: () => void;
  connectionStatus?: ConnectionStatus;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  theme?: Theme;
  onToggleTheme?: () => void;
  onSyncAntigravity?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  status, 
  onOpenNewTask, 
  connectionStatus = 'DISCONNECTED',
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  theme: controlledTheme,
  onToggleTheme: controlledToggleTheme,
  onSyncAntigravity,
  isSyncing = false
}) => {
  // Theme hook
  const localThemeHook = useTheme();
  const theme = controlledTheme ?? localThemeHook.theme;
  const toggleTheme = controlledToggleTheme ?? localThemeHook.toggleTheme;

  // Language hook
  const { language, currentLanguageMeta, languages, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLangOpen(false);
      }
    };

    if (isLangOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangOpen]);

  const isLive = status?.state === 'ACTIVE' || status?.state === 'ONLINE';
  const liveSessions = status?.activeSessions.filter(s => s.isLive).length || 0;
  const currentTokens = status?.activeSessions[0]?.tokenUsage;

  const stateLabel = status?.state === 'ACTIVE' 
    ? t('header.statusActive') 
    : status?.state === 'ONLINE' 
    ? t('header.statusOnline') 
    : status?.state === 'ESCALATED' 
    ? t('header.statusEscalated') 
    : t('header.statusConnecting');

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
              <span className="font-bold tracking-tighter text-[13px] text-terminal-green">▲</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-obsidian font-sans truncate">
                  ANTIGRAVITY APEX
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle text-slate border border-hairline shrink-0 hidden xs:inline-block">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-stone hidden sm:flex items-center gap-1.5 truncate">
                <span>{t('header.missionControl')}</span>
                <span className="text-ash">•</span>
                <span className="font-mono text-charcoal">{t('header.protocolVersion')}</span>
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-hairline hidden md:block" />

          {/* Director Status Tag */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border border-hairline bg-surface-subtle shrink-0">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLive ? 'bg-terminal-green' : 'bg-warning-text'}`} />
            <span className="text-xs font-mono font-medium text-obsidian">
              {t('header.director')}: <span className={isLive ? 'text-terminal-green' : 'text-warning-text'}>{stateLabel}</span>
            </span>
            <span className="text-[11px] font-mono text-slate border-l border-hairline pl-2 hidden xl:inline">
              {status?.model || 'Gemini 3.8 Flash High'}
            </span>
          </div>
        </div>

        {/* Real-time Subsystem, Language Selector, Theme Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Sessions Counter */}
          <div className="hidden lg:flex items-center gap-3 text-xs bg-pure border border-hairline rounded-md px-2.5 py-1">
            <div className="flex items-center gap-1.5 text-charcoal">
              <Layers className="w-3.5 h-3.5 text-stone" />
              <span>{t('header.sessions')}:</span>
              <span className="font-mono font-medium text-obsidian">{liveSessions} {t('header.active')}</span>
              <span className="text-slate font-mono text-[11px]">({status?.activeLocksCount || 0} {t('header.locks')})</span>
            </div>

            {currentTokens && (
              <div className="hidden xl:flex items-center gap-2 border-l border-hairline pl-2.5 font-mono text-[11px] text-stone">
                <span>{t('header.inTokens')}: <strong className="text-obsidian font-medium">{(currentTokens.input / 1000).toFixed(1)}k</strong></span>
                <span className="text-ash">•</span>
                <span>{t('header.outTokens')}: <strong className="text-obsidian font-medium">{(currentTokens.output / 1000).toFixed(1)}k</strong></span>
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
              <span>{t('header.cliAgy')}</span>
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
              <span>{t('header.memory')}</span>
            </div>

            {/* WebSocket Stream Indicator */}
            {connectionStatus === 'CONNECTED' ? (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-terminal-bg border-terminal-border text-terminal-green"
                title="WebSocket real-time event stream: CONNECTED"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
                <Wifi className="w-3 h-3 text-terminal-green" />
                <span>{t('header.wsOnline')}</span>
              </div>
            ) : (connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING') ? (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-warning-bg border-warning-border text-warning-text"
                title="WebSocket stream reconnecting..."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-warning-text animate-pulse" />
                <Wifi className="w-3 h-3 text-warning-text" />
                <span>{t('header.wsReconnect')}</span>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-danger-bg border-danger-border text-danger-text"
                title={`WebSocket stream disconnected (${connectionStatus})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-danger-text" />
                <WifiOff className="w-3 h-3 text-danger-text" />
                <span>{t('header.wsOffline')}</span>
              </div>
            )}
          </div>

          {/* Mobile WS Indicator */}
          <div className="md:hidden flex items-center pr-1">
            {connectionStatus === 'CONNECTED' ? (
              <span className="w-2 h-2 rounded-full bg-terminal-green" title={t('header.wsOnline')} />
            ) : (
              <span className="w-2 h-2 rounded-full bg-danger-text animate-pulse" title={t('header.wsOffline')} />
            )}
          </div>

          {/* 1-Click Setup & Sync Button */}
          {onSyncAntigravity && (
            <button
              type="button"
              onClick={onSyncAntigravity}
              disabled={isSyncing}
              title="1-Click Setup: Deploy 17 specialized agents & rules to ~/.gemini"
              className="min-h-[34px] px-2.5 py-1 rounded-md border border-hairline bg-surface-subtle text-charcoal hover:text-obsidian hover:bg-surface-hover transition-colors focus-ring shrink-0 flex items-center gap-1.5 text-xs font-mono"
            >
              <Zap className={`w-3.5 h-3.5 text-warning-text ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? t('header.syncing') : t('header.oneClickSetup')}</span>
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-haspopup="listbox"
              aria-expanded={isLangOpen}
              aria-label={t('header.selectLanguage')}
              title={t('header.selectLanguage')}
              className="min-h-[34px] px-2 sm:px-2.5 py-1 flex items-center gap-1.5 rounded-md border border-hairline bg-surface-subtle text-charcoal hover:text-obsidian hover:bg-surface-hover transition-colors focus-ring shrink-0 text-xs font-mono font-medium"
            >
              <span className="text-sm leading-none" role="img" aria-label={currentLanguageMeta.name}>
                {currentLanguageMeta.flag}
              </span>
              <span className="uppercase text-[11px] font-semibold text-obsidian tracking-wider">
                {currentLanguageMeta.code}
              </span>
              <ChevronDown className={`w-3 h-3 text-stone transition-transform duration-150 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div
                role="listbox"
                aria-label={t('header.selectLanguage')}
                className="absolute right-0 mt-1.5 w-52 py-1.5 bg-pure border border-hairline rounded-md shadow-dropdown z-50 animate-fade-in"
              >
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone border-b border-hairline">
                  {t('header.selectLanguage')}
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {languages.map((l) => {
                    const isSelected = l.code === language;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setLanguage(l.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? 'bg-surface-subtle text-obsidian font-semibold'
                            : 'text-charcoal hover:text-obsidian hover:bg-surface-hover'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-base leading-none">{l.flag}</span>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate leading-tight">{l.nativeName}</span>
                            <span className="text-[10px] text-stone leading-tight">{l.englishName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-surface-subtle border border-hairline text-stone uppercase">
                            {l.code}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-terminal-green" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button (Sun / Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('header.lightTheme') : t('header.darkTheme')}
            title={theme === 'dark' ? t('header.lightTheme') : t('header.darkTheme')}
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
            <span className="hidden xs:inline">{t('header.newTask')}</span>
            <span className="xs:hidden">{t('header.taskShort')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
