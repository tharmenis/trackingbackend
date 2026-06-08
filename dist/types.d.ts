export interface GeoPosition {
    lat: number;
    lng: number;
}
export declare enum VehicleStatus {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE"
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
export type AlarmSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
export type AlarmStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CLOSED" | string;
export interface Alarm {
    id: string;
    severity: AlarmSeverity;
    status: AlarmStatus;
    title: string;
    description: string | null;
    assignedUserId: string | null;
    raw: Record<string, unknown>;
}
