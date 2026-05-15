import assert from "node:assert/strict";
import { normalizeExportSettings } from "../src/features/export/domain/types";
import { createFlatSvgBlobFromCanvas } from "../src/features/export/infrastructure/flatSvgExporter";
import { createZipBlob } from "../src/features/export/infrastructure/zipExporter";
import { parseMarkerCsv } from "../src/features/markers/infrastructure/csvImport";
import {
  MAX_MARKERS,
  MIN_MARKER_SIZE,
  MAX_MARKER_SIZE,
} from "../src/features/markers/domain/constants";
import {
  createPosterSnapshot,
  posterReducer,
  type PosterState,
} from "../src/features/poster/application/posterReducer";
import {
  createPosterShareUrl,
  readPosterSharePayload,
} from "../src/features/share/infrastructure/shareUrl";

function makeMarker(index: number) {
  return {
    id: `marker-${index}`,
    lat: 45 + index / 1000,
    lon: 9 + index / 1000,
    iconId: "pin",
    size: 36,
    color: "#ffffff",
  };
}

function makeState(markerCount = 0): PosterState {
  return {
    form: {
      location: "Milan, Italy",
      latitude: "45.464200",
      longitude: "9.190000",
      distance: "4000",
      width: "20",
      height: "30",
      theme: "midnight_blue",
      layout: "print_a4_portrait",
      displayCity: "Milan",
      displayCountry: "Italy",
      displayContinent: "Europe",
      fontFamily: "",
      showPosterText: true,
      showCoordinates: true,
      textScale: "100",
      includeCredits: false,
      includeLandcover: true,
      includeBuildings: false,
      includeWater: true,
      includeParks: true,
      includeAeroway: true,
      includeRail: true,
      includeRoads: true,
      includeRoadPath: true,
      includeRoadMinorLow: true,
      includeRoadOutline: true,
      showMarkers: true,
      showRoute: false,
    },
    customColors: {},
    markers: Array.from({ length: markerCount }, (_, index) => makeMarker(index)),
    customMarkerIcons: [],
    markerDefaults: { size: 36, color: "#ffffff" },
    exportSettings: normalizeExportSettings(null),
    history: [],
    future: [],
    seriesItems: [],
    previewMode: "poster",
    isMarkerEditorActive: false,
    activeMarkerId: null,
    error: "",
    isExporting: false,
    isLocationFocused: false,
    selectedLocation: null,
    userLocation: null,
    displayNameOverrides: {
      city: false,
      country: false,
    },
  };
}

{
  const state = makeState(0);
  const next = posterReducer(state, {
    type: "SET_FIELD",
    name: "displayCity",
    value: "Rome",
  });
  const undone = posterReducer(next, { type: "UNDO" });
  const redone = posterReducer(undone, { type: "REDO" });

  assert.equal(next.form.displayCity, "Rome");
  assert.equal(next.history.length, 1);
  assert.equal(undone.form.displayCity, "Milan");
  assert.equal(undone.future.length, 1);
  assert.equal(redone.form.displayCity, "Rome");
}

{
  const state = makeState(1);
  const snapshot = createPosterSnapshot({
    ...state,
    form: { ...state.form, displayCity: "Series Poster" },
    markers: [makeMarker(8), makeMarker(9)],
  });
  const next = posterReducer(state, {
    type: "APPLY_POSTER_SNAPSHOT",
    snapshot,
  });

  assert.equal(next.form.displayCity, "Series Poster");
  assert.equal(next.markers.length, 2);
  assert.equal(next.history.length, 1);
}

{
  const normalized = normalizeExportSettings({
    dpi: 999 as never,
    marginMm: 99,
    bleedMm: -4,
    safeAreaMm: 4.26,
    cropMarks: false,
  });

  assert.deepEqual(normalized, {
    dpi: 300,
    marginMm: 30,
    bleedMm: 0,
    safeAreaMm: 4.3,
    cropMarks: false,
  });
}

{
  const csv = [
    "label,lat,lon",
    "One,45.1,9.1",
    "Two,45.2,9.2",
    "Bad,200,9.3",
    "Three,45.3,9.3",
  ].join("\n");
  const result = parseMarkerCsv(csv, { maxMarkers: 2 });

  assert.equal(result.markers.length, 2);
  assert.equal(result.skippedRows, 2);
  assert.equal(result.markers[0]?.label, "One");
}

{
  const state = makeState(MAX_MARKERS);
  const next = posterReducer(state, {
    type: "ADD_MARKER",
    marker: makeMarker(999),
  });

  assert.equal(next.markers.length, MAX_MARKERS);
  assert.equal(next, state);
}

{
  const state = makeState(MAX_MARKERS - 2);
  const next = posterReducer(state, {
    type: "ADD_MARKERS",
    markers: [makeMarker(101), makeMarker(102), makeMarker(103)],
  });

  assert.equal(next.markers.length, MAX_MARKERS);
  assert.equal(next.markers.at(-1)?.id, "marker-102");
}

{
  const state = makeState(0);
  const next = posterReducer(state, {
    type: "UPDATE_MARKER",
    markerId: "marker-0",
    changes: { size: MAX_MARKER_SIZE + 100 },
  });

  assert.equal(next.markers.length, 0);
  assert.equal(MIN_MARKER_SIZE, 15);
}

{
  const payload = {
    version: 1,
    form: {
      location: "Roma",
      displayCity: "Roma",
      displayCountry: "Italia",
      includeCredits: false,
    },
    markers: [{ lat: 41.9028, lon: 12.4964, iconId: "pin", size: 36, color: "#ffffff" }],
  } as const;
  const url = createPosterShareUrl(payload, "https://posterengine.test/app?x=1#top");

  assert.equal(new URL(url).searchParams.get("x"), "1");
  assert.deepEqual(readPosterSharePayload(url), payload);
  assert.equal(readPosterSharePayload("https://posterengine.test/?poster=not-valid"), null);
}

{
  const canvas = {
    width: 120,
    height: 80,
    toDataURL: () => 'data:image/png;base64,a"b<c&d',
  } as HTMLCanvasElement;
  const svg = await createFlatSvgBlobFromCanvas(canvas).text();

  assert.match(svg, /<svg /);
  assert.match(svg, /width="120"/);
  assert.match(svg, /height="80"/);
  assert.match(svg, /a&quot;b&lt;c&amp;d/);
}

{
  const zip = await createZipBlob([
    { name: "print.pdf", blob: new Blob(["pdf-data"]) },
    { name: "preview.png", blob: new Blob(["png-data"]) },
  ]);
  const bytes = new Uint8Array(await zip.arrayBuffer());
  const text = new TextDecoder().decode(bytes);

  assert.equal(zip.type, "application/zip");
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.equal(bytes[2], 0x03);
  assert.equal(bytes[3], 0x04);
  assert.match(text, /print\.pdf/);
  assert.match(text, /preview\.png/);
}
