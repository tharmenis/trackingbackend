export declare class AuthService {
    private tokenData;
    private readonly openRemoteUrl;
    private readonly realm;
    private readonly clientId;
    private readonly clientSecret;
    constructor(config?: {
        openRemoteUrl: string;
        realm: string;
        clientId: string;
        clientSecret: string;
    });
    getToken(): Promise<string>;
    private isExpired;
    private refreshToken;
    private buildErrorMessage;
}
