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

import { PromptModal } from './components/Modals/PromptModal.js';
import { ReportModal } from './components/Modals/ReportModal.js';
import { NewTaskModal } from './components/Modals/NewTaskModal.js';

import { api, eventStream } from './services/api.js';
import type { 
  DirectorStatus, 
  AgentInfo, 
  TaskItem, 
  EventPayload, 
  ModelMetrics, 
  KnowledgeDoc, 
  ControlSettings,
  EventType,
  SubagentReport
} from './types.js';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Данные приложения
  const [status, setStatus] = useState<DirectorStatus | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [analytics, setAnalytics] = useState<{
    tiers: ModelMetrics[];
    totalTokens: { input: number; output: number; cacheRead: number };
    totalRuns: number;
    overallSuccessRate: number;
    escalationRate: number;
    verifiedRealSessionsCount: number;
  } | null>(null);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [settings, setSettings] = useState<ControlSettings | null>(null);

  // Модальные окна
  const [promptModalAgent, setPromptModalAgent] = useState<AgentInfo | null>(null);
  const [reportModalTask, setReportModalTask] = useState<{ report: SubagentReport; title: string; agentId: string } | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Первоначальная загрузка данных
  const loadAllData = async () => {
    try {
      const [
        fetchedStatus,
        fetchedAgents,
        fetchedTasks,
        fetchedEvents,
        fetchedAnalytics,
        fetchedDocs,
        fetchedSettings
      ] = await Promise.all([
        api.getStatus().catch(() => null),
        api.getAgents().catch(() => []),
        api.getTasks().catch(() => []),
        api.getEvents({ limit: 50 }).catch(() => []),
        api.getAnalytics().catch(() => null),
        api.getKnowledgeDocs().catch(() => []),
        api.getSettings().catch(() => null)
      ]);

      if (fetchedStatus) setStatus(fetchedStatus);
      if (fetchedAgents) setAgents(fetchedAgents);
      if (fetchedTasks) setTasks(fetchedTasks);
      if (fetchedEvents) setEvents(fetchedEvents);
      if (fetchedAnalytics) setAnalytics(fetchedAnalytics);
      if (fetchedDocs) setKnowledgeDocs(fetchedDocs);
      if (fetchedSettings) setSettings(fetchedSettings);
    } catch (err) {
      console.error('Ошибка инициализации данных Command Center:', err);
    }
  };

  useEffect(() => {
    loadAllData();

    // Подписка на живые WebSocket события
    const unsubscribe = eventStream.subscribe((event: EventPayload) => {
      // 1. Добавляем событие в начало ленты
      setEvents(prev => [event, ...prev.slice(0, 199)]);

      // 2. Реагируем на обновления задач
      if (event.type.startsWith('task.') || event.type.startsWith('escalation.') || event.type.startsWith('quality_gate.')) {
        api.getTasks().then(setTasks).catch(() => {});
        api.getAnalytics().then(setAnalytics).catch(() => {});
      }

      // 3. Реагируем на изменения агентов
      if (event.type.startsWith('agent.')) {
        api.getAgents().then(setAgents).catch(() => {});
        api.getStatus().then(setStatus).catch(() => {});
      }
    });

    // Регулярная проверка блокировок сессий (раз в 15 секунд)
    const interval = setInterval(() => {
      api.getStatus().then(setStatus).catch(() => {});
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Обработчики
  const handleToggleAgent = async (agentId: string, currentEnabled: boolean) => {
    const newStatus = currentEnabled ? 'paused' : 'idle';
    await api.updateAgentStatus(agentId, newStatus);
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, enabled: !currentEnabled, status: newStatus as any } : a));
  };

  const handleRestartTask = async (taskId: string) => {
    try {
      const res = await api.restartTask(taskId);
      if (res.task) {
        setTasks(prev => prev.map(t => t.id === taskId ? res.task : t));
      }
      if (res.escalated) {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка перезапуска задачи');
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

  const handleEmitTestEvent = async (type: EventType) => {
    await api.publishEvent({
      type,
      source: 'DEMO',
      data: {
        note: 'Запущено вручную через тестовую панель Command Center',
        timestamp: new Date().toISOString()
      }
    });
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
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      {/* Шапка и статусная строка */}
      <Header
        status={status}
        onOpenNewTask={() => setIsNewTaskOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Боковая панель навигации */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingTasksCount={tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length}
          liveEventsCount={events.length}
        />

        {/* Основная рабочая область */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
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

export default App;
