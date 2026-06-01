import axios from "axios";
import { VehicleAsset, VehicleStatus, GeoPosition } from "../types.js";
import { AuthService } from "./auth.service.js";

/** Threshold in ms — if last update is older than this, vehicle is offline */
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export interface OpenRemoteAsset {
  id: string;
  name: string;
  type: string;
  realm: string;
  attributes: Record<string, { value: unknown; timestamp: number; type: string }>;
}

/**
 * Parse a single OpenRemote asset JSON object into our VehicleAsset model.
 */
export function parseAsset(asset: OpenRemoteAsset, now: number = Date.now()): VehicleAsset {
  const location = extractLocation(asset.attributes?.location);
  const speed = extractNumber(asset.attributes?.speed);
  const heading = extractNumber(asset.attributes?.direction ?? asset.attributes?.heading);
  const lastUpdated = extractTimestamp(asset.attributes);
  const status = determineStatus(lastUpdated, now);

  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    location,
    speed,
    heading,
    status,
    lastUpdated,
  };
}

function extractLocation(attr: { value: unknown } | undefined): GeoPosition | null {
  if (!attr || !attr.value) return null;
  const val = attr.value as Record<string, unknown>;

  // GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
  if (val.type === "Point" && Array.isArray(val.coordinates) && val.coordinates.length >= 2) {
    const [lng, lat] = val.coordinates as number[];
    if (typeof lat === "number" && typeof lng === "number" && isFinite(lat) && isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

function extractNumber(attr: { value: unknown } | undefined): number | null {
  if (!attr || attr.value == null) return null;
  const num = Number(attr.value);
  return isFinite(num) ? num : null;
}

function extractTimestamp(attributes: Record<string, { timestamp: number }> | undefined): number {
  if (!attributes) return 0;
  let latest = 0;
  for (const key of Object.keys(attributes)) {
    const ts = attributes[key]?.timestamp;
    if (typeof ts === "number" && ts > latest) {
      latest = ts;
    }
  }
  return latest;
}

function determineStatus(lastUpdated: number, now: number): VehicleStatus {
  if (lastUpdated === 0) return VehicleStatus.OFFLINE;
  return now - lastUpdated <= OFFLINE_THRESHOLD_MS ? VehicleStatus.ONLINE : VehicleStatus.OFFLINE;
}

/**
 * Service that queries OpenRemote 
 * for vehicle assets via the backend proxy pattern.
 */
export class AssetService {
  private readonly authService: AuthService;
  private readonly openRemoteUrl: string;
  private readonly realm: string;

  constructor(authService: AuthService, config?: { openRemoteUrl: string; realm: string }) {
    this.authService = authService;
    this.openRemoteUrl = config?.openRemoteUrl || process.env.OPENREMOTE_URL || "";
    this.realm = config?.realm || process.env.OPENREMOTE_REALM || "";
  }

  async fetchVehicles(): Promise<VehicleAsset[]> {
    const token = await this.authService.getToken();
    const url = `${this.openRemoteUrl}/api/${this.realm}/asset/query`;

    const response = await axios.post<OpenRemoteAsset[]>(
      url,
      {
        types: ["ThingAsset", "CarAsset", "VehicleAsset"],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const now = Date.now();
    return response.data.map((asset) => parseAsset(asset, now));
  }
}
