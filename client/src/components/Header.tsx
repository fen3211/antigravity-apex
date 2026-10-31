import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Database, 
  Wifi, 
  Plus, 
  Sparkles,
  Layers
} from 'lucide-react';
import type { DirectorStatus } from '../types.js';

interface HeaderProps {
  status: DirectorStatus | null;
  onOpenNewTask: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenNewTask }) => {
  const isLive = status?.state === 'ACTIVE' || status?.state === 'ONLINE';
  const liveSessions = status?.activeSessions.filter(s => s.isLive).length || 0;
  const currentTokens = status?.activeSessions[0]?.tokenUsage;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-deep bg-background/80 border-b border-white/[0.08] px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Director status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-director-blue/30 via-director-violet/20 to-transparent border border-white/10 shadow-glass-subtle">
              <Sparkles className="w-5 h-5 text-director-cyan animate-pulse-slow" />
              <div className="absolute -inset-0.5 rounded-xl bg-director-blue/20 blur-sm -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white font-sans">
                  AI COMMAND CENTER
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-400 border border-white/5">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Antigravity Orchestration Hub</span>
                <span className="text-slate-600">•</span>
                <span className="text-director-cyan font-mono text-[11px]">Director Protocol 3.8</span>
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden md:block" />

          {/* Director Active State Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
            <span className="relative flex h-2 w-2">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              DIRECTOR: <span className={isLive ? 'text-emerald-400' : 'text-amber-400'}>{status?.state || 'CONNECTING...'}</span>
            </span>
            <span className="text-xs font-mono text-slate-400 border-l border-white/10 pl-2">
              {status?.model || 'Gemini 3.8 Flash High'}
            </span>
          </div>
        </div>

        {/* Real-time metrics and integration indicators */}
        <div className="flex items-center gap-3">
          {/* Live Antigravity Sessions indicator */}
          <div className="hidden lg:flex items-center gap-3 text-xs bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-1.5">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-director-blue" />
              <span>Sessions:</span>
              <span className="font-mono font-medium text-white">{liveSessions} Live</span>
              <span className="text-slate-500 font-mono">({status?.activeLocksCount || 0} logged)</span>
            </div>

            {currentTokens && (
              <div className="hidden xl:flex items-center gap-2 border-l border-white/10 pl-3 font-mono text-[11px] text-slate-400">
                <span title="Tokens read from real Antigravity transcript">
                  In: <strong className="text-slate-200 font-normal">{(currentTokens.input / 1000).toFixed(1)}k</strong>
                </span>
                <span>•</span>
                <span>
                  Out: <strong className="text-slate-200 font-normal">{(currentTokens.output / 1000).toFixed(1)}k</strong>
                </span>
              </div>
            )}
          </div>

          {/* Subsystem status pills */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono">
            <div 
              className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                status?.agyCliAvailable 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
              title="Antigravity CLI (agy.exe)"
            >
              <Terminal className="w-3 h-3" />
              <span>agy CLI</span>
            </div>

            <div 
              className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                status?.knowledgeBaseConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
              title="Global Knowledge Base ~/.gemini/antigravity/knowledge"
            >
              <Database className="w-3 h-3" />
              <span>Memory</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-director-blue/10 border border-director-blue/20 text-director-cyan">
              <Wifi className="w-3 h-3 animate-pulse" />
              <span>WS Live</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-director-blue to-blue-600 hover:from-blue-500 hover:to-director-blue text-white text-xs font-semibold shadow-glass-subtle transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
