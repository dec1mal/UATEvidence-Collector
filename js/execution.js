(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};

  function selected() {
    return UAT.state.getSelectedTestCase();
  }

  function requireRun() {
    const state = UAT.state.getState();
    if (!state.run || state.run.endTime) {
      UAT.utils.showToast('Start an execution run first.', 'warning');
      return false;
    }
    return true;
  }

  function ensureInProgress(tc) {
    if (!tc || tc.status !== 'Not Started') return tc;
    return UAT.state.updateTestCase(tc.id, {
      status: 'In Progress',
      startTime: new Date().toISOString(),
      endTime: null,
      durationMs: 0
    });
  }

  function start(metadata) {
    const state = UAT.state.getState();
    if (!state.testCases.length) {
      UAT.utils.showToast('Import sample test cases before starting.', 'warning');
      return;
    }
    UAT.state.setMetadata(metadata);
    const startDate = new Date();
    UAT.state.setRun({
      id: UAT.utils.generateRunId(startDate),
      startTime: startDate.toISOString(),
      endTime: null,
      durationMs: 0
    });
    UAT.state.setSummary(null);
    UAT.state.markPackageGenerated(null);
    UAT.state.getState().testCases.forEach(tc => {
      UAT.state.updateTestCase(tc.id, {
        status: 'Not Started',
        screenshots: [],
        startTime: null,
        endTime: null,
        durationMs: 0
      });
    });
    UAT.state.setSelectedTestCase(state.testCases[0].id);
    ensureInProgress(UAT.state.getSelectedTestCase());
    UAT.logger.log('RUN_START', `Execution started by ${metadata.testerName} for ${metadata.projectName}`);
    UAT.logger.log('FOLDERS', 'Evidence package folder model initialized in browser memory');
    UAT.logger.log('TC_SELECT', `${state.testCases[0].id} selected`);
    UAT.dashboard.renderAll();
    UAT.utils.showToast('Execution started.', 'success');
  }

  function selectTestCase(id) {
    const state = UAT.state.getState();
    const tc = state.testCases.find(item => item.id === id);
    if (!tc) return;
    UAT.state.setSelectedTestCase(id);
    if (state.run && !state.run.endTime && tc.status === 'Not Started') ensureInProgress(tc);
    UAT.logger.log('TC_SELECT', `${tc.id} ${tc.name}`);
    UAT.dashboard.renderAll();
  }

  async function captureEvidence() {
    if (!requireRun()) return;
    let tc = selected();
    if (!tc) {
      UAT.utils.showToast('Select a test case first.', 'warning');
      return;
    }
    tc = ensureInProgress(tc);
    UAT.utils.showToast('Capturing evidence...', 'info');
    const screenshot = await UAT.screenshots.capture(tc);
    UAT.state.addScreenshot(tc.id, screenshot);
    UAT.logger.log('SCREENSHOT', `${tc.id} | ${screenshot.filename} | ${screenshot.method}`);
    UAT.dashboard.renderAll();
    UAT.utils.showToast(`Captured ${screenshot.filename}`, 'success');
  }

  function mark(status) {
    if (!requireRun()) return;
    const tc = selected();
    if (!tc) {
      UAT.utils.showToast('Select a test case first.', 'warning');
      return;
    }
    const startTime = tc.startTime || new Date().toISOString();
    const endTime = new Date().toISOString();
    UAT.state.updateTestCase(tc.id, {
      status,
      startTime,
      endTime,
      durationMs: UAT.utils.millisecondsBetween(startTime, endTime)
    });
    UAT.logger.log(status === 'Passed' ? 'PASS' : 'FAIL', `${tc.id} marked ${status.toUpperCase()}`);
    UAT.dashboard.renderAll();
    UAT.utils.showToast(`${tc.id} marked ${status}.`, status === 'Passed' ? 'success' : 'error');
  }

  function next() {
    if (!requireRun()) return;
    const state = UAT.state.getState();
    const currentIndex = state.testCases.findIndex(tc => tc.id === state.selectedTestCaseId);
    const candidates = state.testCases.slice(currentIndex + 1).concat(state.testCases.slice(0, currentIndex + 1));
    const nextTc = candidates.find(tc => tc.status === 'Not Started' || tc.status === 'In Progress');
    if (!nextTc) {
      UAT.utils.showToast('No remaining active test cases.', 'info');
      return;
    }
    UAT.state.setSelectedTestCase(nextTc.id);
    ensureInProgress(nextTc);
    UAT.logger.log('NEXT_TC', `${nextTc.id} ${nextTc.name}`);
    UAT.dashboard.renderAll();
  }

  async function endRun(skipConfirmation) {
    const state = UAT.state.getState();
    if (!state.run || state.run.endTime) {
      UAT.utils.showToast('No active run to end.', 'warning');
      return false;
    }
    const ok = skipConfirmation || await UAT.utils.confirmAction('End Run', 'End this run and generate the execution summary?');
    if (!ok) return false;
    const endTime = new Date().toISOString();
    state.testCases.forEach(tc => {
      if (tc.status === 'In Progress') {
        UAT.state.updateTestCase(tc.id, {
          endTime,
          durationMs: UAT.utils.millisecondsBetween(tc.startTime, endTime)
        });
      }
    });
    UAT.state.setRun(Object.assign({}, state.run, {
      endTime,
      durationMs: UAT.utils.millisecondsBetween(state.run.startTime, endTime)
    }));
    const summary = UAT.reports.buildSummary();
    UAT.state.setSummary(summary);
    UAT.state.addRecentRun(summary);
    UAT.logger.log('RUN_END', `Run ended. Passed=${summary.passed}, Failed=${summary.failed}, Screenshots=${summary.totalScreenshots}`);
    UAT.dashboard.renderAll();
    UAT.utils.showToast('Run ended and summary generated.', 'success');
    return true;
  }

  function downloadSummaryHtml() {
    const summary = UAT.state.getState().summary || UAT.reports.buildSummary();
    const blob = UAT.utils.blobFromText(UAT.reports.summaryHtml(summary), 'text/html');
    UAT.logger.log('EXPORT', 'ExecutionSummary.html downloaded');
    UAT.utils.downloadBlob(blob, 'ExecutionSummary.html');
    UAT.dashboard.renderAll();
  }

  function downloadSummaryJson() {
    const summary = UAT.state.getState().summary || UAT.reports.buildSummary();
    const blob = UAT.utils.blobFromText(JSON.stringify(summary, null, 2), 'application/json');
    UAT.logger.log('EXPORT', 'ExecutionSummary.json downloaded');
    UAT.utils.downloadBlob(blob, 'ExecutionSummary.json');
    UAT.dashboard.renderAll();
  }

  function exportLogs() {
    UAT.logger.log('EXPORT', 'ApplicationLog.txt downloaded');
    UAT.utils.downloadBlob(UAT.utils.blobFromText(UAT.logger.text()), 'ApplicationLog.txt');
    UAT.dashboard.renderAll();
  }

  async function downloadPackage() {
    const state = UAT.state.getState();
    if (!state.run) {
      UAT.utils.showToast('Start a run before creating a package.', 'warning');
      return;
    }
    if (!state.run.endTime) {
      const ok = await UAT.utils.confirmAction('Active Run', 'The run is still active. End it now and generate the package?');
      if (!ok) return;
      const ended = await endRun(true);
      if (!ended) return;
    }
    const activeState = UAT.state.getState();
    if (!activeState.summary) UAT.state.setSummary(UAT.reports.buildSummary());
    UAT.logger.log('PACKAGE', 'Evidence ZIP package generated');
    const blob = UAT.zip.createZip(UAT.reports.packageEntries());
    UAT.state.markPackageGenerated(new Date().toISOString());
    UAT.utils.downloadBlob(blob, `${UAT.state.getState().run.id}.zip`);
    UAT.dashboard.renderAll();
    UAT.utils.showToast('Evidence package ZIP downloaded.', 'success');
  }

  UAT.execution = {
    start,
    selectTestCase,
    captureEvidence,
    markPass: () => mark('Passed'),
    markFail: () => mark('Failed'),
    next,
    endRun,
    downloadSummaryHtml,
    downloadSummaryJson,
    exportLogs,
    downloadPackage
  };
}());
