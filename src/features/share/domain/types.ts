export interface SharedPosterForm {
  location?: string;
  latitude?: string;
  longitude?: string;
  distance?: string;
  width?: string;
  height?: string;
  theme?: string;
  layout?: string;
  displayCity?: string;
  displayCountry?: string;
  displayContinent?: string;
  fontFamily?: string;
  showPosterText?: boolean;
  includeCredits?: boolean;
  includeLandcover?: boolean;
  includeBuildings?: boolean;
  includeWater?: boolean;
  includeParks?: boolean;
  includeAeroway?: boolean;
  includeRail?: boolean;
  includeRoads?: boolean;
  includeRoadPath?: boolean;
  includeRoadMinorLow?: boolean;
  includeRoadOutline?: boolean;
  showMarkers?: boolean;
}

export interface SharedMarker {
  lat: number;
  lon: number;
  iconId: string;
  size: number;
  color: string;
}

export interface SharedMarkerDefaults {
  size?: number;
  color?: string;
}

export interface SharedPosterPayload {
  version: 1;
  form?: SharedPosterForm;
  customColors?: Record<string, string>;
  markerDefaults?: SharedMarkerDefaults;
  markers?: SharedMarker[];
}
