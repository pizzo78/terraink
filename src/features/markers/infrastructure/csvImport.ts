import { MAX_MARKERS } from "@/features/markers/domain/constants";

export interface MarkerCsvRow {
  label: string;
  lat: number;
  lon: number;
}

export interface MarkerCsvImportResult {
  markers: MarkerCsvRow[];
  skippedRows: number;
}

interface ParseMarkerCsvOptions {
  maxMarkers?: number;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && isQuoted && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (char === "," && !isQuoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function getHeaderIndex(header: string[], names: string[]): number {
  return header.findIndex((cell) =>
    names.includes(cell.trim().toLowerCase().replace(/\s+/g, "")),
  );
}

export function parseMarkerCsv(
  text: string,
  options: ParseMarkerCsvOptions = {},
): MarkerCsvImportResult {
  const maxMarkers = Math.max(
    0,
    Math.min(Math.round(options.maxMarkers ?? MAX_MARKERS), MAX_MARKERS),
  );
  const rows = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);

  if (rows.length === 0) {
    return { markers: [], skippedRows: 0 };
  }

  const firstRow = rows[0];
  const latHeaderIndex = getHeaderIndex(firstRow, ["lat", "latitude"]);
  const lonHeaderIndex = getHeaderIndex(firstRow, ["lon", "lng", "longitude"]);
  const labelHeaderIndex = getHeaderIndex(firstRow, ["label", "name", "title"]);
  const hasHeader = latHeaderIndex >= 0 && lonHeaderIndex >= 0;
  const hasLabelColumn = hasHeader || firstRow.length >= 3;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const latIndex = hasHeader ? latHeaderIndex : hasLabelColumn ? 1 : 0;
  const lonIndex = hasHeader ? lonHeaderIndex : hasLabelColumn ? 2 : 1;
  const labelIndex = hasHeader ? labelHeaderIndex : hasLabelColumn ? 0 : -1;
  const markers: MarkerCsvRow[] = [];
  let skippedRows = 0;

  for (const row of dataRows) {
    if (markers.length >= maxMarkers) {
      skippedRows += 1;
      continue;
    }

    const lat = Number(row[latIndex]);
    const lon = Number(row[lonIndex]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      skippedRows += 1;
      continue;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      skippedRows += 1;
      continue;
    }

    const label = labelIndex >= 0 ? String(row[labelIndex] ?? "").trim() : "";
    markers.push({
      label,
      lat,
      lon,
    });
  }

  return { markers, skippedRows };
}
