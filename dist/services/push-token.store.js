import { Expo } from "expo-server-sdk";
/**
 * In-memory push token registry keyed by authenticated user id.
 * Replace with persistent storage if tokens must survive restarts.
 */
export class PushTokenStore {
    constructor() {
        this.tokensByUserId = new Map();
    }
    upsert(userId, expoPushToken) {
        if (!Expo.isExpoPushToken(expoPushToken)) {
            throw new Error("Invalid Expo push token");
        }
        this.tokensByUserId.set(userId, expoPushToken);
    }
    getByUserId(userId) {
        return this.tokensByUserId.get(userId) ?? null;
    }
}
