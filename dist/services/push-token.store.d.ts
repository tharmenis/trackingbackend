/**
 * In-memory push token registry keyed by authenticated user id.
 * Replace with persistent storage if tokens must survive restarts.
 */
export declare class PushTokenStore {
    private readonly tokensByUserId;
    upsert(userId: string, expoPushToken: string): void;
    getByUserId(userId: string): string | null;
}
