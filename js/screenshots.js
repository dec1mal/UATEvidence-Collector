(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};

  function nextSequence(testCase) {
    return UAT.utils.pad(testCase.screenshots.length + 1, 3);
  }

  function filenameFor(testCase, timestamp) {
    return `${testCase.id}_${nextSequence(testCase)}_${UAT.utils.compactTimestamp(timestamp)}.png`;
  }

  function drawPlaceholder(testCase, metadata) {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 1440, 900);
    gradient.addColorStop(0, '#f7f9fc');
    gradient.addColorStop(1, '#dfe8f3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#102a43';
    ctx.fillRect(0, 0, canvas.width, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 34px Segoe UI, Arial';
    ctx.fillText(metadata.applicationName || 'Banking Application', 48, 58);
    ctx.font = '18px Segoe UI, Arial';
    ctx.fillText(`Environment: ${metadata.environment || 'UAT'}   Build: ${metadata.buildNumber || '-'}`, 1010, 56);

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 52, 132, 1336, 650, 18);
    ctx.fill();
    ctx.strokeStyle = '#c9d4e2';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#253858';
    ctx.font = '700 36px Segoe UI, Arial';
    ctx.fillText(`${testCase.id} | ${testCase.name}`, 92, 196);

    ctx.font = '22px Segoe UI, Arial';
    ctx.fillStyle = '#536177';
    ctx.fillText(`Priority: ${testCase.priority}`, 92, 238);
    ctx.fillText(`Captured: ${UAT.utils.formatDateTimeSeconds(new Date())}`, 92, 274);
    ctx.fillText('Generated placeholder evidence because browser screen capture was denied, blocked, or unavailable.', 92, 312);

    const columns = ['Customer ID', 'Account', 'Transaction Type', 'Amount', 'Status'];
    const values = [
      ['CUST-100284', 'SB-4029-7712', 'Login Verification', 'N/A', 'Validated'],
      ['CUST-100284', 'CA-9182-0044', 'Fund Transfer', 'INR 25,000.00', 'Pending Review'],
      ['CUST-100284', 'LN-7740-1200', 'Statement Request', 'N/A', 'Generated']
    ];

    ctx.fillStyle = '#edf2f7';
    ctx.fillRect(92, 370, 1256, 54);
    ctx.fillStyle = '#1f2d3d';
    ctx.font = '700 18px Segoe UI, Arial';
    columns.forEach((column, index) => ctx.fillText(column, 116 + index * 245, 404));

    ctx.font = '18px Segoe UI, Arial';
    values.forEach((row, rowIndex) => {
      const y = 466 + rowIndex * 64;
      ctx.fillStyle = rowIndex % 2 ? '#f8fafc' : '#ffffff';
      ctx.fillRect(92, y - 34, 1256, 58);
      ctx.fillStyle = '#263445';
      row.forEach((value, index) => ctx.fillText(value, 116 + index * 245, y));
    });

    ctx.fillStyle = '#0e7490';
    roundRect(ctx, 92, 690, 220, 48, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px Segoe UI, Arial';
    ctx.fillText('Evidence Captured', 122, 721);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px Segoe UI, Arial';
    ctx.fillText('Browser Demo fallback image - suitable for ZIP/report workflow validation.', 92, 830);
    return canvas.toDataURL('image/png');
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  async function captureDisplay() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen capture is not supported by this browser context.');
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise(resolve => {
        if (video.readyState >= 2) resolve();
        else video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1440;
      canvas.height = video.videoHeight || 900;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  async function capture(testCase) {
    const metadata = UAT.state.getState().metadata;
    const timestamp = new Date();
    let dataUrl;
    let method = 'DisplayMedia';

    try {
      dataUrl = await captureDisplay();
    } catch (error) {
      method = 'CanvasFallback';
      dataUrl = drawPlaceholder(testCase, metadata);
    }

    return {
      filename: filenameFor(testCase, timestamp),
      timestamp: timestamp.toISOString(),
      method,
      dataUrl
    };
  }

  UAT.screenshots = { capture };
}());
