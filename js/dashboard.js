(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};

  function byId(id) {
    return document.getElementById(id);
  }

  function metrics() {
    const state = UAT.state.getState();
    const total = state.testCases.length;
    const passed = state.testCases.filter(tc => tc.status === 'Passed').length;
    const failed = state.testCases.filter(tc => tc.status === 'Failed').length;
    const completed = passed + failed;
    const remaining = Math.max(0, total - completed);
    const screenshots = state.testCases.reduce((sum, tc) => sum + tc.screenshots.length, 0);
    return { total, passed, failed, completed, remaining, screenshots };
  }

  function renderMetrics() {
    const m = metrics();
    byId('metricTotal').textContent = m.total;
    byId('metricPassed').textContent = m.passed;
    byId('metricFailed').textContent = m.failed;
    byId('metricCompleted').textContent = m.completed;
    byId('metricRemaining').textContent = m.remaining;
    byId('metricScreenshots').textContent = m.screenshots;
    byId('progressBar').style.width = m.total ? `${Math.round((m.completed / m.total) * 100)}%` : '0%';
  }

  function renderRun() {
    const state = UAT.state.getState();
    const selected = UAT.state.getSelectedTestCase();
    byId('runId').textContent = state.run ? state.run.id : '-';
    byId('runStart').textContent = state.run ? UAT.utils.formatDateTimeSeconds(state.run.startTime) : '-';
    byId('currentTc').textContent = selected ? `${selected.id} ${selected.name}` : '-';
    byId('widgetCurrentTc').textContent = selected ? `${selected.id} ${selected.name}` : 'None';
    byId('currentStatus').textContent = selected ? selected.status : '-';
    byId('currentScreenshots').textContent = selected ? selected.screenshots.length : '0';
    const badge = byId('runBadge');
    badge.textContent = state.run ? (state.run.endTime ? 'Run Ended' : 'Run Active') : 'No Active Run';
    badge.className = `status-pill ${state.run && !state.run.endTime ? 'active' : 'neutral'}`;
  }

  function filteredCases() {
    const state = UAT.state.getState();
    const query = byId('searchCases').value.trim().toLowerCase();
    const filter = byId('statusFilter').value;
    return state.testCases.filter(tc => {
      const matchesQuery = !query || `${tc.id} ${tc.name} ${tc.priority} ${tc.status}`.toLowerCase().includes(query);
      const matchesStatus = filter === 'All' || tc.status === filter;
      return matchesQuery && matchesStatus;
    });
  }

  function renderTable() {
    const tbody = byId('testCaseTable');
    const state = UAT.state.getState();
    const rows = filteredCases();
    if (!state.testCases.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-table">Import sample test cases to begin.</td></tr>';
      return;
    }
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-table">No test cases match the current filter.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(tc => {
      const duration = tc.durationMs || UAT.utils.millisecondsBetween(tc.startTime, tc.endTime);
      return `<tr data-tc-id="${UAT.utils.escapeHtml(tc.id)}" class="${tc.id === state.selectedTestCaseId ? 'selected' : ''}">
        <td><strong>${UAT.utils.escapeHtml(tc.id)}</strong></td>
        <td>${UAT.utils.escapeHtml(tc.name)}</td>
        <td><span class="priority ${UAT.utils.priorityClass(tc.priority)}">${UAT.utils.escapeHtml(tc.priority)}</span></td>
        <td><span class="status-pill ${UAT.utils.statusClass(tc.status)}">${UAT.utils.escapeHtml(tc.status)}</span></td>
        <td>${tc.screenshots.length}</td>
        <td>${UAT.utils.escapeHtml(tc.startTime ? UAT.utils.formatDateTimeSeconds(tc.startTime) : '-')}</td>
        <td>${UAT.utils.escapeHtml(tc.endTime ? UAT.utils.formatDateTimeSeconds(tc.endTime) : '-')}</td>
        <td>${UAT.utils.escapeHtml(UAT.utils.formatDuration(duration))}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('tr[data-tc-id]').forEach(row => {
      row.addEventListener('click', () => UAT.execution.selectTestCase(row.dataset.tcId));
    });
  }

  function renderGallery() {
    const selected = UAT.state.getSelectedTestCase();
    const gallery = byId('evidenceGallery');
    byId('galleryContext').textContent = selected ? `${selected.id} ${selected.name}` : 'No test case selected';
    if (!selected) {
      gallery.className = 'gallery empty';
      gallery.textContent = 'Screenshots appear here immediately after capture.';
      return;
    }
    if (!selected.screenshots.length) {
      gallery.className = 'gallery empty';
      gallery.textContent = 'No screenshots captured for this test case.';
      return;
    }
    gallery.className = 'gallery';
    gallery.innerHTML = selected.screenshots.map((shot, index) => `
      <button class="thumb" type="button" data-index="${index}">
        <img src="${shot.dataUrl}" alt="${UAT.utils.escapeHtml(shot.filename)}">
        <span>${UAT.utils.escapeHtml(shot.filename)}</span>
        <small>${UAT.utils.escapeHtml(UAT.utils.formatDateTimeSeconds(shot.timestamp))}</small>
      </button>`).join('');
    gallery.querySelectorAll('.thumb').forEach(button => {
      button.addEventListener('click', () => {
        const shot = selected.screenshots[Number(button.dataset.index)];
        UAT.dashboard.openPreview(shot);
      });
    });
  }

  function renderStats() {
    const state = UAT.state.getState();
    const total = state.testCases.reduce((sum, tc) => sum + tc.screenshots.length, 0);
    const maxTc = state.testCases.slice().sort((a, b) => b.screenshots.length - a.screenshots.length)[0];
    byId('evidenceStats').innerHTML = `
      <div><span>Total evidence images</span><strong>${total}</strong></div>
      <div><span>Highest evidence TC</span><strong>${maxTc ? `${UAT.utils.escapeHtml(maxTc.id)} (${maxTc.screenshots.length})` : '-'}</strong></div>
      <div><span>Completion ratio</span><strong>${metrics().total ? Math.round((metrics().completed / metrics().total) * 100) : 0}%</strong></div>
      <div><span>Current package state</span><strong>${UAT.state.getState().packageGeneratedAt ? 'Generated' : 'Pending'}</strong></div>
    `;
  }

  function renderLogs() {
    byId('auditLog').textContent = UAT.logger.text();
  }

  function renderSummary() {
    const state = UAT.state.getState();
    const panel = byId('summaryPanel');
    if (!state.summary) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    const summary = state.summary;
    byId('summaryContent').innerHTML = `
      <div class="summary-grid">
        <div><span>Run ID</span><strong>${UAT.utils.escapeHtml(summary.runId)}</strong></div>
        <div><span>Project</span><strong>${UAT.utils.escapeHtml(summary.project)}</strong></div>
        <div><span>Application</span><strong>${UAT.utils.escapeHtml(summary.application)}</strong></div>
        <div><span>Tester</span><strong>${UAT.utils.escapeHtml(summary.tester)}</strong></div>
        <div><span>Environment</span><strong>${UAT.utils.escapeHtml(summary.environment)}</strong></div>
        <div><span>Date</span><strong>${UAT.utils.escapeHtml(summary.date)}</strong></div>
        <div><span>Total</span><strong>${summary.total}</strong></div>
        <div><span>Passed</span><strong>${summary.passed}</strong></div>
        <div><span>Failed</span><strong>${summary.failed}</strong></div>
        <div><span>Not Executed</span><strong>${summary.notExecuted}</strong></div>
        <div><span>Total Screenshots</span><strong>${summary.totalScreenshots}</strong></div>
        <div><span>Duration</span><strong>${UAT.utils.escapeHtml(summary.duration)}</strong></div>
      </div>`;
  }

  function renderRecentRuns() {
    const host = byId('recentRuns');
    const recent = UAT.state.getRecentRuns();
    if (!recent.length) {
      host.className = 'recent-runs empty';
      host.textContent = 'No recent runs yet.';
      return;
    }
    host.className = 'recent-runs';
    host.innerHTML = recent.map(run => `
      <div class="recent-run">
        <strong>${UAT.utils.escapeHtml(run.runId)}</strong>
        <span>${UAT.utils.escapeHtml(run.project)}</span>
        <small>${run.passed}/${run.total} passed / ${run.failed} failed</small>
      </div>`).join('');
  }

  function openPreview(shot) {
    byId('modalTitle').textContent = shot.filename;
    byId('modalImage').src = shot.dataUrl;
    byId('modalMeta').textContent = `${UAT.utils.formatDateTimeSeconds(shot.timestamp)} | ${shot.method}`;
    byId('modalBackdrop').classList.remove('hidden');
  }

  function renderAll() {
    renderMetrics();
    renderRun();
    renderTable();
    renderGallery();
    renderStats();
    renderLogs();
    renderSummary();
    renderRecentRuns();
  }

  UAT.dashboard = { renderAll, openPreview, metrics };
}());
