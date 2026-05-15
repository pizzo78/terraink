import { useExport } from "@/features/export/application/useExport";
import { MAX_MARKERS } from "@/features/markers/domain/constants";
import { createMarkerItem } from "@/features/markers/infrastructure/helpers";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import {
  ArchiveIcon,
  CheckIcon,
  EyeIcon,
  PackageIcon,
  RotateLeftIcon,
  RotateRightIcon,
} from "@/shared/ui/Icons";

export default function StudioSidebarActions() {
  const { state, dispatch, mapRef } = usePosterContext();
  const { exportPosterPack, isExporting } = useExport();

  const addRouteWaypoint = () => {
    if (state.markers.length >= MAX_MARKERS) {
      dispatch({ type: "SET_ERROR", error: `Maximum ${MAX_MARKERS} markers reached.` });
      return;
    }

    const center = mapRef.current?.getCenter();
    const fallbackLat = Number(state.form.latitude);
    const fallbackLon = Number(state.form.longitude);
    const lat = center?.lat ?? (Number.isFinite(fallbackLat) ? fallbackLat : 0);
    const lon = center?.lng ?? (Number.isFinite(fallbackLon) ? fallbackLon : 0);
    dispatch({
      type: "ADD_MARKER",
      marker: createMarkerItem({
        lat,
        lon,
        defaults: state.markerDefaults,
        label: `Waypoint ${state.markers.length + 1}`,
      }),
    });
  };

  return (
    <div className="desktop-sidebar-actions" aria-label="Quick poster tools">
      <button
        type="button"
        className="desktop-sidebar-action"
        onClick={() => dispatch({ type: "UNDO" })}
        disabled={state.history.length === 0}
        aria-label="Undo"
        title="Undo"
      >
        <RotateLeftIcon />
        <span>Undo</span>
      </button>
      <button
        type="button"
        className="desktop-sidebar-action"
        onClick={() => dispatch({ type: "REDO" })}
        disabled={state.future.length === 0}
        aria-label="Redo"
        title="Redo"
      >
        <RotateRightIcon />
        <span>Redo</span>
      </button>
      <button
        type="button"
        className="desktop-sidebar-action"
        onClick={addRouteWaypoint}
        disabled={state.markers.length >= MAX_MARKERS}
        aria-label="Add route waypoint"
        title="Add route waypoint"
      >
        <ArchiveIcon />
        <span>Point</span>
      </button>
      <button
        type="button"
        className="desktop-sidebar-action"
        onClick={() =>
          dispatch({
            type: "SET_FIELD",
            name: "showRoute",
            value: !state.form.showRoute,
          })
        }
        disabled={state.markers.length < 2}
        aria-label={state.form.showRoute ? "Hide route" : "Show route"}
        title={state.form.showRoute ? "Hide route" : "Show route"}
      >
        <CheckIcon />
        <span>Route</span>
      </button>
      <button
        type="button"
        className={`desktop-sidebar-action${
          state.previewMode === "wall" ? " is-active" : ""
        }`}
        onClick={() =>
          dispatch({
            type: "SET_PREVIEW_MODE",
            mode: state.previewMode === "wall" ? "poster" : "wall",
          })
        }
        aria-label={
          state.previewMode === "wall" ? "Show poster preview" : "Show wall mockup"
        }
        title={
          state.previewMode === "wall" ? "Show poster preview" : "Show wall mockup"
        }
      >
        <EyeIcon />
        <span>Mock</span>
      </button>
      <button
        type="button"
        className="desktop-sidebar-action desktop-sidebar-action--pack"
        onClick={() => void exportPosterPack()}
        disabled={isExporting}
        aria-label="Download print pack zip"
        title="Download print pack zip"
      >
        <PackageIcon />
        <span>{isExporting ? "Zip" : "Pack"}</span>
      </button>
    </div>
  );
}
