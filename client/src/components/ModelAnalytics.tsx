import React from 'react';
import { 
  BarChart3, 
  Cpu, 
  Flame, 
  Info,
  Database,
  Layers,
  CheckCircle2
} from 'lucide-react';
import type { ModelMetrics, DataProvenance } from '../types.js';

interface ModelAnalyticsProps {
  analytics: {
    tiers: ModelMetrics[];
    totalTokens: { input: number; output: number; cacheRead: number; provenance?: DataProvenance };
    totalRuns: number;
    overallSuccessRate: number;
    escalationRate: number;
    verifiedRealSessionsCount: number;
    provenance?: DataProvenance;
  } | null;
}

export const ModelAnalytics: React.FC<ModelAnalyticsProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="bg-pure border border-hairline rounded-md p-12 text-center text-slate space-y-2">
        <BarChart3 className="w-8 h-8 mx-auto text-ash animate-pulse" />
        <p className="text-[13px] font-mono">Загрузка телеметрии моделей Antigravity...</p>
      </div>
    );
  }

  const renderProvenanceBadge = (provenance?: string, isEstimate?: boolean) => {
    const norm = (provenance || (isEstimate ? 'ESTIMATED' : 'LIVE')).toUpperCase();
    if (norm === 'LIVE') {
      return (
        <span className="badge-live text-[10px] py-0.5 px-2 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
          LIVE
        </span>
      );
    }
    if (norm === 'DEMO') {
      return (
        <span className="badge-demo text-[10px] py-0.5 px-2 font-mono">
          DEMO
        </span>
      );
    }
    return (
      <span className="badge-estimate text-[10px] py-0.5 px-2 font-mono">
        ESTIMATE
      </span>
    );
  };

  const overallProvenance = analytics.totalTokens.provenance || analytics.provenance || 'DEMO';

  return (
    <div className="space-y-6">
      {/* 1. Header & Data Policy Surface */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-obsidian" />
              <h1 className="text-lg font-semibold text-obsidian tracking-tight">
                Аналитика маршрутизации моделей и телеметрия
              </h1>
            </div>
            <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
              Мониторинг расхода токенов и частоты эскалаций между Gemini 3.8 Flash, Pro-уровнем и Gemini 4 Argon.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono self-start md:self-auto shrink-0">
            <span className="badge-live">
              <Database className="w-3.5 h-3.5 text-terminal-green" />
              <span>{analytics.verifiedRealSessionsCount} реальных сессий подтверждено</span>
            </span>
          </div>
        </div>

        {/* Data Provenance Policy Callout */}
        <div className="p-3.5 rounded-md bg-surface-subtle border border-hairline text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-obsidian shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-obsidian">Политика прозрачности и маркировки данных:</span>
            <p className="text-charcoal leading-relaxed">
              Токены и временные метки извлекаются напрямую из файлов журналов <code className="font-mono text-obsidian bg-pure px-1 py-0.5 rounded border border-hairline">transcript.jsonl</code> каталога сессий Antigravity.
              Все показатели строго разделены по источникам: <span className="badge-live text-[10px] py-0 px-1.5 font-mono">LIVE</span> (подтверждённые сессии), <span className="badge-estimate text-[10px] py-0 px-1.5 font-mono">ESTIMATE</span> (расчётная интерполяция) и <span className="badge-demo text-[10px] py-0 px-1.5 font-mono">DEMO</span> (стендовые данные).
            </p>
          </div>
        </div>
      </section>

      {/* 2. Aggregate KPI Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-pure border border-hairline rounded-md p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-stone">
            <span>Всего запусков</span>
            <Layers className="w-3.5 h-3.5 text-graphite" />
          </div>
          <div className="text-2xl font-bold font-mono text-obsidian tracking-tight">
            {analytics.totalRuns}
          </div>
          <span className="text-[11px] text-slate block font-mono">
            По {analytics.tiers.length} модельным уровням
          </span>
        </div>

        <div className="bg-pure border border-hairline rounded-md p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-stone">
            <span>Входные токены</span>
            {renderProvenanceBadge(overallProvenance)}
          </div>
          <div className="text-2xl font-bold font-mono text-obsidian tracking-tight">
            {analytics.totalTokens.input.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate block font-mono">
            Prompt Context Volume
          </span>
        </div>

        <div className="bg-pure border border-hairline rounded-md p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-stone">
            <span>Выходные токены</span>
            {renderProvenanceBadge(overallProvenance)}
          </div>
          <div className="text-2xl font-bold font-mono text-obsidian tracking-tight">
            {analytics.totalTokens.output.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate block font-mono">
            Generated Output Stream
          </span>
        </div>

        <div className="bg-pure border border-hairline rounded-md p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs text-stone">
            <span>Кэшированные токены</span>
            <span className="badge-live text-[10px] py-0 px-1.5">TRANSCRIPT</span>
          </div>
          <div className="text-2xl font-bold font-mono text-terminal-green tracking-tight">
            {analytics.totalTokens.cacheRead.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate block font-mono">
            Экономия на чтении кэша
          </span>
        </div>
      </section>

      {/* 3. Success Rates & Escalation Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-pure border border-hairline rounded-md p-4 shadow-subtle flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-stone font-medium">Общий процент успешности шлюзов качества</span>
            <div className="text-2xl font-bold font-mono text-terminal-green">
              {analytics.overallSuccessRate}%
            </div>
            <p className="text-[11px] text-slate font-mono">
              Проверка по 9-пунктному стандарту перед утверждением
            </p>
          </div>
          <div className="w-10 h-10 rounded-md bg-terminal-bg border border-terminal-border flex items-center justify-center text-terminal-green shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-pure border border-hairline rounded-md p-4 shadow-subtle flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-stone font-medium">Доля эскалаций к Senior Architect и Argon</span>
            <div className="text-2xl font-bold font-mono text-argon-text">
              {analytics.escalationRate}%
            </div>
            <p className="text-[11px] text-slate font-mono">
              L3 (Gemini Pro) и L4 (Gemini 4 Argon)
            </p>
          </div>
          <div className="w-10 h-10 rounded-md bg-argon-bg border border-argon-border flex items-center justify-center text-argon-text shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* 4. Model Tiers Data Table */}
      <section className="bg-pure border border-hairline rounded-md shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-obsidian tracking-tight">
              Телеметрия по модельным уровням
            </h2>
            <p className="text-xs text-stone mt-0.5">
              Подробная разбивка запусков, выполненных задач и расхода токенов с явным указанием достоверности.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-paper border-b border-hairline text-stone text-[11px] uppercase tracking-wider font-medium font-sans">
                <th className="py-2.5 px-4">Модельный уровень</th>
                <th className="py-2.5 px-4">Идентификатор</th>
                <th className="py-2.5 px-4 text-right">Запусков</th>
                <th className="py-2.5 px-4 text-right">Завершено задач</th>
                <th className="py-2.5 px-4 text-right">Эскалаций</th>
                <th className="py-2.5 px-4 text-right">Токены (Вход / Выход)</th>
                <th className="py-2.5 px-4 text-center">Источник данных</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {analytics.tiers.map(tier => (
                <tr key={tier.tier} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-obsidian flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-graphite" />
                      <span>{tier.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-stone">
                    {tier.tier}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-obsidian font-semibold">
                    {tier.runsCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-charcoal">
                    {tier.tasksCompleted}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-charcoal">
                    {tier.escalationCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-charcoal">
                    <span className="text-obsidian font-semibold">{tier.inputTokens.toLocaleString()}</span>
                    <span className="text-slate"> / </span>
                    <span>{tier.outputTokens.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderProvenanceBadge(tier.provenance, tier.isEstimate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
