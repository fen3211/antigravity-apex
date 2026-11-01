import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GitBranch, 
  BarChart3, 
  CheckSquare, 
  Brain, 
  Sliders, 
  Radio, 
  Flame, 
  X 
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.js';

export type NavTab = 
  | 'overview' 
  | 'agents' 
  | 'workflow' 
  | 'analytics' 
  | 'tasks' 
  | 'escalations' 
  | 'memory' 
  | 'control' 
  | 'events';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingTasksCount: number;
  liveEventsCount: number;
  activeEscalationsCount?: number;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingTasksCount,
  liveEventsCount,
  activeEscalationsCount = 0,
  isMobileOpen = false,
  onClose
}) => {
  const { t } = useLanguage();

  const navItems: { 
    id: NavTab; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    badge?: number | string; 
    badgeColor?: string 
  }[] = [
    { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'agents', label: t('nav.agents'), icon: Users, badge: '17' },
    { id: 'workflow', label: t('nav.workflow'), icon: GitBranch },
    { id: 'tasks', label: t('nav.tasks'), icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined, badgeColor: 'bg-obsidian text-pure' },
    { id: 'escalations', label: t('nav.escalations'), icon: Flame, badge: activeEscalationsCount > 0 ? `${activeEscalationsCount}` : undefined, badgeColor: 'bg-danger text-pure animate-pulse' },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'memory', label: t('nav.memory'), icon: Brain, badge: '8 docs' },
    { id: 'events', label: t('nav.events'), icon: Radio, badge: liveEventsCount > 0 ? `${liveEventsCount}` : undefined, badgeColor: 'bg-terminal-bg text-terminal-green border border-terminal-border' },
    { id: 'control', label: t('nav.control'), icon: Sliders }
  ];

  // Close on Escape when mobile menu is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onClose]);

  const handleTabClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isMobileOpen && (
        <div 
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm dark:bg-black/70 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar Rail */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:static lg:z-auto lg:w-56 shrink-0 flex flex-col justify-between border-r border-hairline bg-pure p-3 select-none min-h-[calc(100vh-53px)] transform transition-transform duration-200 ease-snappy ${
          isMobileOpen ? 'translate-x-0 shadow-dropdown' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Application Navigation"
      >
        <div className="space-y-4 overflow-y-auto">
          {/* Mobile Drawer Header */}
          <div className="lg:hidden flex items-center justify-between pb-2 border-b border-hairline">
            <span className="text-xs font-semibold text-obsidian tracking-tight uppercase">
              AI Command Center
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-charcoal hover:text-obsidian hover:bg-surface-subtle transition-colors focus-ring"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone px-2.5 mb-1.5">
              {t('nav.workspace')}
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors focus-ring ${
                      isActive
                        ? 'bg-surface-subtle text-obsidian font-semibold'
                        : 'text-charcoal hover:text-obsidian hover:bg-surface-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-obsidian' : 'text-graphite'
                      }`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                        item.badgeColor || 'bg-surface-subtle text-stone border border-hairline'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Clean Argon L4 Protocol Pill Card */}
          <div className="p-2.5 rounded-md border border-hairline bg-surface-subtle">
            <div className="flex items-center justify-between text-xs font-medium text-obsidian">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-argon-text" />
                <span>{t('nav.argonProtocol')}</span>
              </div>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-argon-bg text-argon-text border border-argon-border">
                {t('nav.argonProtocolBadge')}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone leading-relaxed">
              {t('nav.argonProtocolDesc')}
            </p>
          </div>
        </div>

        {/* Minimal Footer System Info */}
        <div className="pt-3 border-t border-hairline text-[11px] text-stone space-y-1 font-mono">
          <div className="flex justify-between items-center">
            <span>{t('nav.engine')}</span>
            <span className="text-obsidian font-medium">Antigravity 2.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t('nav.concurrency')}</span>
            <span className="text-obsidian font-medium">{t('nav.concurrencySubagents')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t('nav.boundary')}</span>
            <span className="text-terminal-green font-medium">{t('nav.boundaryLocal')}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
