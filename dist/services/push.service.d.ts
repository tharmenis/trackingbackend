import { Expo } from "expo-server-sdk";
import { Alarm } from "../types.js";
export declare class PushService {
    private readonly expo;
    constructor(expoClient?: Expo);
    sendHighAlarmNotification(pushToken: string, alarm: Alarm): Promise<void>;
}
