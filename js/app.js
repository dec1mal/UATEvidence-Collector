(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};

  function byId(id) {
    return document.getElementById(id);
  }

  function formMetadata() {
    const form = byId('setupForm');
    const data = new FormData(form);
    return {
      testerName: data.get('testerName').trim(),
      projectName: data.get('projectName').trim(),
      applicationName: data.get('applicationName').trim(),
      buildNumber: data.get('buildNumber').trim(),
      releaseNumber: data.get('releaseNumber').trim(),
      environment: data.get('environment')
    };
  }

  function hydrateForm() {
    const metadata = UAT.state.getState().metadata;
    Object.keys(metadata).forEach(key => {
      const field = document.querySelector(`[name="${key}"]`);
      if (!field) return;
      if (field.type === 'radio') {
        document.querySelectorAll(`[name="${key}"]`).forEach(radio => {
          radio.checked = radio.value === metadata[key];
        });
      } else {
        field.value = metadata[key] || '';
      }
    });
  }

  function applyTheme() {
    const theme = UAT.state.getState().theme || 'light';
    document.documentElement.dataset.theme = theme;
    byId('themeToggle').textContent = theme === 'dark' ? 'L' : 'D';
  }

  function wireEvents() {
    byId('importSample').addEventListener('click', () => {
      UAT.state.importSampleCases();
      byId('startExecution').disabled = false;
      UAT.logger.log('APP_START', 'Sample test cases imported');
      UAT.dashboard.renderAll();
      UAT.utils.showToast('Sample test cases imported.', 'success');
    });

    byId('setupForm').addEventListener('submit', event => {
      event.preventDefault();
      UAT.execution.start(formMetadata());
    });

    document.querySelectorAll('#setupForm input').forEach(input => {
      input.addEventListener('input', () => UAT.state.setMetadata(formMetadata()));
      input.addEventListener('change', () => UAT.state.setMetadata(formMetadata()));
    });

    byId('themeToggle').addEventListener('click', () => {
      const next = UAT.state.getState().theme === 'dark' ? 'light' : 'dark';
      UAT.state.setTheme(next);
      applyTheme();
    });

    byId('resetApp').addEventListener('click', async () => {
      const ok = await UAT.utils.confirmAction('Reset Demo', 'Clear local state, screenshots, logs, and active execution data?');
      if (!ok) return;
      UAT.state.reset();
      hydrateForm();
      applyTheme();
      byId('startExecution').disabled = true;
      UAT.logger.log('APP_START', 'Application reset');
      UAT.dashboard.renderAll();
      UAT.utils.showToast('Demo reset.', 'success');
    });

    byId('clearRecentRuns').addEventListener('click', () => {
      UAT.state.clearRecentRuns();
      UAT.dashboard.renderAll();
    });

    byId('captureEvidence').addEventListener('click', UAT.execution.captureEvidence);
    byId('markPass').addEventListener('click', UAT.execution.markPass);
    byId('markFail').addEventListener('click', UAT.execution.markFail);
    byId('nextTc').addEventListener('click', UAT.execution.next);
    byId('endRun').addEventListener('click', UAT.execution.endRun);
    byId('downloadSummaryHtml').addEventListener('click', UAT.execution.downloadSummaryHtml);
    byId('downloadSummaryJson').addEventListener('click', UAT.execution.downloadSummaryJson);
    byId('downloadPackage').addEventListener('click', UAT.execution.downloadPackage);
    byId('exportLogs').addEventListener('click', UAT.execution.exportLogs);
    byId('clearLogs').addEventListener('click', () => {
      UAT.state.clearLogView();
      UAT.dashboard.renderAll();
    });

    byId('searchCases').addEventListener('input', UAT.dashboard.renderAll);
    byId('statusFilter').addEventListener('change', UAT.dashboard.renderAll);

    byId('closeModal').addEventListener('click', () => byId('modalBackdrop').classList.add('hidden'));
    byId('modalBackdrop').addEventListener('click', event => {
      if (event.target.id === 'modalBackdrop') byId('modalBackdrop').classList.add('hidden');
    });

    document.addEventListener('keydown', event => {
      if (!event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === 's') { event.preventDefault(); UAT.execution.captureEvidence(); }
      if (key === 'p') { event.preventDefault(); UAT.execution.markPass(); }
      if (key === 'f') { event.preventDefault(); UAT.execution.markFail(); }
      if (key === 'n') { event.preventDefault(); UAT.execution.next(); }
      if (key === 'e') { event.preventDefault(); UAT.execution.endRun(); }
    });
  }

  function init() {
    UAT.state.load();
    hydrateForm();
    applyTheme();
    byId('startExecution').disabled = UAT.state.getState().testCases.length === 0;
    UAT.logger.log('APP_START', 'Application initialized');
    wireEvents();
    UAT.dashboard.renderAll();
    setInterval(UAT.dashboard.renderAll, 1000);
  }

  document.addEventListener('DOMContentLoaded', init);
}());
