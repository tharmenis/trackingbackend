import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { Alarm } from "../types.js";

export class PushService {
  private readonly expo: Expo;

  constructor(expoClient?: Expo) {
    this.expo = expoClient ?? new Expo();
  }

  async sendHighAlarmNotification(pushToken: string, alarm: Alarm): Promise<void> {
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new Error("Invalid Expo push token");
    }

    const message: ExpoPushMessage = {
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
