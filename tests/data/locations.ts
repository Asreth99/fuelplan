export type GeoLocation = {
  name: string;
  city: string;
  latitude: number;
  longitude: number;
};

// A Google place icon on the map as it first opens (centred on Budapest, zoom 15),
// given as an offset in px from the centre of the map.
export const CHAIN_BRIDGE_ICON = {
  name: "Széchenyi Chain Bridge",
  offsetFromMapCentre: { x: 79, y: -51 },
};

// The zoom level the app uses after Find my location (street level).
export const LOCATED_ZOOM = 16;

// Far enough from the default map centre (Budapest) that the marker is only in view if the map jumped.
export const DEBRECEN_CENTRE: GeoLocation = {
  name: "Debrecen city centre",
  city: "Debrecen",
  latitude: 47.5316,
  longitude: 21.6273,
};
