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
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';

export type NavTab = 
  | 'overview' 
  | 'agents' 
  | 'workflow' 
  | 'analytics' 
  | 'tasks' 
  | 'memory' 
  | 'control' 
  | 'events';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingTasksCount: number;
  liveEventsCount: number;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingTasksCount,
  liveEventsCount,
  isMobileOpen = false,
  onClose
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
    { id: 'agents', label: 'Агенты', icon: Users, badge: '9' },
    { id: 'workflow', label: 'Карта процессов', icon: GitBranch },
    { id: 'analytics', label: 'Аналитика моделей', icon: BarChart3 },
    { id: 'tasks', label: 'Очередь задач', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined, badgeColor: 'bg-director-blue text-white' },
    { id: 'memory', label: 'Память Директора', icon: Brain, badge: '8 файлов' },
    { id: 'control', label: 'Центр управления', icon: Sliders },
    { id: 'events', label: 'Поток событий', icon: Radio, badge: liveEventsCount > 0 ? `${liveEventsCount}` : undefined, badgeColor: 'bg-emerald-500/20 text-emerald-300' }
  ];

  // Закрытие по Escape при открытом мобильном меню
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
      {/* Полупрозрачный размытый оверлей (backdrop) для мобильных устройств */}
      {isMobileOpen && (
        <div 
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Панель Sidebar: Drawer на мобильных (<1024px) и фиксированная колонка на десктопе (>=1024px) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:static lg:z-auto lg:w-64 shrink-0 flex flex-col justify-between border-r border-white/[0.08] bg-surface-panel/95 lg:bg-surface-panel/90 backdrop-blur-deep p-4 select-none min-h-[calc(100vh-61px)] transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Основная навигация"
      >
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* Шапка внутри мобильного Drawer (<lg) */}
          <div className="lg:hidden flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-director-blue/20 border border-white/10">
                <Sparkles className="w-4 h-4 text-director-cyan" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                AI COMMAND CENTER
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть меню"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-3">
              Навигация
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-white/[0.08] text-white border border-white/10 shadow-glass-subtle'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-director-cyan' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          item.badgeColor || 'bg-white/[0.06] text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Карточка статуса эскалации к Argon в боковой панели */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent border border-pink-500/20 shadow-glow-argon">
            <div className="flex items-center gap-2 text-pink-400 text-xs font-semibold">
              <Flame className="w-4 h-4 text-director-argon animate-pulse" />
              <span>Протокол эскалации</span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
              Ручной переход 4-го уровня к <strong className="text-pink-300 font-medium">Gemini 4 Argon</strong> готов. Требуется строгая верификация.
            </p>
            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Политика: СТРОГАЯ</span>
              <span className="text-pink-400 font-bold">Уровень 4</span>
            </div>
          </div>
        </div>

        {/* Системная информация в подвале */}
        <div className="pt-4 border-t border-white/[0.08] text-[11px] text-slate-500 space-y-1">
          <div className="flex justify-between items-center font-mono">
            <span>Движок</span>
            <span className="text-slate-300">Antigravity 2.0</span>
          </div>
          <div className="flex justify-between items-center font-mono">
            <span>Окружение</span>
            <span className="text-slate-300">Локально (Windows)</span>
          </div>
          <div className="flex justify-between items-center font-mono">
            <span>Безопасность</span>
            <span className="text-emerald-400 font-medium">Только Localhost</span>
          </div>
        </div>
      </aside>
    </>
  );
};
