export class AlarmPollerService {
    constructor(params) {
        this.seenHighAlarmIds = new Set();
        this.pollerHandle = null;
        this.initialized = false;
        this.alarmService = params.alarmService;
        this.pushTokenStore = params.pushTokenStore;
        this.pushService = params.pushService;
        this.intervalMs = params.intervalMs;
    }
    start() {
        if (this.pollerHandle) {
            return;
        }
        this.pollerHandle = setInterval(() => {
            void this.pollOnce();
        }, this.intervalMs);
        void this.pollOnce();
    }
    stop() {
        if (!this.pollerHandle) {
            return;
        }
        clearInterval(this.pollerHandle);
        this.pollerHandle = null;
    }
    async pollOnce() {
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Alarm poll failed: ${message}`);
        }
    }
}
