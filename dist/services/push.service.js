import { Expo } from "expo-server-sdk";
export class PushService {
    constructor(expoClient) {
        this.expo = expoClient ?? new Expo();
    }
    async sendHighAlarmNotification(pushToken, alarm) {
        if (!Expo.isExpoPushToken(pushToken)) {
            throw new Error("Invalid Expo push token");
        }
        const message = {
            to: pushToken,
            sound: "default",
            title: `High alarm: ${alarm.title}`,
            body: alarm.description ?? "A high severity alarm needs attention.",
            data: {
                type: "alarm",
                alarmId: alarm.id,
                severity: alarm.severity,
                title: alarm.title,
            },
        };
        const chunks = this.expo.chunkPushNotifications([message]);
        for (const chunk of chunks) {
            await this.expo.sendPushNotificationsAsync(chunk);
        }
    }
}
