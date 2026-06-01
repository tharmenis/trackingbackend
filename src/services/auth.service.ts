import axios from "axios";

interface TokenData {
  accessToken: string;
  expiresAt: number; // epoch ms
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class AuthService {
  private tokenData: TokenData | null = null;
  private readonly openRemoteUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config?: {
    openRemoteUrl: string;
    realm: string;
    clientId: string;
    clientSecret: string;
  }) {
    this.openRemoteUrl =
      config?.openRemoteUrl || process.env.OPENREMOTE_URL || "";
    this.realm = config?.realm || process.env.OPENREMOTE_REALM || "";
    this.clientId = config?.clientId || process.env.CLIENT_ID || "";
    this.clientSecret = config?.clientSecret || process.env.CLIENT_SECRET || "";
  }

  async getToken(): Promise<string> {
    if (this.tokenData && !this.isExpired(this.tokenData)) {
      return this.tokenData.accessToken;
    }

    return this.refreshToken();
  }

  private isExpired(tokenData: TokenData): boolean {
    // Consider expired 30 seconds before actual expiry to avoid edge cases
    return Date.now() >= tokenData.expiresAt - 30_000;
  }

  private async refreshToken(): Promise<string> {
    const tokenUrl = `${this.openRemoteUrl}/auth/realms/${this.realm}/protocol/openid-connect/token`;

    try {
      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await axios.post<TokenResponse>(tokenUrl, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, expires_in } = response.data;

      this.tokenData = {
        accessToken: access_token,
        expiresAt: Date.now() + expires_in * 1000,
      };

      return access_token;
    } catch (error) {
      const message = this.buildErrorMessage(error);
      throw new Error(message);
    }
  }

  private buildErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        const detail =
          error.response.data?.error_description ||
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
