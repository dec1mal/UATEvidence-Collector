(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};
  const STORAGE_KEY = 'uatEvidenceCollector.state.v1';
  const RECENT_KEY = 'uatEvidenceCollector.recentRuns.v1';

  const sampleCases = [
    { id: 'TC01', name: 'Login Validation', priority: 'High' },
    { id: 'TC02', name: 'Create Customer', priority: 'High' },
    { id: 'TC03', name: 'Fund Transfer', priority: 'Critical' },
    { id: 'TC04', name: 'Account Statement', priority: 'Medium' },
    { id: 'TC05', name: 'Logout', priority: 'Low' }
  ];

  const defaultMetadata = {
    testerName: 'Priya Menon',
    projectName: 'Retail Core Banking Modernization',
    applicationName: 'OmniBank Teller Portal',
    buildNumber: '2026.06.17.1',
    releaseNumber: 'R26.06',
    environment: 'UAT'
  };

  function createInitialState() {
    return {
      theme: 'light',
      metadata: Object.assign({}, defaultMetadata),
      testCases: [],
      run: null,
      selectedTestCaseId: null,
      auditLog: [],
      summary: null,
      packageGeneratedAt: null
    };
  }

  let state = createInitialState();

  function normalizeTestCase(input) {
    return {
      id: input.id || input.tcId,
      name: input.name || input.tcName,
      priority: input.priority || 'Medium',
      status: input.status || 'Not Started',
      screenshots: input.screenshots || [],
      startTime: input.startTime || null,
      endTime: input.endTime || null,
      durationMs: input.durationMs || 0
    };
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return state;
      const parsed = JSON.parse(saved);
      state = Object.assign(createInitialState(), parsed);
      state.metadata = Object.assign({}, defaultMetadata, parsed.metadata || {});
      state.testCases = (parsed.testCases || []).map(normalizeTestCase);
      state.auditLog = parsed.auditLog || [];
      return state;
    } catch (error) {
      console.warn('State recovery failed', error);
      state = createInitialState();
      return state;
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function reset() {
    state = createInitialState();
    localStorage.removeItem(STORAGE_KEY);
    save();
    return state;
  }

  function getState() {
    return state;
  }

  function setTheme(theme) {
    state.theme = theme;
    save();
  }

  function setMetadata(metadata) {
    state.metadata = Object.assign({}, state.metadata, metadata);
    save();
  }

  function importSampleCases() {
    state.testCases = sampleCases.map(normalizeTestCase);
    state.selectedTestCaseId = state.testCases[0] ? state.testCases[0].id : null;
    state.summary = null;
    save();
  }

  function setRun(run) {
    state.run = run;
    save();
  }

  function setSelectedTestCase(id) {
    state.selectedTestCaseId = id;
    save();
  }

  function getSelectedTestCase() {
    return state.testCases.find(tc => tc.id === state.selectedTestCaseId) || null;
  }

  function updateTestCase(id, patch) {
    const tc = state.testCases.find(item => item.id === id);
    if (!tc) return null;
    Object.assign(tc, patch);
    save();
    return tc;
  }

  function addScreenshot(tcId, screenshot) {
    const tc = state.testCases.find(item => item.id === tcId);
    if (!tc) return null;
    tc.screenshots.push(screenshot);
    save();
    return tc;
  }

  function pushLog(entry) {
    state.auditLog.push(entry);
    save();
  }

  function clearLogView() {
    state.auditLog = [];
    save();
  }

  function setSummary(summary) {
    state.summary = summary;
    save();
  }

  function markPackageGenerated(dateIso) {
    state.packageGeneratedAt = dateIso;
    save();
  }

  function getRecentRuns() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  function addRecentRun(summary) {
    const recent = getRecentRuns().filter(item => item.runId !== summary.runId);
    recent.unshift({
      runId: summary.runId,
      project: summary.project,
      application: summary.application,
      tester: summary.tester,
      environment: summary.environment,
      endedAt: summary.endTime,
      passed: summary.passed,
      failed: summary.failed,
      total: summary.total
    });
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)));
  }

  function clearRecentRuns() {
    localStorage.removeItem(RECENT_KEY);
  }

  UAT.sampleCases = sampleCases;
  UAT.state = {
    load,
    save,
    reset,
    getState,
    setTheme,
    setMetadata,
    importSampleCases,
    setRun,
    setSelectedTestCase,
    getSelectedTestCase,
    updateTestCase,
    addScreenshot,
    pushLog,
    clearLogView,
    setSummary,
    markPackageGenerated,
    getRecentRuns,
    addRecentRun,
    clearRecentRuns
  };
}());
