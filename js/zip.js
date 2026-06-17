(function () {
  'use strict';

  const UAT = window.UAT = window.UAT || {};
  const encoder = new TextEncoder();

  function dosDateTime(dateInput) {
    const date = dateInput ? new Date(dateInput) : new Date();
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, date: dosDate };
  }

  function uint16(value) {
    const bytes = new Uint8Array(2);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, value, true);
    return bytes;
  }

  function uint32(value) {
    const bytes = new Uint8Array(4);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, value >>> 0, true);
    return bytes;
  }

  function concat(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    parts.forEach(part => {
      output.set(part, offset);
      offset += part.length;
    });
    return output;
  }

  function normalizeBytes(content) {
    if (content == null) return new Uint8Array();
    if (content instanceof Uint8Array) return content;
    if (content instanceof ArrayBuffer) return new Uint8Array(content);
    return encoder.encode(String(content));
  }

  function createZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    entries.forEach(entry => {
      const name = entry.name.replace(/\\/g, '/');
      const nameBytes = encoder.encode(name);
      const data = entry.directory ? new Uint8Array() : normalizeBytes(entry.content);
      const crc = entry.directory ? 0 : UAT.crc32(data);
      const dt = dosDateTime(entry.date || new Date());
      const externalAttributes = entry.directory ? 0x10 : 0;

      const localHeader = concat([
        uint32(0x04034b50),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(dt.time),
        uint16(dt.date),
        uint32(crc),
        uint32(data.length),
        uint32(data.length),
        uint16(nameBytes.length),
        uint16(0),
        nameBytes
      ]);

      localParts.push(localHeader, data);

      const centralHeader = concat([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(dt.time),
        uint16(dt.date),
        uint32(crc),
        uint32(data.length),
        uint32(data.length),
        uint16(nameBytes.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(externalAttributes),
        uint32(offset),
        nameBytes
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length + data.length;
    });

    const centralDirectory = concat(centralParts);
    const localData = concat(localParts);
    const end = concat([
      uint32(0x06054b50),
      uint16(0),
      uint16(0),
      uint16(entries.length),
      uint16(entries.length),
      uint32(centralDirectory.length),
      uint32(localData.length),
      uint16(0)
    ]);

    return new Blob([localData, centralDirectory, end], { type: 'application/zip' });
  }

  UAT.zip = { createZip };
}());
