/**
 * Predefined locations for the Ropar area used as quick-pick shortcuts
 * in the ride search / publish flow.
 *
 * To add a new location, simply append an entry to the LOCATIONS array.
 * No changes are required in any component.
 *
 * Schema per entry:
 *   id        – unique snake_case identifier (used as React key)
 *   name      – human-readable display name
 *   latitude  – WGS-84 latitude
 *   longitude – WGS-84 longitude
 *
 * The IIT Ropar Main Gate entry also doubles as the default map center
 * (see MAP_DEFAULTS below).
 */

const LOCATIONS = [
  {
    id: "iit_ropar_main_gate",
    name: "IIT Ropar Main Gate",
    latitude: 30.9687,
    longitude: 76.4731,
  },
  {
    id: "ropar_bus_stand",
    name: "Ropar Bus Stand",
    latitude: 30.9695,
    longitude: 76.5250,
  },
  {
    id: "ropar_railway_station",
    name: "Ropar Railway Station",
    latitude: 30.9716,
    longitude: 76.5326,
  },
  {
    id: "bela_chowk",
    name: "Bela Chowk",
    latitude: 30.9660,
    longitude: 76.5100,
  },
  {
    id: "ropar_headworks",
    name: "Ropar Headworks",
    latitude: 30.9755,
    longitude: 76.5267,
  },
  {
    id: "anandpur_sahib",
    name: "Anandpur Sahib",
    latitude: 31.2320,
    longitude: 76.4975,
  },
  {
    id: "morinda",
    name: "Morinda",
    latitude: 30.7970,
    longitude: 76.4928,
  },
  {
    id: "chandigarh_isbt",
    name: "Chandigarh ISBT",
    latitude: 30.7383,
    longitude: 76.7909,
  },
  {
    id: "chandigarh_railway_station",
    name: "Chandigarh Railway Station",
    latitude: 30.7058,
    longitude: 76.8027,
  },
  {
    id: "patiala_bus_stand",
    name: "Patiala Bus Stand",
    latitude: 30.3398,
    longitude: 76.3869,
  },
  {
    id: "beas_hostel",
    name: "Beas Hostel",
    latitude: 30.969245,
    longitude: 76.466812,
  },
  {
    id: "satluj_hostel",
    name: "Satluj Hostel",
    latitude: 30.969538,
    longitude: 76.468386,
  },
  {
    id: "chenab_hostel",
    name: "Chenab Hostel",
    latitude: 30.969239,
    longitude: 76.465780,
  },
  {
    id: "brahmaputra_boys_hostel",
    name: "Brahmaputra Boys Hostel",
    latitude: 30.967445,
    longitude: 76.467305,
  },
  {
    id: "raavi_hostel",
    name: "Raavi Hostel",
    latitude: 30.967299,
    longitude: 76.469720,
  },
  {
    id: "brahmaputra_girls_hostel",
    name: "Brahmaputra Girls Hostel",
    latitude: 30.967445,
    longitude: 76.467305,
  },
  {
    id: "t6_hostel",
    name: "T-6 Hostel",
    latitude: 30.967412,
    longitude: 76.473382,
  },
  {
    id: "util",
    name: "Utility Block",
    latitude: 30.967834,
    longitude: 76.469703,
  },
];

export default LOCATIONS;

// ─── Normalised shape (lat/lng keys) consumed by Leaflet-based components ────
// Components can import PRESET_LOCATIONS directly; the shape mirrors what the
// external Photon/Nominatim autocomplete returns so that handleSelect() works
// uniformly for both.
export const PRESET_LOCATIONS = LOCATIONS.map((loc) => ({
  id: loc.id,
  name: loc.name,
  lat: loc.latitude,
  lng: loc.longitude,
}));

// ─── Default map viewport (IIT Ropar) ────────────────────────────────────────
export const MAP_DEFAULTS = {
  center: [LOCATIONS[0].latitude, LOCATIONS[0].longitude], // [30.9687, 76.4731]
  zoom: 14,
};
