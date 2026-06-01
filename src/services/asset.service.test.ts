import { describe, it, expect } from "vitest";
import { parseAsset, OpenRemoteAsset } from "./asset.service.js";
import { VehicleStatus } from "../types.js";

describe("parseAsset", () => {
  const NOW = 1700000000000;

  function makeAsset(overrides: Partial<OpenRemoteAsset> = {}): OpenRemoteAsset {
    return {
      id: "vehicle-1",
      name: "Truck A",
      type: "CarAsset",
      realm: "test-realm",
      attributes: {
        location: {
          value: { type: "Point", coordinates: [4.9041, 52.3676] },
          timestamp: NOW - 60_000,
          type: "GEO_JSON_POINT",
        },
        speed: { value: 65.5, timestamp: NOW - 60_000, type: "NUMBER" },
        direction: { value: 180, timestamp: NOW - 60_000, type: "NUMBER" },
      },
      ...overrides,
    };
  }

  it("should parse a valid asset with all fields", () => {
    const result = parseAsset(makeAsset(), NOW);

    expect(result).toEqual({
      id: "vehicle-1",
      name: "Truck A",
      type: "CarAsset",
      location: { lat: 52.3676, lng: 4.9041 },
      speed: 65.5,
      heading: 180,
      status: VehicleStatus.ONLINE,
      lastUpdated: NOW - 60_000,
    });
  });

  it("should return null location when location attribute is missing", () => {
    const asset = makeAsset({ attributes: {} });
    const result = parseAsset(asset, NOW);
    expect(result.location).toBeNull();
  });

  it("should determine OFFLINE status when timestamp is old", () => {
    const oldTimestamp = NOW - 10 * 60 * 1000; // 10 minutes ago
    const asset = makeAsset({
      attributes: {
        location: {
          value: { type: "Point", coordinates: [0, 0] },
          timestamp: oldTimestamp,
          type: "GEO_JSON_POINT",
        },
      },
    });
    const result = parseAsset(asset, NOW);
    expect(result.status).toBe(VehicleStatus.OFFLINE);
  });

  it("should use heading attribute if direction is not present", () => {
    const asset = makeAsset({
      attributes: {
        heading: { value: 90, timestamp: NOW, type: "NUMBER" },
      },
    });
    const result = parseAsset(asset, NOW);
    expect(result.heading).toBe(90);
  });

  it("should return null speed when speed attribute is missing", () => {
    const asset = makeAsset({ attributes: {} });
    const result = parseAsset(asset, NOW);
    expect(result.speed).toBeNull();
  });
});
