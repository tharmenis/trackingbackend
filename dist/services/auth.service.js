import axios from "axios";
export class AuthService {
    constructor(config) {
        this.tokenData = null;
        this.openRemoteUrl =
            config?.openRemoteUrl || process.env.OPENREMOTE_URL || "";
        this.realm = config?.realm || process.env.OPENREMOTE_REALM || "";
        this.clientId = config?.clientId || process.env.CLIENT_ID || "";
        this.clientSecret = config?.clientSecret || process.env.CLIENT_SECRET || "";
    }
    async getToken() {
        if (this.tokenData && !this.isExpired(this.tokenData)) {
            return this.tokenData.accessToken;
        }
        return this.refreshToken();
    }
    isExpired(tokenData) {
        // Consider expired 30 seconds before actual expiry to avoid edge cases
        return Date.now() >= tokenData.expiresAt - 30000;
    }
    async refreshToken() {
        const tokenUrl = `${this.openRemoteUrl}/auth/realms/${this.realm}/protocol/openid-connect/token`;
        try {
            const params = new URLSearchParams({
                grant_type: "client_credentials",
                client_id: this.clientId,
                client_secret: this.clientSecret,
            });
            const response = await axios.post(tokenUrl, params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            const { access_token, expires_in } = response.data;
            this.tokenData = {
                accessToken: access_token,
                expiresAt: Date.now() + expires_in * 1000,
            };
            return access_token;
        }
        catch (error) {
            const message = this.buildErrorMessage(error);
            throw new Error(message);
        }
    }
    buildErrorMessage(error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.error_description ||
                    error.response.data?.error ||
                    error.response.statusText;
                return `Authentication failed (HTTP ${status}): ${detail}`;
            }
            if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
                return `Authentication failed (network error): Unable to reach OpenRemote at ${this.openRemoteUrl}`;
            }
            return `Authentication failed (network error): ${error.message}`;
        }
        return `Authentication failed: ${String(error)}`;
    }
}
