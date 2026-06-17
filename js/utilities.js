(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};

  const pad = (value, length = 2) => String(value).padStart(length, '0');

  function now() {
    return new Date();
  }

  function formatDateTime(dateInput) {
    if (!dateInput) return '-';
    const date = new Date(dateInput);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatDateTimeSeconds(dateInput) {
    if (!dateInput) return '-';
    const date = new Date(dateInput);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function compactTimestamp(dateInput) {
    const date = dateInput ? new Date(dateInput) : new Date();
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function generateRunId(dateInput) {
    return `RUN_${compactTimestamp(dateInput || new Date())}`;
  }

  function millisecondsBetween(start, end) {
    if (!start) return 0;
    const startMs = new Date(start).getTime();
    const endMs = end ? new Date(end).getTime() : Date.now();
    return Math.max(0, endMs - startMs);
  }

  function formatDuration(ms) {
    if (!ms || ms < 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function pascalCase(value) {
    return String(value || '')
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  function testCaseFolderName(testCase) {
    return `${testCase.id}_${pascalCase(testCase.name)}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function dataUrlToBytes(dataUrl) {
    const commaIndex = dataUrl.indexOf(',');
    const base64 = dataUrl.slice(commaIndex + 1);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function blobFromText(text, type = 'text/plain') {
    return new Blob([text], { type: `${type};charset=utf-8` });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function priorityClass(priority) {
    return String(priority || '').toLowerCase().replace(/\s+/g, '-');
  }

  function statusClass(status) {
    return String(status || 'Not Started').toLowerCase().replace(/\s+/g, '-');
  }

  function showToast(message, variant = 'info') {
    const host = document.getElementById('toastHost');
    if (!host) return;
    const toast = document.createElement('div');
    toast.className = `toast ${variant}`;
    toast.textContent = message;
    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function confirmAction(title, message) {
    return new Promise(resolve => {
      const dialog = document.getElementById('confirmDialog');
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMessage');
      const ok = document.getElementById('confirmOk');
      const cancel = document.getElementById('confirmCancel');

      titleEl.textContent = title;
      msgEl.textContent = message;
      dialog.classList.remove('hidden');

      const cleanup = answer => {
        dialog.classList.add('hidden');
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        resolve(answer);
      };
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);

      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
    });
  }

  UAT.utils = {
    pad,
    now,
    clone,
    formatDateTime,
    formatDateTimeSeconds,
    compactTimestamp,
    generateRunId,
    millisecondsBetween,
    formatDuration,
    escapeHtml,
    pascalCase,
    testCaseFolderName,
    downloadBlob,
    dataUrlToBytes,
    blobFromText,
    priorityClass,
    statusClass,
    showToast,
    confirmAction
  };
}());
