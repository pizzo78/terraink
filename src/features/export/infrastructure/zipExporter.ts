export interface ZipEntry {
  name: string;
  blob: Blob;
}

const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZIP_VERSION = 20;
const UTF8_FLAG = 0x0800;

const crcTable = new Uint32Array(256);
for (let i = 0; i < crcTable.length; i += 1) {
  let value = i;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[i] = value >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16LE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32LE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function createDosTimestamp(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export async function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  const encoder = new TextEncoder();
  const timestamp = createDosTimestamp(new Date());
  const fileRecords: {
    nameBytes: Uint8Array;
    bytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];
  const chunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name.replace(/\\/g, "/"));
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(bytes);
    const localHeader = new Uint8Array(30 + nameBytes.byteLength);

    writeUint32LE(localHeader, 0, ZIP_LOCAL_FILE_HEADER);
    writeUint16LE(localHeader, 4, ZIP_VERSION);
    writeUint16LE(localHeader, 6, UTF8_FLAG);
    writeUint16LE(localHeader, 8, 0);
    writeUint16LE(localHeader, 10, timestamp.time);
    writeUint16LE(localHeader, 12, timestamp.date);
    writeUint32LE(localHeader, 14, crc);
    writeUint32LE(localHeader, 18, bytes.byteLength);
    writeUint32LE(localHeader, 22, bytes.byteLength);
    writeUint16LE(localHeader, 26, nameBytes.byteLength);
    writeUint16LE(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);

    fileRecords.push({ nameBytes, bytes, crc, offset });
    chunks.push(localHeader, bytes);
    offset += localHeader.byteLength + bytes.byteLength;
  }

  const centralDirectoryOffset = offset;

  for (const record of fileRecords) {
    const centralHeader = new Uint8Array(46 + record.nameBytes.byteLength);
    writeUint32LE(centralHeader, 0, ZIP_CENTRAL_DIRECTORY_HEADER);
    writeUint16LE(centralHeader, 4, ZIP_VERSION);
    writeUint16LE(centralHeader, 6, ZIP_VERSION);
    writeUint16LE(centralHeader, 8, UTF8_FLAG);
    writeUint16LE(centralHeader, 10, 0);
    writeUint16LE(centralHeader, 12, timestamp.time);
    writeUint16LE(centralHeader, 14, timestamp.date);
    writeUint32LE(centralHeader, 16, record.crc);
    writeUint32LE(centralHeader, 20, record.bytes.byteLength);
    writeUint32LE(centralHeader, 24, record.bytes.byteLength);
    writeUint16LE(centralHeader, 28, record.nameBytes.byteLength);
    writeUint16LE(centralHeader, 30, 0);
    writeUint16LE(centralHeader, 32, 0);
    writeUint16LE(centralHeader, 34, 0);
    writeUint16LE(centralHeader, 36, 0);
    writeUint32LE(centralHeader, 38, 0);
    writeUint32LE(centralHeader, 42, record.offset);
    centralHeader.set(record.nameBytes, 46);
    chunks.push(centralHeader);
    offset += centralHeader.byteLength;
  }

  const centralDirectorySize = offset - centralDirectoryOffset;
  const endHeader = new Uint8Array(22);
  writeUint32LE(endHeader, 0, ZIP_END_OF_CENTRAL_DIRECTORY);
  writeUint16LE(endHeader, 4, 0);
  writeUint16LE(endHeader, 6, 0);
  writeUint16LE(endHeader, 8, fileRecords.length);
  writeUint16LE(endHeader, 10, fileRecords.length);
  writeUint32LE(endHeader, 12, centralDirectorySize);
  writeUint32LE(endHeader, 16, centralDirectoryOffset);
  writeUint16LE(endHeader, 20, 0);
  chunks.push(endHeader);

  const output = concatChunks(chunks);
  const bytes = output.buffer.slice(
    output.byteOffset,
    output.byteOffset + output.byteLength,
  ) as ArrayBuffer;
  return new Blob([bytes], { type: "application/zip" });
}
