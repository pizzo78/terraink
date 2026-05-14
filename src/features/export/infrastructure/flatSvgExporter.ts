function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function createFlatSvgBlobFromCanvas(canvas: HTMLCanvasElement): Blob {
  const width = Math.max(1, Math.round(Number(canvas?.width) || 1));
  const height = Math.max(1, Math.round(Number(canvas?.height) || 1));
  const dataUrl = canvas.toDataURL("image/png");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="${escapeXmlAttribute(dataUrl)}" width="${width}" height="${height}" preserveAspectRatio="none" />
</svg>`;

  return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
}
