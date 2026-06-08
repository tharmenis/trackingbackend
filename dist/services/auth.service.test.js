import { describe, it, expect, vi, beforeEach } from "vitest";
import axios, { AxiosError } from "axios";
import { AuthService } from "./auth.service.js";
vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        default: {
            ...actual.default,
            post: vi.fn(),
            isAxiosError: actual.default.isAxiosError,
        },
    };
});
const mockedAxios = vi.mocked(axios);
describe("AuthService", () => {
    const config = {
        openRemoteUrl: "https://openremote.example.com",
        realm: "test-realm",
        clientId: "test-client",
        clientSecret: "test-secret",
    };
    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });
    it("should fetch a token from the Keycloak endpoint", async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                access_token: "abc123",
                expires_in: 300,
                token_type: "Bearer",
            },
        });
        const service = new AuthService(config);
        const token = await service.getToken();
        expect(token).toBe("abc123");
        expect(mockedAxios.post).toHaveBeenCalledWith("https://openremote.example.com/auth/realms/test-realm/protocol/openid-connect/token", expect.any(URLSearchParams), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    });
    it("should return cached token on subsequent calls", async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                access_token: "abc123",
                expires_in: 300,
                token_type: "Bearer",
            },
        });
        const service = new AuthService(config);
        await service.getToken();
        const token2 = await service.getToken();
        expect(token2).toBe("abc123");
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
    it("should refresh token when expired", async () => {
        mockedAxios.post
            .mockResolvedValueOnce({
            data: { access_token: "token1", expires_in: 0, token_type: "Bearer" },
        })
            .mockResolvedValueOnce({
            data: { access_token: "token2", expires_in: 300, token_type: "Bearer" },
        });
        const service = new AuthService(config);
        // First call gets token1 (immediately expired since expires_in=0)
        const t1 = await service.getToken();
        expect(t1).toBe("token1");
        // Second call should refresh since token is expired
        const t2 = await service.getToken();
        expect(t2).toBe("token2");
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
    it("should throw descriptive error on auth failure", async () => {
        const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
            status: 401,
            statusText: "Unauthorized",
            data: { error_description: "Invalid client credentials" },
            headers: {},
            config: {},
        });
        mockedAxios.post.mockRejectedValueOnce(error);
        const service = new AuthService(config);
        await expect(service.getToken()).rejects.toThrow("Authentication failed (HTTP 401): Invalid client credentials");
    });
});
