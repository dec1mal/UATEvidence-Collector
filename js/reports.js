(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};

  function buildSummary() {
    const state = UAT.state.getState();
    const testCases = state.testCases;
    const passed = testCases.filter(tc => tc.status === 'Passed').length;
    const failed = testCases.filter(tc => tc.status === 'Failed').length;
    const completed = passed + failed;
    const notExecuted = testCases.filter(tc => tc.status === 'Not Started' || tc.status === 'In Progress').length;
    const totalScreenshots = testCases.reduce((sum, tc) => sum + tc.screenshots.length, 0);
    const start = state.run ? state.run.startTime : null;
    const end = state.run && state.run.endTime ? state.run.endTime : new Date().toISOString();

    return {
      runId: state.run ? state.run.id : null,
      project: state.metadata.projectName,
      application: state.metadata.applicationName,
      tester: state.metadata.testerName,
      environment: state.metadata.environment,
      buildNumber: state.metadata.buildNumber,
      releaseNumber: state.metadata.releaseNumber,
      date: UAT.utils.formatDateTime(end),
      startTime: start,
      endTime: end,
      duration: UAT.utils.formatDuration(UAT.utils.millisecondsBetween(start, end)),
      total: testCases.length,
      completed,
      passed,
      failed,
      notExecuted,
      totalScreenshots,
      testCases: testCases.map(tc => ({
        id: tc.id,
        name: tc.name,
        priority: tc.priority,
        status: tc.status,
        startTime: tc.startTime,
        endTime: tc.endTime,
        duration: UAT.utils.formatDuration(tc.durationMs || UAT.utils.millisecondsBetween(tc.startTime, tc.endTime)),
        screenshotCount: tc.screenshots.length
      }))
    };
  }

  function htmlDocument(title, body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${UAT.utils.escapeHtml(title)}</title>
  <style>
    body{font-family:Segoe UI,Arial,sans-serif;margin:0;background:#f5f7fb;color:#172033}
    header{background:#102a43;color:#fff;padding:24px 32px}
    main{padding:28px 32px}
    h1,h2{margin:0 0 12px}
    table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #d8dee9}
    th,td{padding:10px 12px;border-bottom:1px solid #e5e9f0;text-align:left;font-size:14px}
    th{background:#edf2f7}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:18px 0}
    .card{background:#fff;border:1px solid #d8dee9;border-radius:8px;padding:14px}
    .card span{display:block;color:#536177;font-size:12px;text-transform:uppercase}
    .card strong{font-size:24px}
    .pill{display:inline-block;padding:4px 9px;border-radius:999px;background:#edf2f7}
    img{max-width:520px;border:1px solid #d8dee9;border-radius:6px;margin:10px 0;display:block}
    code{background:#eef2f7;padding:2px 6px;border-radius:4px}
  </style>
</head>
<body>
  <header><h1>${UAT.utils.escapeHtml(title)}</h1></header>
  <main>${body}</main>
</body>
</html>`;
  }

  function summaryHtml(summary) {
    const rows = summary.testCases.map(tc => `<tr>
      <td>${UAT.utils.escapeHtml(tc.id)}</td>
      <td>${UAT.utils.escapeHtml(tc.name)}</td>
      <td>${UAT.utils.escapeHtml(tc.priority)}</td>
      <td><span class="pill">${UAT.utils.escapeHtml(tc.status)}</span></td>
      <td>${UAT.utils.escapeHtml(tc.startTime ? UAT.utils.formatDateTimeSeconds(tc.startTime) : '-')}</td>
      <td>${UAT.utils.escapeHtml(tc.endTime ? UAT.utils.formatDateTimeSeconds(tc.endTime) : '-')}</td>
      <td>${UAT.utils.escapeHtml(tc.duration)}</td>
      <td>${tc.screenshotCount}</td>
    </tr>`).join('');

    return htmlDocument('Execution Summary', `
      <section class="grid">
        <div class="card"><span>Run ID</span><strong>${UAT.utils.escapeHtml(summary.runId)}</strong></div>
        <div class="card"><span>Project</span><strong>${UAT.utils.escapeHtml(summary.project)}</strong></div>
        <div class="card"><span>Application</span><strong>${UAT.utils.escapeHtml(summary.application)}</strong></div>
        <div class="card"><span>Tester</span><strong>${UAT.utils.escapeHtml(summary.tester)}</strong></div>
        <div class="card"><span>Environment</span><strong>${UAT.utils.escapeHtml(summary.environment)}</strong></div>
        <div class="card"><span>Duration</span><strong>${UAT.utils.escapeHtml(summary.duration)}</strong></div>
      </section>
      <section class="grid">
        <div class="card"><span>Total</span><strong>${summary.total}</strong></div>
        <div class="card"><span>Passed</span><strong>${summary.passed}</strong></div>
        <div class="card"><span>Failed</span><strong>${summary.failed}</strong></div>
        <div class="card"><span>Not Executed</span><strong>${summary.notExecuted}</strong></div>
        <div class="card"><span>Total Screenshots</span><strong>${summary.totalScreenshots}</strong></div>
      </section>
      <h2>Test Case Results</h2>
      <table>
        <thead><tr><th>TC ID</th><th>Name</th><th>Priority</th><th>Status</th><th>Start</th><th>End</th><th>Duration</th><th>Screenshots</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `);
  }

  function testCaseJson(tc) {
    return {
      id: tc.id,
      name: tc.name,
      priority: tc.priority,
      status: tc.status,
      startTime: tc.startTime,
      endTime: tc.endTime,
      duration: UAT.utils.formatDuration(tc.durationMs || UAT.utils.millisecondsBetween(tc.startTime, tc.endTime)),
      screenshotCount: tc.screenshots.length,
      screenshots: tc.screenshots.map(item => ({
        filename: item.filename,
        timestamp: item.timestamp,
        relativePath: `Screenshots/${item.filename}`
      }))
    };
  }

  function testCaseHtml(tc) {
    const shots = tc.screenshots.length ? tc.screenshots.map(item => `
      <div class="card">
        <strong>${UAT.utils.escapeHtml(item.filename)}</strong>
        <p>${UAT.utils.escapeHtml(UAT.utils.formatDateTimeSeconds(item.timestamp))}</p>
        <p>Reference: <code>Screenshots/${UAT.utils.escapeHtml(item.filename)}</code></p>
        <img src="../Screenshots/${encodeURIComponent(item.filename)}" alt="${UAT.utils.escapeHtml(item.filename)}">
      </div>`).join('') : '<p>No screenshots captured for this test case.</p>';

    return htmlDocument(`${tc.id} ${tc.name} Report`, `
      <section class="grid">
        <div class="card"><span>TC ID</span><strong>${UAT.utils.escapeHtml(tc.id)}</strong></div>
        <div class="card"><span>Name</span><strong>${UAT.utils.escapeHtml(tc.name)}</strong></div>
        <div class="card"><span>Priority</span><strong>${UAT.utils.escapeHtml(tc.priority)}</strong></div>
        <div class="card"><span>Status</span><strong>${UAT.utils.escapeHtml(tc.status)}</strong></div>
        <div class="card"><span>Start Time</span><strong>${UAT.utils.escapeHtml(tc.startTime ? UAT.utils.formatDateTimeSeconds(tc.startTime) : '-')}</strong></div>
        <div class="card"><span>End Time</span><strong>${UAT.utils.escapeHtml(tc.endTime ? UAT.utils.formatDateTimeSeconds(tc.endTime) : '-')}</strong></div>
        <div class="card"><span>Duration</span><strong>${UAT.utils.escapeHtml(UAT.utils.formatDuration(tc.durationMs || UAT.utils.millisecondsBetween(tc.startTime, tc.endTime)))}</strong></div>
        <div class="card"><span>Screenshot Count</span><strong>${tc.screenshots.length}</strong></div>
      </section>
      <h2>Evidence</h2>
      ${shots}
    `);
  }

  function packageEntries() {
    const state = UAT.state.getState();
    const summary = state.summary || buildSummary();
    const runRoot = `${state.run.id}/`;
    const entries = [];
    const addDir = name => entries.push({ name, directory: true });
    const addText = (name, text) => entries.push({ name, content: text });
    const addBytes = (name, bytes) => entries.push({ name, content: bytes });

    addDir(runRoot);
    addDir(`${runRoot}Metadata/`);
    addDir(`${runRoot}Reports/`);
    addDir(`${runRoot}Logs/`);

    addText(`${runRoot}Metadata/run.json`, JSON.stringify(state.run, null, 2));
    addText(`${runRoot}Metadata/metadata.json`, JSON.stringify(state.metadata, null, 2));
    addText(`${runRoot}Reports/ExecutionSummary.json`, JSON.stringify(summary, null, 2));
    addText(`${runRoot}Reports/ExecutionSummary.html`, summaryHtml(summary));
    addText(`${runRoot}Logs/ApplicationLog.txt`, UAT.logger.text());

    state.testCases.forEach(tc => {
      const folder = `${runRoot}${UAT.utils.testCaseFolderName(tc)}/`;
      addDir(folder);
      addDir(`${folder}Screenshots/`);
      addDir(`${folder}Report/`);
      addText(`${folder}Report/${tc.id}_Report.json`, JSON.stringify(testCaseJson(tc), null, 2));
      addText(`${folder}Report/${tc.id}_Report.html`, testCaseHtml(tc));
      tc.screenshots.forEach(item => {
        addBytes(`${folder}Screenshots/${item.filename}`, UAT.utils.dataUrlToBytes(item.dataUrl));
      });
    });

    return entries;
  }

  UAT.reports = {
    buildSummary,
    summaryHtml,
    testCaseJson,
    testCaseHtml,
    packageEntries
  };
}());
