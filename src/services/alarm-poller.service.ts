import { AlarmService } from "./alarm.service.js";
import { PushService } from "./push.service.js";
import { PushTokenStore } from "./push-token.store.js";

export class AlarmPollerService {
  private readonly alarmService: AlarmService;
  private readonly pushTokenStore: PushTokenStore;
  private readonly pushService: PushService;
  private readonly intervalMs: number;
  private readonly seenHighAlarmIds = new Set<string>();
  private pollerHandle: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor(params: {
    alarmService: AlarmService;
    pushTokenStore: PushTokenStore;
    pushService: PushService;
    intervalMs: number;
  }) {
    this.alarmService = params.alarmService;
    this.pushTokenStore = params.pushTokenStore;
    this.pushService = params.pushService;
    this.intervalMs = params.intervalMs;
  }

  start(): void {
    if (this.pollerHandle) {
      return;
    }

    this.pollerHandle = setInterval(() => {
      void this.pollOnce();
    }, this.intervalMs);

    void this.pollOnce();
  }

  stop(): void {
    if (!this.pollerHandle) {
      return;
    }

    clearInterval(this.pollerHandle);
    this.pollerHandle = null;
  }

  async pollOnce(): Promise<void> {
    try {
      const highActiveAlarms = await this.alarmService.fetchAlarms({
        status: "OPEN",
        severity: "HIGH",
      });

      const currentHighIds = new Set(highActiveAlarms.map((alarm) => alarm.id));

      if (!this.initialized) {
        for (const alarm of highActiveAlarms) {
          this.seenHighAlarmIds.add(alarm.id);
        }
        this.initialized = true;
        return;
      }

      for (const alarm of highActiveAlarms) {
        if (this.seenHighAlarmIds.has(alarm.id)) {
          continue;
        }

        this.seenHighAlarmIds.add(alarm.id);

        if (!alarm.assignedUserId) {
          continue;
        }

        const pushToken = this.pushTokenStore.getByUserId(alarm.assignedUserId);
        if (!pushToken) {
          continue;
        }

        await this.pushService.sendHighAlarmNotification(pushToken, alarm);
      }

      for (const id of this.seenHighAlarmIds) {
        if (!currentHighIds.has(id)) {
          this.seenHighAlarmIds.delete(id);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Alarm poll failed: ${message}`);
    }
  }
}
