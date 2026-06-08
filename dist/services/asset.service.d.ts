import { VehicleAsset } from "../types.js";
import { AuthService } from "./auth.service.js";
export interface OpenRemoteAsset {
    id: string;
    name: string;
    type: string;
    realm: string;
    attributes: Record<string, {
        value: unknown;
        timestamp: number;
        type: string;
    }>;
}
/**
 * Parse a single OpenRemote asset JSON object into our VehicleAsset model.
 */
export declare function parseAsset(asset: OpenRemoteAsset, now?: number): VehicleAsset;
/**
 * Service that queries OpenRemote
 * for vehicle assets via the backend proxy pattern.
 */
export declare class AssetService {
    private readonly authService;
    private readonly openRemoteUrl;
    private readonly realm;
    constructor(authService: AuthService, config?: {
        openRemoteUrl: string;
        realm: string;
    });
    fetchVehicles(): Promise<VehicleAsset[]>;
}
