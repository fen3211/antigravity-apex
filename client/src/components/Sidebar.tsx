import React from 'react';
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
  ChevronRight
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingTasksCount,
  liveEventsCount
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'agents', label: 'Agents', icon: Users, badge: '9' },
    { id: 'workflow', label: 'Live Workflow', icon: GitBranch },
    { id: 'analytics', label: 'Model Analytics', icon: BarChart3 },
    { id: 'tasks', label: 'Task Queue', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined, badgeColor: 'bg-director-blue text-white' },
    { id: 'memory', label: 'Director Memory', icon: Brain, badge: '8 files' },
    { id: 'control', label: 'Control Center', icon: Sliders },
    { id: 'events', label: 'Event Stream', icon: Radio, badge: liveEventsCount > 0 ? `${liveEventsCount}` : undefined, badgeColor: 'bg-emerald-500/20 text-emerald-300' }
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-white/[0.08] bg-surface-panel/90 backdrop-blur-deep p-4 select-none min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-3">
            Navigation
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
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

        {/* Argon Escalation Status Card in sidebar */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent border border-pink-500/20 shadow-glow-argon">
          <div className="flex items-center gap-2 text-pink-400 text-xs font-semibold">
            <Flame className="w-4 h-4 text-director-argon animate-pulse" />
            <span>Escalation Protocol</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
            Level 4 manual switch to <strong className="text-pink-300 font-medium">Gemini 4 Argon</strong> ready. Strict verification required.
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Policy: STRICT</span>
            <span className="text-pink-400">Level 4</span>
          </div>
        </div>
      </div>

      {/* System info footer */}
      <div className="pt-4 border-t border-white/[0.08] text-[11px] text-slate-500 space-y-1">
        <div className="flex justify-between items-center font-mono">
          <span>Engine</span>
          <span className="text-slate-300">Antigravity 2.0</span>
        </div>
        <div className="flex justify-between items-center font-mono">
          <span>Environment</span>
          <span className="text-slate-300">Windows Local</span>
        </div>
        <div className="flex justify-between items-center font-mono">
          <span>Security</span>
          <span className="text-emerald-400">Strict Localhost</span>
        </div>
      </div>
    </aside>
  );
};
