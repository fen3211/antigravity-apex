import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { Overview } from './components/Overview.js';
import { AgentManagement } from './components/AgentManagement.js';
import { LiveWorkflow } from './components/LiveWorkflow.js';
import { ModelAnalytics } from './components/ModelAnalytics.js';
import { TaskManager } from './components/TaskManager.js';
import { MemoryExplorer } from './components/MemoryExplorer.js';
import { ControlCenter } from './components/ControlCenter.js';
import { EventLog } from './components/EventLog.js';
import { EscalationCenter } from './components/EscalationCenter.js';
import { EscalationDetailModal } from './components/Modals/EscalationDetailModal.js';
import { ToastProvider, toast } from './components/Toast.js';

import { PromptModal } from './components/Modals/PromptModal.js';
import { ReportModal } from './components/Modals/ReportModal.js';
import { NewTaskModal } from './components/Modals/NewTaskModal.js';

import { api, eventStream } from './services/api.js';
import { useTheme } from './hooks/useTheme.js';
import type { 
  DirectorStatus, 
  AgentInfo, 
  TaskItem, 
  EventPayload, 
  ModelMetrics, 
  KnowledgeDoc, 
  ControlSettings,
  EventType,
  SubagentReport,
  ConnectionStatus,
  DataProvenance,
  EscalationItem,
  EscalationStats,
  SensitivitySetting
} from './types.js';

export function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Данные приложения
  const [status, setStatus] = useState<DirectorStatus | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [analytics, setAnalytics] = useState<{
    tiers: ModelMetrics[];
    totalTokens: { input: number; output: number; cacheRead: number; provenance?: DataProvenance };
    totalRuns: number;
    overallSuccessRate: number;
    escalationRate: number;
    verifiedRealSessionsCount: number;
    provenance?: DataProvenance;
  } | null>(null);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [settings, setSettings] = useState<ControlSettings | null>(null);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [escalationStats, setEscalationStats] = useState<EscalationStats | null>(null);
  const [escalationSensitivity, setEscalationSensitivity] = useState<SensitivitySetting>('balanced');
  const [selectedEscalationModal, setSelectedEscalationModal] = useState<EscalationItem | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() => eventStream.getStatus());
  const prevStatusRef = React.useRef<ConnectionStatus>(eventStream.getStatus());
  const tasksDebounceTimer = React.useRef<any>(null);
  const agentsDebounceTimer = React.useRef<any>(null);

  // Модальные окна
  const [promptModalAgent, setPromptModalAgent] = useState<AgentInfo | null>(null);
  const [reportModalTask, setReportModalTask] = useState<{ report: SubagentReport; title: string; agentId: string } | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Первоначальная загрузка данных
  const loadAllData = React.useCallback(async () => {
    try {
      const [
        fetchedStatus,
        fetchedAgents,
        fetchedTasks,
        fetchedEvents,
        fetchedAnalytics,
        fetchedDocs,
        fetchedSettings,
        fetchedEscalations,
        fetchedEscStats,
        fetchedEscSettings
      ] = await Promise.all([
        api.getStatus().catch(() => null),
        api.getAgents().catch(() => []),
        api.getTasks().catch(() => []),
        api.getEvents({ limit: 50 }).catch(() => []),
        api.getAnalytics().catch(() => null),
        api.getKnowledgeDocs().catch(() => []),
        api.getSettings().catch(() => null),
        api.getEscalations().catch(() => []),
        api.getEscalationStats().catch(() => null),
        api.getEscalationSettings().catch(() => null)
      ]);

      if (fetchedStatus) setStatus(fetchedStatus);
      if (fetchedAgents) setAgents(fetchedAgents);
      if (fetchedTasks) setTasks(fetchedTasks);
      if (fetchedEvents) setEvents(fetchedEvents);
      if (fetchedAnalytics) setAnalytics(fetchedAnalytics);
      if (fetchedDocs) setKnowledgeDocs(fetchedDocs);
      if (fetchedSettings) setSettings(fetchedSettings);
      if (fetchedEscalations) setEscalations(fetchedEscalations);
      if (fetchedEscStats) setEscalationStats(fetchedEscStats);
      if (fetchedEscSettings?.sensitivity) setEscalationSensitivity(fetchedEscSettings.sensitivity);
    } catch (err) {
      console.error('Ошибка инициализации данных Command Center:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [
          fetchedStatus,
          fetchedAgents,
          fetchedTasks,
          fetchedEvents,
          fetchedAnalytics,
          fetchedDocs,
          fetchedSettings,
          fetchedEscalations,
          fetchedEscStats,
          fetchedEscSettings
        ] = await Promise.all([
          api.getStatus().catch(() => null),
          api.getAgents().catch(() => []),
          api.getTasks().catch(() => []),
          api.getEvents({ limit: 50 }).catch(() => []),
          api.getAnalytics().catch(() => null),
          api.getKnowledgeDocs().catch(() => []),
          api.getSettings().catch(() => null),
          api.getEscalations().catch(() => []),
          api.getEscalationStats().catch(() => null),
          api.getEscalationSettings().catch(() => null)
        ]);

        if (!isMounted) return;
        if (fetchedStatus) setStatus(fetchedStatus);
        if (fetchedAgents) setAgents(fetchedAgents);
        if (fetchedTasks) setTasks(fetchedTasks);
        if (fetchedEvents) setEvents(fetchedEvents);
        if (fetchedAnalytics) setAnalytics(fetchedAnalytics);
        if (fetchedDocs) setKnowledgeDocs(fetchedDocs);
        if (fetchedSettings) setSettings(fetchedSettings);
        if (fetchedEscalations) setEscalations(fetchedEscalations);
        if (fetchedEscStats) setEscalationStats(fetchedEscStats);
        if (fetchedEscSettings?.sensitivity) setEscalationSensitivity(fetchedEscSettings.sensitivity);
      } catch (err) {
        console.error('Ошибка инициализации данных Command Center:', err);
      }
    })();

    // Слушатель статуса WebSocket (реконсиляция при восстановлении связи)
    const unsubscribeStatus = eventStream.onStatusChange((newStatus) => {
      const prevStatus = prevStatusRef.current;
      setConnectionStatus(newStatus);
      prevStatusRef.current = newStatus;

      // Реконсиляция: при переходе из 'RECONNECTING' или 'DISCONNECTED' в 'CONNECTED'
      if (newStatus === 'CONNECTED' && (prevStatus === 'RECONNECTING' || prevStatus === 'DISCONNECTED')) {
        console.log('[App] WS reconnected, reconciling state via loadAllData()...');
        loadAllData();
      }
    });

    // Подписка на живые WebSocket события
    const unsubscribeEvents = eventStream.subscribe((event: EventPayload) => {
      // 1. Добавляем событие в начало ленты мгновенно
      setEvents(prev => [event, ...prev.slice(0, 199)]);

      // 2. Реагируем на обновления задач с дебаунсом 300мс
      if (event.type.startsWith('task.') || event.type.startsWith('escalation.') || event.type.startsWith('quality_gate.')) {
        if (tasksDebounceTimer.current) {
          clearTimeout(tasksDebounceTimer.current);
        }
        tasksDebounceTimer.current = setTimeout(() => {
          tasksDebounceTimer.current = null;
          api.getTasks().then(setTasks).catch(() => {});
          api.getAnalytics().then(setAnalytics).catch(() => {});
        }, 300);
      }

      // 3. Реагируем на изменения агентов с дебаунсом 300мс
      if (event.type.startsWith('agent.')) {
        if (agentsDebounceTimer.current) {
          clearTimeout(agentsDebounceTimer.current);
        }
        agentsDebounceTimer.current = setTimeout(() => {
          agentsDebounceTimer.current = null;
          api.getAgents().then(setAgents).catch(() => {});
          api.getStatus().then(setStatus).catch(() => {});
        }, 300);
      }
    });

    // Регулярная проверка блокировок сессий (раз в 15 секунд)
    const interval = setInterval(() => {
      api.getStatus().then(setStatus).catch(() => {});
    }, 15000);

    return () => {
      isMounted = false;
      unsubscribeStatus();
      unsubscribeEvents();
      if (tasksDebounceTimer.current) clearTimeout(tasksDebounceTimer.current);
      if (agentsDebounceTimer.current) clearTimeout(agentsDebounceTimer.current);
      clearInterval(interval);
    };
  }, [loadAllData]);

  // Обработчики
  const handleToggleAgent = async (agentId: string, currentEnabled: boolean) => {
    const newStatus = currentEnabled ? 'paused' : 'idle';
    await api.updateAgentStatus(agentId, newStatus);
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, enabled: !currentEnabled, status: newStatus as any } : a));
    toast.info(`Агент @${agentId} переключен в статус: ${newStatus}`);
  };

  const handleRestartTask = async (taskId: string) => {
    try {
      const res = await api.restartTask(taskId);
      if (res.task) {
        setTasks(prev => prev.map(t => t.id === taskId ? res.task : t));
      }
      if (res.escalated) {
        toast.warning(res.message, 'Эскалация задачи');
      } else {
        toast.success(`Задача перезапущена`, 'Перезапуск');
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка перезапуска задачи', 'Ошибка');
    }
  };

  const handleCreateTask = async (taskData: Partial<TaskItem>) => {
    const created = await api.createTask(taskData);
    setTasks(prev => [created, ...prev]);
  };

  const handleSaveDoc = async (filename: string, content: string) => {
    try {
      const res = await api.saveKnowledgeDoc(filename, content);
      if (res.success) {
        setKnowledgeDocs(prev => prev.map(d => d.filename === filename ? { ...d, content, lastModified: new Date().toISOString() } : d));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ControlSettings>) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      return true;
    } catch {
      return false;
    }
  };


  const handleUpdateSensitivity = async (s: SensitivitySetting) => {
    try {
      await api.updateEscalationSettings(s);
      setEscalationSensitivity(s);
      toast.success(`Чувствительность обновлена: ${s}`);
    } catch {
      toast.error('Не удалось обновить чувствительность');
    }
  };

  const handleCopyEscalationPrompt = async (id: string) => {
    try {
      await api.copyEscalationPrompt(id);
      api.getEscalations().then(setEscalations);
    } catch {
      // ignore
    }
  };

  const handleMarkEscalationSent = async (id: string) => {
    await api.sendEscalationToArgon(id);
    api.getEscalations().then(setEscalations);
  };

  const handleSubmitArgonResponse = async (id: string, responseText: string) => {
    await api.submitArgonResponse(id, responseText);
    api.getEscalations().then(setEscalations);
    api.getTasks().then(setTasks);
  };

  const handleResolveEscalation = async (id: string, note?: string) => {
    await api.resolveEscalation(id, note);
    api.getEscalations().then(setEscalations);
    api.getTasks().then(setTasks);
  };

  const handleRejectEscalation = async (id: string, reason?: string) => {
    await api.rejectEscalation(id, reason);
    api.getEscalations().then(setEscalations);
    api.getTasks().then(setTasks);
  };

  const handleRegenerateEscalationPrompt = async (id: string) => {
    await api.regenerateEscalationPrompt(id);
    api.getEscalations().then(setEscalations);
  };

  const handleEmitTestEvent = async (type: EventType) => {
    await api.publishEvent({
      type,
      source: 'DEMO',
      data: {
        note: 'Запущено вручную через тестовую панель Command Center',
        timestamp: new Date().toISOString()
      }
    });
    toast.info(`Тестовое событие "${type}" отправлено в шину`, 'Событие опубликовано');
  };

  const handleSelectTaskFromWorkflow = (task: TaskItem) => {
    if (task.report) {
      setReportModalTask({
        report: task.report,
        title: task.title,
        agentId: task.assignedAgent
      });
    } else {
      setActiveTab('tasks');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-obsidian">
      {/* Шапка и статусная строка */}
      <Header
        status={status}
        connectionStatus={connectionStatus}
        onOpenNewTask={() => setIsNewTaskOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Боковая панель навигации (с поддержкой адаптивного Drawer на мобильных) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingTasksCount={tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length}
          liveEventsCount={events.length}
          activeEscalationsCount={escalations.filter(e => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(e.status)).length}
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Основная рабочая область */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 space-y-6 bg-paper">
          {activeTab === 'overview' && (
            <Overview
              status={status}
              agents={agents}
              tasks={tasks}
              events={events}
              analytics={analytics}
              onNavigate={setActiveTab}
              onOpenNewTask={() => setIsNewTaskOpen(true)}
              onSelectTask={handleSelectTaskFromWorkflow}
              activeEscalations={escalations.filter(e => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(e.status))}
              onOpenEscalationModal={(esc) => setSelectedEscalationModal(esc)}
              onCopyEscalationPrompt={handleCopyEscalationPrompt}
            />
          )}

          {activeTab === 'agents' && (
            <AgentManagement
              agents={agents}
              onToggleAgent={handleToggleAgent}
              onViewPrompt={(agent) => setPromptModalAgent(agent)}
              onViewReport={(agent) => {
                if (agent.lastReport) {
                  setReportModalTask({
                    report: agent.lastReport,
                    title: `Отчёт агента @${agent.id}`,
                    agentId: agent.id
                  });
                }
              }}
            />
          )}

          {activeTab === 'workflow' && (
            <LiveWorkflow
              tasks={tasks}
              events={events}
              onSelectTask={handleSelectTaskFromWorkflow}
            />
          )}

          {activeTab === 'analytics' && (
            <ModelAnalytics
              analytics={analytics}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskManager
              tasks={tasks}
              onOpenNewTask={() => setIsNewTaskOpen(true)}
              onRestartTask={handleRestartTask}
              onRefreshTasks={loadAllData}
              onViewReport={(task) => {
                if (task.report) {
                  setReportModalTask({
                    report: task.report,
                    title: task.title,
                    agentId: task.assignedAgent
                  });
                }
              }}
              onSelectTask={(task) => {
                if (task.report) {
                  setReportModalTask({
                    report: task.report,
                    title: task.title,
                    agentId: task.assignedAgent
                  });
                }
              }}
            />
          )}

          {activeTab === 'memory' && (
            <MemoryExplorer
              docs={knowledgeDocs}
              onSaveDoc={handleSaveDoc}
              onRefresh={() => api.getKnowledgeDocs().then(setKnowledgeDocs)}
            />
          )}


          {activeTab === 'escalations' && (
            <EscalationCenter
              escalations={escalations}
              stats={escalationStats}
              sensitivity={escalationSensitivity}
              onUpdateSensitivity={handleUpdateSensitivity}
              onRefresh={loadAllData}
              onCopyPrompt={handleCopyEscalationPrompt}
              onMarkSent={handleMarkEscalationSent}
              onSubmitResponse={handleSubmitArgonResponse}
              onResolve={handleResolveEscalation}
              onReject={handleRejectEscalation}
              onRegenerate={handleRegenerateEscalationPrompt}
            />
          )}

          {activeTab === 'control' && (
            <ControlCenter
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onGenerateArgonPack={api.generateArgonPack}
              onRunPrompt={api.runPrompt}
            />
          )}

          {activeTab === 'events' && (
            <EventLog
              events={events}
              onEmitTestEvent={handleEmitTestEvent}
            />
          )}
        </main>
      </div>

      {/* Глобальные модальные окна */}
      <PromptModal
        agent={promptModalAgent}
        onClose={() => setPromptModalAgent(null)}
      />

      <ReportModal
        report={reportModalTask?.report || null}
        taskTitle={reportModalTask?.title}
        agentId={reportModalTask?.agentId}
        onClose={() => setReportModalTask(null)}
      />

      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onCreate={handleCreateTask}
      />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
