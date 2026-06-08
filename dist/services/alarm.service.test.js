import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { AlarmService } from "./alarm.service.js";
vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        default: {
            ...actual.default,
            get: vi.fn(),
            put: vi.fn(),
        },
    };
});
const mockedAxios = vi.mocked(axios);
describe("AlarmService", () => {
    const config = {
        openRemoteUrl: "https://openremote.example.com",
        realm: "test-realm",
    };
    const authService = {
        getToken: vi.fn(),
    };
    beforeEach(() => {
        vi.clearAllMocks();
        authService.getToken.mockResolvedValue("token-123");
    });
    it("should acknowledge alarms using the documented update endpoint", async () => {
        mockedAxios.put.mockResolvedValueOnce({ data: { ok: true } });
        const service = new AlarmService(authService, config);
        await service.acknowledgeAlarm("208696");
        expect(mockedAxios.put).toHaveBeenCalledWith("https://openremote.example.com/api/test-realm/alarm/208696", { status: "ACKNOWLEDGED" }, {
            headers: { Authorization: "Bearer token-123" },
        });
    });
    it("should resolve alarms using the documented update endpoint", async () => {
        mockedAxios.put.mockResolvedValueOnce({ data: { ok: true } });
        const service = new AlarmService(authService, config);
        await service.resolveAlarm("208696");
        expect(mockedAxios.put).toHaveBeenCalledWith("https://openremote.example.com/api/test-realm/alarm/208696", { status: "RESOLVED" }, {
            headers: { Authorization: "Bearer token-123" },
        });
    });
});
