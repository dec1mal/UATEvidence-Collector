(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};

  function log(event, detail) {
    const state = UAT.state.getState();
    const runId = state.run && state.run.id ? state.run.id : 'NO_RUN';
    const line = `${UAT.utils.formatDateTime(new Date())} | ${runId} | ${event} | ${detail}`;
    UAT.state.pushLog(line);
    return line;
  }

  function text() {
    return UAT.state.getState().auditLog.join('\n');
  }

  UAT.logger = { log, text };
}());
