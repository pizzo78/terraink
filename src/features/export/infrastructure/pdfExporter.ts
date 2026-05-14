import type { ExportOptions } from "../domain/types";

const PT_PER_MM = 72 / 25.4;
const MM_PER_CM = 10;

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function normalizePositiveNumber(value: number, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeNonNegativeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function mmToPt(valueMm: number): number {
  return valueMm * PT_PER_MM;
}

function cmToPt(valueCm: number): number {
  return mmToPt(valueCm * MM_PER_CM);
}

function formatPdfNumber(value: number): string {
  const rounded = Number(value.toFixed(3));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function formatPdfBox(
  left: number,
  bottom: number,
  right: number,
  top: number,
): string {
  return `[${formatPdfNumber(left)} ${formatPdfNumber(bottom)} ${formatPdfNumber(right)} ${formatPdfNumber(top)}]`;
}

function buildCropMarkCommands(options: {
  trimLeft: number;
  trimBottom: number;
  trimRight: number;
  trimTop: number;
}): string[] {
  const markLength = mmToPt(5);
  const markGap = mmToPt(2);
  const { trimLeft, trimBottom, trimRight, trimTop } = options;
  const commands = [
    "q",
    "0 0 0 RG",
    "0.35 w",
    `${formatPdfNumber(trimLeft - markGap - markLength)} ${formatPdfNumber(trimBottom)} m ${formatPdfNumber(trimLeft - markGap)} ${formatPdfNumber(trimBottom)} l`,
    `${formatPdfNumber(trimLeft)} ${formatPdfNumber(trimBottom - markGap - markLength)} m ${formatPdfNumber(trimLeft)} ${formatPdfNumber(trimBottom - markGap)} l`,
    `${formatPdfNumber(trimRight + markGap)} ${formatPdfNumber(trimBottom)} m ${formatPdfNumber(trimRight + markGap + markLength)} ${formatPdfNumber(trimBottom)} l`,
    `${formatPdfNumber(trimRight)} ${formatPdfNumber(trimBottom - markGap - markLength)} m ${formatPdfNumber(trimRight)} ${formatPdfNumber(trimBottom - markGap)} l`,
    `${formatPdfNumber(trimLeft - markGap - markLength)} ${formatPdfNumber(trimTop)} m ${formatPdfNumber(trimLeft - markGap)} ${formatPdfNumber(trimTop)} l`,
    `${formatPdfNumber(trimLeft)} ${formatPdfNumber(trimTop + markGap)} m ${formatPdfNumber(trimLeft)} ${formatPdfNumber(trimTop + markGap + markLength)} l`,
    `${formatPdfNumber(trimRight + markGap)} ${formatPdfNumber(trimTop)} m ${formatPdfNumber(trimRight + markGap + markLength)} ${formatPdfNumber(trimTop)} l`,
    `${formatPdfNumber(trimRight)} ${formatPdfNumber(trimTop + markGap)} m ${formatPdfNumber(trimRight)} ${formatPdfNumber(trimTop + markGap + markLength)} l`,
    "S",
    "Q",
  ];
  return commands;
}

export function createPdfBlobFromCanvas(
  canvas: HTMLCanvasElement,
  options: Partial<ExportOptions> = {},
): Blob {
  const imageWidth = Math.max(1, Math.round(Number(canvas?.width) || 1));
  const imageHeight = Math.max(1, Math.round(Number(canvas?.height) || 1));
  const widthCm = normalizePositiveNumber(options.widthCm ?? 20, 20);
  const heightCm = normalizePositiveNumber(options.heightCm ?? 30, 30);
  const marginMm = normalizeNonNegativeNumber(options.marginMm, 0);
  const bleedMm = normalizeNonNegativeNumber(options.bleedMm, 0);
  const safeAreaMm = normalizeNonNegativeNumber(options.safeAreaMm, 0);
  const cropMarks = options.cropMarks ?? false;
  const markMarginMm = cropMarks ? 8 : 0;

  const posterWidthPt = cmToPt(widthCm);
  const posterHeightPt = cmToPt(heightCm);
  const marginPt = mmToPt(marginMm);
  const bleedPt = mmToPt(bleedMm);
  const safeAreaPt = mmToPt(safeAreaMm);
  const markMarginPt = mmToPt(markMarginMm);
  const trimWidthPt = posterWidthPt + marginPt * 2;
  const trimHeightPt = posterHeightPt + marginPt * 2;
  const pageInsetPt = bleedPt + markMarginPt;
  const pageWidthPt = trimWidthPt + pageInsetPt * 2;
  const pageHeightPt = trimHeightPt + pageInsetPt * 2;
  const trimLeft = pageInsetPt;
  const trimBottom = pageInsetPt;
  const trimRight = trimLeft + trimWidthPt;
  const trimTop = trimBottom + trimHeightPt;
  const bleedLeft = markMarginPt;
  const bleedBottom = markMarginPt;
  const bleedRight = pageWidthPt - markMarginPt;
  const bleedTop = pageHeightPt - markMarginPt;
  const artLeft = Math.min(trimRight, trimLeft + marginPt + safeAreaPt);
  const artBottom = Math.min(trimTop, trimBottom + marginPt + safeAreaPt);
  const artRight = Math.max(artLeft, trimRight - marginPt - safeAreaPt);
  const artTop = Math.max(artBottom, trimTop - marginPt - safeAreaPt);
  const drawFullBleed = bleedMm > 0 && marginMm === 0;
  const imageX = drawFullBleed ? bleedLeft : trimLeft + marginPt;
  const imageY = drawFullBleed ? bleedBottom : trimBottom + marginPt;
  const imageDrawWidth = drawFullBleed ? bleedRight - bleedLeft : posterWidthPt;
  const imageDrawHeight = drawFullBleed ? bleedTop - bleedBottom : posterHeightPt;

  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.94);
  const base64 = jpegDataUrl.split(",")[1] || "";
  const imageBytes = base64ToBytes(base64);

  const contentStream = [
    "q",
    "1 1 1 rg",
    `0 0 ${formatPdfNumber(pageWidthPt)} ${formatPdfNumber(pageHeightPt)} re f`,
    "Q",
    "q",
    `${formatPdfNumber(imageDrawWidth)} 0 0 ${formatPdfNumber(imageDrawHeight)} ${formatPdfNumber(imageX)} ${formatPdfNumber(imageY)} cm`,
    "/Im0 Do",
    "Q",
    ...(cropMarks
      ? buildCropMarkCommands({ trimLeft, trimBottom, trimRight, trimTop })
      : []),
  ].join("\n");

  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(contentStream);
  const chunks: Uint8Array[] = [];
  const objectOffsets: number[] = [0];
  let byteLength = 0;

  function append(part: string | Uint8Array): void {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    chunks.push(bytes);
    byteLength += bytes.length;
  }

  function writeObject(
    objectId: number,
    dictionary: string,
    streamBytes: Uint8Array | null = null,
  ): void {
    objectOffsets[objectId] = byteLength;
    append(`${objectId} 0 obj\n`);
    if (streamBytes) {
      append(`${dictionary}\nstream\n`);
      append(streamBytes);
      append("\nendstream\nendobj\n");
      return;
    }
    append(`${dictionary}\nendobj\n`);
  }

  append("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  writeObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  writeObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox ${formatPdfBox(0, 0, pageWidthPt, pageHeightPt)} /TrimBox ${formatPdfBox(trimLeft, trimBottom, trimRight, trimTop)} /BleedBox ${formatPdfBox(bleedLeft, bleedBottom, bleedRight, bleedTop)} /ArtBox ${formatPdfBox(artLeft, artBottom, artRight, artTop)} /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );
  writeObject(
    4,
    `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>`,
    imageBytes,
  );
  writeObject(5, `<< /Length ${contentBytes.length} >>`, contentBytes);

  const xrefStart = byteLength;
  append("xref\n0 6\n");
  append("0000000000 65535 f \n");
  for (let objectId = 1; objectId <= 5; objectId += 1) {
    append(`${String(objectOffsets[objectId]).padStart(10, "0")} 00000 n \n`);
  }
  append("trailer\n<< /Size 6 /Root 1 0 R >>\n");
  append(`startxref\n${xrefStart}\n%%EOF`);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}
