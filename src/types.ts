export interface GeoPosition {
  lat: number;
  lng: number;
}

export enum VehicleStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
}

export interface VehicleAsset {
  id: string;
  name: string;
  type: string;
  location: GeoPosition | null;
  speed: number | null;
  heading: number | null;
  status: VehicleStatus;
  lastUpdated: number;
}
