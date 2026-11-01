export type SupportedLanguage = 'en' | 'ru' | 'es' | 'fr' | 'pt' | 'zh' | 'ja' | 'de';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  englishName: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', englishName: 'English' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺', englishName: 'Russian' },
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸', englishName: 'Spanish' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', englishName: 'French' },
  { code: 'pt', name: 'Português', nativeName: 'Português', flag: '🇵🇹', englishName: 'Portuguese' },
  { code: 'zh', name: '简体中文', nativeName: '简体中文', flag: '🇨🇳', englishName: 'Simplified Chinese' },
  { code: 'ja', name: '日本語', nativeName: '日本語', flag: '🇯🇵', englishName: 'Japanese' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪', englishName: 'German' },
];

export interface TranslationDict {
  nav: {
    overview: string;
    agents: string;
    workflow: string;
    tasks: string;
    escalations: string;
    analytics: string;
    memory: string;
    events: string;
    control: string;
    workspace: string;
    argonProtocol: string;
    argonProtocolBadge: string;
    argonProtocolDesc: string;
    engine: string;
    concurrency: string;
    concurrencySubagents: string;
    boundary: string;
    boundaryLocal: string;
  };
  header: {
    title: string;
    missionControl: string;
    protocolVersion: string;
    director: string;
    sessions: string;
    active: string;
    locks: string;
    inTokens: string;
    outTokens: string;
    cliAgy: string;
    memory: string;
    wsOnline: string;
    wsReconnect: string;
    wsOffline: string;
    oneClickSetup: string;
    syncing: string;
    lightTheme: string;
    darkTheme: string;
    newTask: string;
    taskShort: string;
    selectLanguage: string;
    statusActive: string;
    statusOnline: string;
    statusEscalated: string;
    statusConnecting: string;
  };
  overview: {
    urgentEscalationTitle: string;
    urgentEscalationDetected: string;
    goToEscalations: string;
    activeAgentsTitle: string;
    activeAgentsDesc: string;
    pendingTasksTitle: string;
    pendingTasksDesc: string;
    completedTasksTitle: string;
    completedTasksDesc: string;
    escalatedTasksTitle: string;
    escalatedTasksDesc: string;
    concurrencySupervisor: string;
    concurrencyLimitDesc: string;
    retryPolicy: string;
    retryPolicyDesc: string;
    totalRuns: string;
    successRate: string;
    tokenUsage: string;
    cacheRead: string;
    activeSessions: string;
    noActiveSessions: string;
    liveEventFeed: string;
    viewAllEvents: string;
    status: {
      completed: string;
      in_progress: string;
      escalated: string;
      failed: string;
      verification: string;
      pending: string;
    };
    pipelineStages: {
      triage: string;
      solo: string;
      specialist: string;
      qualityGateL1: string;
      independentL2: string;
      legalGate: string;
      architectL3: string;
      argonL4: string;
      approved: string;
    };
  };
  agents: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allFilter: string;
    activeFilter: string;
    idleFilter: string;
    proFilter: string;
    flashFilter: string;
    modelTier: string;
    systemPrompt: string;
    runPrompt: string;
    totalAgentsCount: string;
  };
  tasks: {
    title: string;
    subtitle: string;
    newTask: string;
    searchTasks: string;
    filterAll: string;
    filterPending: string;
    filterRunning: string;
    filterCompleted: string;
    filterEscalated: string;
    priority: string;
    agent: string;
    stage: string;
    status: string;
    viewReport: string;
    resolveArgon: string;
  };
  escalations: {
    title: string;
    subtitle: string;
    bannerAlert: string;
    activeCount: string;
    generatePack: string;
    promptPack: string;
    copyPrompt: string;
    copied: string;
    resolveVerdict: string;
    approved: string;
    rejected: string;
    resolutionNote: string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageSection: string;
    languageSectionDesc: string;
    currentLanguage: string;
    orchestratorSection: string;
    orchestratorSectionDesc: string;
    concurrencyLabel: string;
    concurrencyDesc: string;
    retriesLabel: string;
    retriesDesc: string;
    retryOption1: string;
    retryOption2: string;
    retryOption3: string;
    escalationPolicyLabel: string;
    escalationStrict: string;
    escalationRelaxed: string;
    allowedAgentsLabel: string;
    saveSettings: string;
    saving: string;
    saved: string;
    argonGeneratorTitle: string;
    argonGeneratorDesc: string;
    issueTitleLabel: string;
    issueTitlePlaceholder: string;
    hypothesisLabel: string;
    hypothesisPlaceholder: string;
    attempt1Label: string;
    attempt2Label: string;
    contextSnippetLabel: string;
    targetQuestionLabel: string;
    generateArgonPackBtn: string;
    generating: string;
    cliTitle: string;
    cliDesc: string;
    cliAgentLabel: string;
    cliPromptLabel: string;
    cliPromptPlaceholder: string;
    cliConfirmLabel: string;
    cliExecuteBtn: string;
    cliRunning: string;
  };
  common: {
    save: string;
    cancel: string;
    copy: string;
    copied: string;
    run: string;
    close: string;
    success: string;
    error: string;
    loading: string;
    refresh: string;
    search: string;
    filter: string;
    view: string;
    delete: string;
    active: string;
    idle: string;
    offline: string;
  };
}
