import React from 'react';
import { 
  BarChart3, 
  Cpu, 
  Flame, 
  Info,
  Database
} from 'lucide-react';
import type { ModelMetrics } from '../types.js';

interface ModelAnalyticsProps {
  analytics: {
    tiers: ModelMetrics[];
    totalTokens: { input: number; output: number; cacheRead: number };
    totalRuns: number;
    overallSuccessRate: number;
    escalationRate: number;
    verifiedRealSessionsCount: number;
  } | null;
}

export const ModelAnalytics: React.FC<ModelAnalyticsProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400">
        Загрузка аналитики моделей Antigravity...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и уведомление о достоверности данных */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-director-blue" />
              <span>Аналитика маршрутизации моделей и телеметрия</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Детализация расхода ресурсов между Gemini 3.8 Flash, Pro-уровнем и Gemini 4 Argon.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="badge-live">
              <Database className="w-3.5 h-3.5" />
              <span>{analytics.verifiedRealSessionsCount} реальных сессий подтверждено</span>
            </span>
          </div>
        </div>

        {/* Заметка о прозрачности источников данных */}
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-director-cyan shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white">Политика достоверности данных:</span>
            <p className="text-slate-400 leading-relaxed">
              Токены и временные метки извлекаются напрямую из активных и архивных логов <code className="text-director-cyan">transcript.jsonl</code> каталога Antigravity. 
              Antigravity не транслирует облачный долларовый баланс через локальный CLI, поэтому глобальные квоты аккаунта помечены бейджем <span className="text-amber-400 font-mono">ОЦЕНКА</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Сводные агрегированные показатели */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <span className="text-xs text-slate-400">Всего запусков</span>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {analytics.totalRuns}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">
            По {analytics.tiers.length} модельным уровням
          </span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs text-slate-400">Подтверждённые входные токены</span>
          <div className="mt-2 text-2xl font-bold font-mono text-director-cyan">
            {(analytics.totalTokens.input / 1000).toFixed(1)}k
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
            LIVE из transcript.jsonl
          </span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs text-slate-400">Подтверждённые выходные токены</span>
          <div className="mt-2 text-2xl font-bold font-mono text-director-blue">
            {(analytics.totalTokens.output / 1000).toFixed(1)}k
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
            LIVE из transcript.jsonl
          </span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs text-slate-400">Частота эскалаций</span>
          <div className="mt-2 text-2xl font-bold font-mono text-pink-400">
            {analytics.escalationRate}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Senior Arch (L3) / Argon (L4)
          </span>
        </div>
      </div>

      {/* Карточки по модельным уровням */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {analytics.tiers.map((tier) => {
          const isArgon = tier.tier.includes('argon');
          const isDirector = tier.tier.includes('flash-high');
          const isPro = tier.tier === 'pro';

          return (
            <div
              key={tier.tier}
              className={`glass-panel p-5 space-y-4 border ${
                isArgon
                  ? 'border-pink-500/25 bg-gradient-to-br from-pink-500/5 to-transparent'
                  : isDirector
                  ? 'border-director-blue/25 bg-gradient-to-br from-director-blue/5 to-transparent'
                  : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${
                    isArgon 
                      ? 'bg-pink-500/20 text-director-argon' 
                      : isDirector 
                      ? 'bg-director-blue/20 text-director-cyan'
                      : isPro 
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-white/5 text-slate-300'
                  }`}>
                    {isArgon ? <Flame className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {tier.displayName}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {tier.tier}
                    </span>
                  </div>
                </div>

                {tier.isEstimate ? (
                  <span className="badge-demo text-[10px] py-0 px-2 font-mono">ОЦЕНКА</span>
                ) : (
                  <span className="badge-live text-[10px] py-0 px-2 font-mono">ПОДТВЕРЖДЕНО LIVE</span>
                )}
              </div>

              {/* Панель цифр */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Запусков</span>
                  <span className="text-base font-bold text-white">{tier.runsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Завершено</span>
                  <span className="text-base font-bold text-emerald-400">{tier.tasksCompleted}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Эскалаций</span>
                  <span className="text-base font-bold text-pink-400">{tier.escalationCount}</span>
                </div>
              </div>

              {/* Индикатор прогресса */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Успешность</span>
                  <span className="text-emerald-400 font-semibold">{tier.successRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      tier.successRate > 90 
                        ? 'bg-emerald-500' 
                        : tier.successRate > 75 
                        ? 'bg-amber-500' 
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${tier.successRate}%` }}
                  />
                </div>
              </div>

              {/* Подсчёт токенов */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                <span>Учтено токенов:</span>
                <span className="text-slate-200">
                  {(tier.inputTokens + tier.outputTokens).toLocaleString()} токенов
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
