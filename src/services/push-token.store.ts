import { Expo } from "expo-server-sdk";

/**
 * In-memory push token registry keyed by authenticated user id.
 * Replace with persistent storage if tokens must survive restarts.
 */
export class PushTokenStore {
  private readonly tokensByUserId = new Map<string, string>();

  upsert(userId: string, expoPushToken: string): void {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      throw new Error("Invalid Expo push token");
    }

    this.tokensByUserId.set(userId, expoPushToken);
  }

  getByUserId(userId: string): string | null {
    return this.tokensByUserId.get(userId) ?? null;
  }
}
